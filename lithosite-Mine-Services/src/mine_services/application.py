from datetime import datetime, timezone
import json

from .audit import AuditRepository
from .validation import ValidationEngine
from .persistence import PersistenceStore
from .transaction import TransactionManager
from .schema import PKS as DEFAULT_PKS, HEADERS as DEFAULT_HEADERS, SYSTEM_FIELDS as DEFAULT_SYSTEM_FIELDS


class ApplicationService:
    """Only application-level entry point for runtime mutations."""

    def __init__(self, store=None, validator=None, audit_repository=None, schema_module=None):
        self.store = store or PersistenceStore(schema_module=schema_module)
        self.schema = schema_module or getattr(self.store, "schema", None)
        if self.schema is None:
            from . import schema as self_schema
            self.schema = self_schema
        self.validator = validator or ValidationEngine(schema_module=self.schema)
        self.tx = TransactionManager(self.store)
        self.audit_repository = audit_repository or AuditRepository(self.store)
        self._requests = set()

    @staticmethod
    def _app_error(code, message, field=None):
        return {"code": code, "field": field, "message": message}

    def _request_guard(self, request_id):
        if request_id in (None, ""):
            return {
                "status": "REJECTED",
                "errors": [self._app_error("APP-001", "request_id is required", "request_id")],
            }
        if request_id in self._requests:
            return {"status": "DUPLICATE_REQUEST"}
        return None


    def _prepare_row(self, entity, row, context="CREATE", existing=None):
        prepared = dict(row)
        if entity != "Operations":
            return prepared
        if str(prepared.get("activity") or "").strip().lower() != "hauling":
            return prepared
        work_front = self.store.get("WorkFront", prepared.get("work_front_id")) or {}
        profile_id = prepared.get("capacity_profile_id") or work_front.get("capacity_profile_id")
        applied = prepared.get("applied_capacity")
        if context == "UPDATE" and existing:
            applied = existing.get("applied_capacity") if existing.get("applied_capacity") not in (None, "") else applied
            profile_id = existing.get("capacity_profile_id") or profile_id
        if applied in (None, "") and profile_id:
            profile = self.store.get("GlobalCapacity", profile_id)
            if profile:
                applied = profile.get("capacity_value")
                prepared["capacity_unit"] = profile.get("unit") or "ton"
        if applied not in (None, ""):
            prepared["applied_capacity"] = float(applied)
            prepared["capacity_profile_id"] = profile_id
            prepared["capacity_unit"] = prepared.get("capacity_unit") or "ton"
            if prepared.get("retase") not in (None, ""):
                prepared["quantity"] = float(prepared["retase"]) * float(applied)
                prepared["unit"] = prepared.get("unit") or prepared["capacity_unit"]
        return prepared

    def create(self, entity, row, request_id):
        guard = self._request_guard(request_id)
        if guard:
            return guard

        row = self._prepare_row(entity, row, "CREATE")
        errors = self.validator.validate(entity, row, self.store, "CREATE")
        if errors:
            return {"status": "REJECTED", "errors": errors}

        row = dict(row)
        now = datetime.now(timezone.utc).isoformat()
        if "created_at" in self.schema.HEADERS[entity]:
            row["created_at"] = now
            row["updated_at"] = now

        self.tx.begin()
        try:
            pk = self.schema.PKS[entity]
            self.store.insert(entity, row[pk], row)
            self._audit(entity, row[pk], "CREATE", request_id, None, row)
            self.tx.commit()
            self._requests.add(request_id)
            return {"status": "COMMITTED", "entity_id": row[pk]}
        except Exception as exc:
            self.tx.rollback()
            code = "APP-005" if exc.__class__.__name__ == "AuditError" else "APP-006"
            return {
                "status": "REJECTED",
                "errors": [self._app_error(code, str(exc) or "Mutation failed")],
            }

    def update(self, entity, pk, patch, request_id):
        guard = self._request_guard(request_id)
        if guard:
            return guard

        old = self.store.get(entity, pk)
        if old is None:
            return {
                "status": "REJECTED",
                "errors": [self._app_error("APP-002", "Entity not found", self.schema.PKS.get(entity))],
            }

        protected = sorted(set(patch).intersection(self.schema.SYSTEM_FIELDS))
        if protected:
            return {
                "status": "REJECTED",
                "errors": [
                    self._app_error("VAL-E010", "System field is generated", field)
                    for field in protected
                ],
            }

        row = {**old, **patch}
        row = self._prepare_row(entity, row, "UPDATE", old)
        if "created_at" in old:
            row["created_at"] = old["created_at"]

        validation_row = {
            field: value
            for field, value in row.items()
            if field not in self.schema.SYSTEM_FIELDS
        }
        errors = self.validator.validate(entity, validation_row, self.store, "UPDATE", old)
        if errors:
            return {"status": "REJECTED", "errors": errors}

        if "updated_at" in self.schema.HEADERS[entity]:
            row["updated_at"] = datetime.now(timezone.utc).isoformat()

        self.tx.begin()
        try:
            self.store.update(entity, pk, row)
            self._audit(entity, pk, "UPDATE", request_id, old, row)
            self.tx.commit()
            self._requests.add(request_id)
            return {"status": "COMMITTED", "entity_id": pk}
        except Exception as exc:
            self.tx.rollback()
            code = "APP-005" if exc.__class__.__name__ == "AuditError" else "APP-006"
            return {
                "status": "REJECTED",
                "errors": [self._app_error(code, str(exc) or "Mutation failed")],
            }

    def delete(self, entity, pk, request_id):
        guard = self._request_guard(request_id)
        if guard:
            return guard

        old = self.store.get(entity, pk)
        if old is None:
            return {
                "status": "REJECTED",
                "errors": [self._app_error("APP-002", "Entity not found", self.schema.PKS.get(entity))],
            }

        refs = {
            "Equipment": [
                ("Operations", "equipment_id"),
                ("Maintenance", "equipment_id"),
                ("Issues", "equipment_id"),
            ],
            "GlobalCapacity": [
                ("WorkFront", "capacity_profile_id"),
                ("Operations", "capacity_profile_id"),
            ],
            "WorkFront": [
                ("Operations", "work_front_id"),
                ("Issues", "work_front_id"),
                ("Plans", "work_front_id"),
                ("HSE", "work_front_id"),
            ],
        }
        for child, field in refs.get(entity, []):
            if any(row.get(field) == pk for row in self.store.all(child)):
                return {
                    "status": "REJECTED",
                    "errors": [self._app_error("APP-004", f"Cannot delete referenced {entity}", field)],
                }

        self.tx.begin()
        try:
            self.store.delete(entity, pk)
            self._audit(entity, pk, "DELETE", request_id, old, None)
            self.tx.commit()
            self._requests.add(request_id)
            return {"status": "COMMITTED", "entity_id": pk}
        except Exception as exc:
            self.tx.rollback()
            code = "APP-005" if exc.__class__.__name__ == "AuditError" else "APP-006"
            return {
                "status": "REJECTED",
                "errors": [self._app_error(code, str(exc) or "Mutation failed")],
            }

    def read(self, entity, pk=None):
        return self.store.get(entity, pk) if pk is not None else self.store.all(entity)

    def _audit(self, entity, pk, action, request_id, old, new):
        try:
            self.audit_repository.append(
                entity=entity,
                entity_id=pk,
                action=action,
                request_id=request_id,
                old_value=json.dumps(old, default=str, sort_keys=True) if old is not None else None,
                new_value=json.dumps(new, default=str, sort_keys=True) if new is not None else None,
                source=request_id,
            )
        except Exception as exc:
            raise AuditError(str(exc)) from exc


class AuditError(RuntimeError):
    pass
