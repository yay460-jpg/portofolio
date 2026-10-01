import hashlib
import json
import uuid
from datetime import datetime, timezone

from .persistence import PersistenceStore
from . import schema as DEFAULT_SCHEMA
from .transaction import TransactionManager
from .validation import ValidationEngine
from .audit import AuditRepository


class SnapshotManager:
    def __init__(self, store, validator=None, audit_repository=None, schema_module=None):
        self.store = store
        self.schema = schema_module or getattr(store, "schema", None) or DEFAULT_SCHEMA
        self.validator = validator or ValidationEngine(schema_module=self.schema)
        self.audit_repository = audit_repository or AuditRepository(store)

    @staticmethod
    def _hash_payload(payload):
        raw = json.dumps(
            payload,
            sort_keys=True,
            default=str,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode()
        return hashlib.sha256(raw).hexdigest()

    def capture(self, source="runtime"):
        payload = self.store.snapshot()
        return {
            "snapshot_id": str(uuid.uuid4()),
            "schema_version": self.schema.SCHEMA_VERSION,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "entity_counts": {
                entity: len(payload["data"].get(entity, {}))
                for entity in self.schema.DOMAIN_ENTITIES
            },
            "audit_included": True,
            "payload": payload,
            "checksum": self._hash_payload(payload),
            "checksum_algorithm": "SHA-256",
            "status": "SEALED",
        }

    def verify(self, snapshot):
        required = {
            "snapshot_id",
            "schema_version",
            "created_at",
            "source",
            "entity_counts",
            "audit_included",
            "payload",
            "checksum",
            "checksum_algorithm",
            "status",
        }
        if not isinstance(snapshot, dict) or not required.issubset(snapshot):
            return False
        if snapshot.get("schema_version") != self.schema.SCHEMA_VERSION:
            return False
        if snapshot.get("checksum_algorithm") != "SHA-256":
            return False
        if snapshot.get("status") not in {"SEALED", "READY"}:
            return False
        if not isinstance(snapshot.get("entity_counts"), dict):
            return False

        payload = snapshot.get("payload")
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), dict):
            return False

        for entity in self.schema.DOMAIN_ENTITIES:
            rows = payload["data"].get(entity, {})
            if not isinstance(rows, dict):
                return False
            if snapshot["entity_counts"].get(entity) != len(rows):
                return False

        if snapshot.get("audit_included") is True and not isinstance(payload.get("audit", []), list):
            return False

        return self._hash_payload(payload) == snapshot.get("checksum")

    def _validate_payload(self, payload):
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), dict):
            return [{"code": "VAL-E011", "field": None, "message": "Snapshot payload is invalid"}]

        candidate = PersistenceStore(schema_module=self.schema)
        for entity in self.schema.DOMAIN_ENTITIES:
            rows = payload["data"].get(entity, {})
            if not isinstance(rows, dict):
                return [{"code": "VAL-E011", "field": entity, "message": "Snapshot entity payload is invalid"}]
            for pk, row in rows.items():
                if not isinstance(row, dict) or row.get(self.schema.PKS[entity]) != pk:
                    return [{"code": "VAL-E003", "field": self.schema.PKS[entity], "message": "Snapshot primary key mismatch"}]
                candidate.insert(entity, pk, row)

        errors = []
        dataset = {entity: list(candidate.all(entity)) for entity in DOMAIN_ENTITIES}
        errors.extend(self.validator.validate_dataset(dataset, candidate, "RESTORE"))

        audit = payload.get("audit", [])
        if not isinstance(audit, list):
            errors.append({"code": "VAL-E011", "field": "AuditLog", "message": "Snapshot audit payload is invalid"})
        else:
            for event in audit:
                if not isinstance(event, dict):
                    errors.append({"code": "VAL-E011", "field": "AuditLog", "message": "Audit event is invalid"})
                    continue
                for field in ("audit_id", "timestamp", "entity", "entity_id", "action", "source"):
                    if event.get(field) in (None, ""):
                        errors.append({"code": "VAL-E003", "field": field, "message": "Audit field is required"})

        return errors

    def restore(self, snapshot, mode="REPLACE_RUNTIME"):
        if mode not in {"REPLACE_RUNTIME", "MERGE_RUNTIME", "DRY_RUN"}:
            return {"status": "REJECTED", "reason": "MODE_INVALID"}

        if not self.verify(snapshot):
            return {"status": "REJECTED", "reason": "CHECKSUM_OR_SCHEMA"}

        before = self.store.snapshot()

        if mode == "REPLACE_RUNTIME":
            candidate_payload = snapshot["payload"]
        elif mode == "MERGE_RUNTIME":
            merged = self.store.snapshot()
            for entity in DOMAIN_ENTITIES:
                incoming = snapshot["payload"]["data"].get(entity, {})
                existing = merged["data"].setdefault(entity, {})
                collisions = set(existing).intersection(incoming)
                if collisions:
                    return {
                        "status": "REJECTED",
                        "reason": "MERGE_PK_COLLISION",
                        "entity": entity,
                        "ids": sorted(collisions),
                    }
                existing.update(incoming)
            if snapshot["payload"].get("audit"):
                merged["audit"].extend(snapshot["payload"]["audit"])
            candidate_payload = merged
        else:
            candidate_payload = snapshot["payload"]

        errors = self._validate_payload(candidate_payload)
        if errors:
            return {"status": "REJECTED", "reason": "VALIDATION_FAILED", "errors": errors}

        if mode == "DRY_RUN":
            return {"status": "VALIDATED", "mode": mode}

        tx = TransactionManager(self.store)
        tx.begin()
        try:
            self.store.replace(candidate_payload)
            self.audit_repository.append(
                entity="_System",
                entity_id=snapshot["snapshot_id"],
                action="RESTORE",
                request_id=snapshot["snapshot_id"],
                old_value=json.dumps(before, default=str, sort_keys=True),
                new_value=json.dumps(candidate_payload, default=str, sort_keys=True),
                source="SnapshotManager",
            )
            tx.commit()
            return {"status": "COMMITTED", "mode": mode, "snapshot_id": snapshot["snapshot_id"]}
        except Exception:
            tx.rollback()
            return {"status": "REJECTED", "reason": "ATOMIC_ABORT"}
