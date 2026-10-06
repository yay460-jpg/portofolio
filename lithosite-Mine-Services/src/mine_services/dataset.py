import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .persistence import PersistenceStore


class DatasetManager:
    """Named editable datasets kept separately from sealed backup snapshots."""

    FORMAT_VERSION = "1.0"
    DEFAULT_NAME = "Mine-Services-Working"

    def __init__(self, store, directory):
        self.store = store
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.active = None

    @staticmethod
    def _safe_name(name):
        value = str(name or "").strip()
        value = re.sub(r"[^A-Za-z0-9._ -]+", "-", value)
        value = re.sub(r"\s+", " ", value).strip(" .")
        if not value:
            raise ValueError("DATASET_NAME_REQUIRED")
        return value[:120]

    def _path(self, name):
        return self.directory / (self._safe_name(name) + ".json")

    def _read(self, path):
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _validate_document(self, document):
        if not isinstance(document, dict):
            raise ValueError("DATASET_INVALID")
        if document.get("format_version") != self.FORMAT_VERSION:
            raise ValueError("DATASET_FORMAT_INVALID")
        if document.get("schema_version") != self.store.schema.SCHEMA_VERSION:
            raise ValueError("DATASET_SCHEMA_MISMATCH")
        if not document.get("dataset_id") or not document.get("dataset_name"):
            raise ValueError("DATASET_METADATA_INVALID")
        payload = document.get("payload")
        if not isinstance(payload, dict) or not isinstance(payload.get("data"), dict):
            raise ValueError("DATASET_PAYLOAD_INVALID")

        candidate = PersistenceStore(schema_module=self.store.schema)
        controlled_lists = document.get("controlled_lists")
        if isinstance(controlled_lists, dict):
            candidate.controlled_lists = {
                name: set(values) for name, values in controlled_lists.items() if isinstance(values, list)
            }
        for entity in self.store.schema.DOMAIN_ENTITIES:
            rows = payload["data"].get(entity, {})
            if not isinstance(rows, dict):
                raise ValueError("DATASET_ENTITY_INVALID:" + entity)
            for pk, row in rows.items():
                if not isinstance(row, dict) or row.get(self.store.schema.PKS[entity]) != pk:
                    raise ValueError("DATASET_PRIMARY_KEY_INVALID:" + entity)
                candidate.insert(entity, pk, row)

        from .validation import ValidationEngine
        errors = ValidationEngine(schema_module=self.store.schema).validate_dataset(
            {entity: list(candidate.all(entity)) for entity in self.store.schema.DOMAIN_ENTITIES},
            candidate,
            "LOAD",
        )
        if errors:
            raise ValueError("DATASET_VALIDATION_FAILED")

    def _document(self, name, dataset_id=None, created_at=None):
        now = datetime.now(timezone.utc).isoformat()
        snapshot = self.store.snapshot()
        return {
            "format_version": self.FORMAT_VERSION,
            "dataset_id": dataset_id or str(uuid.uuid4()),
            "dataset_name": name,
            "schema_version": self.store.schema.SCHEMA_VERSION,
            "created_at": created_at or now,
            "updated_at": now,
            "controlled_lists": {name: sorted(values) for name, values in self.store.controlled_lists.items()},
            "payload": {"data": snapshot["data"]},
            "status": "READY",
        }

    def list(self):
        items = []
        for path in sorted(self.directory.glob("*.json")):
            try:
                document = self._read(path)
                if document.get("format_version") != self.FORMAT_VERSION:
                    continue
                items.append({
                    "dataset_id": document.get("dataset_id"),
                    "dataset_name": document.get("dataset_name") or path.stem,
                    "schema_version": document.get("schema_version"),
                    "created_at": document.get("created_at"),
                    "updated_at": document.get("updated_at"),
                    "active": bool(self.active and self.active.get("dataset_id") == document.get("dataset_id")),
                    "filename": path.name,
                })
            except (OSError, ValueError, json.JSONDecodeError):
                continue
        return items

    def save(self, name=None):
        target_name = self._safe_name(name or (self.active or {}).get("dataset_name") or self.DEFAULT_NAME)
        existing = self.active if self.active and self.active.get("dataset_name") == target_name else None
        path = self._path(target_name)
        if path.exists() and existing is None:
            existing_doc = self._read(path)
            dataset_id = existing_doc.get("dataset_id")
            created_at = existing_doc.get("created_at")
        else:
            dataset_id = (existing or {}).get("dataset_id")
            created_at = (existing or {}).get("created_at")

        document = self._document(target_name, dataset_id=dataset_id, created_at=created_at)
        self._validate_document(document)
        temp = path.with_suffix(".json.tmp")
        temp.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(path)
        self.active = {
            "dataset_id": document["dataset_id"],
            "dataset_name": document["dataset_name"],
            "filename": path.name,
            "created_at": document["created_at"],
            "updated_at": document["updated_at"],
        }
        return {"status": "SAVED", **self.active}

    def save_as(self, name):
        target_name = self._safe_name(name)
        path = self._path(target_name)
        if path.exists():
            raise ValueError("DATASET_EXISTS")
        document = self._document(target_name)
        self._validate_document(document)
        temp = path.with_suffix(".json.tmp")
        temp.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(path)
        self.active = {
            "dataset_id": document["dataset_id"],
            "dataset_name": document["dataset_name"],
            "filename": path.name,
            "created_at": document["created_at"],
            "updated_at": document["updated_at"],
        }
        return {"status": "SAVED_AS", **self.active}

    def load(self, name):
        target_name = self._safe_name(name)
        path = self._path(target_name)
        if not path.is_file():
            raise ValueError("DATASET_NOT_FOUND")
        document = self._read(path)
        self._validate_document(document)
        before = self.store.snapshot()
        self.store.replace({
            "data": document["payload"]["data"],
            "audit": before.get("audit", []),
        })
        controlled_lists = document.get("controlled_lists")
        if isinstance(controlled_lists, dict):
            self.store.controlled_lists = {
                name: set(values) for name, values in controlled_lists.items() if isinstance(values, list)
            }
        self.active = {
            "dataset_id": document["dataset_id"],
            "dataset_name": document["dataset_name"],
            "filename": path.name,
            "created_at": document["created_at"],
            "updated_at": document["updated_at"],
        }
        return {"status": "LOADED", **self.active}

    def active_info(self):
        return dict(self.active) if self.active else None
