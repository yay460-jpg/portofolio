from __future__ import annotations
from datetime import datetime, timezone
from .persistence import PersistenceStore
from .validation import ValidationEngine, ValidationError
from .audit import AuditRepository

class ApplicationService:
    """Only mutation/query boundary exposed to UI/API callers."""
    def __init__(self, store=None, validator=None, audit=None):
        self.store=store or PersistenceStore()
        self.validator=validator or ValidationEngine()
        self.audit=audit or AuditRepository()
        self._requests=set()

    def create(self, entity, row, request_id):
        return self._mutate("CREATE",entity,row,request_id)

    def update(self, entity, pk, patch, request_id):
        existing=self.store.get(entity,pk)
        if existing is None:
            return {"status":"REJECTED","errors":[ValidationError("ENTITY_NOT_FOUND",None,"Entity not found")]}
        identity_field=self._pk(entity)
        if identity_field in patch and patch[identity_field] != pk:
            return {"status":"REJECTED","errors":[ValidationError("PK_IMMUTABLE",identity_field,"Primary key cannot be changed")]}
        row={**existing, **dict(patch), identity_field: pk}
        row.pop("created_at", None)
        row["updated_at"] = datetime.now(timezone.utc).isoformat()
        return self._mutate("UPDATE",entity,row,request_id,existing=existing)

    def delete(self, entity, pk, request_id):
        if request_id in self._requests:
            return {"status":"DUPLICATE_REQUEST"}
        if not self.store.exists(entity,pk):
            return {"status":"REJECTED","errors":[ValidationError("ENTITY_NOT_FOUND",None,"Entity not found")]}
        before=self.store.snapshot()
        try:
            self.store.delete(entity,pk)
            self.audit.append(entity,pk,"DELETE",request_id)
            self._requests.add(request_id)
            return {"status":"COMMITTED","entity_id":pk}
        except Exception:
            self.store.replace(before)
            raise

    def read(self, entity, pk=None):
        return self.store.get(entity,pk) if pk is not None else self.store.all(entity)

    def _mutate(self, action, entity, row, request_id, existing=None):
        if request_id in self._requests:
            return {"status":"DUPLICATE_REQUEST"}
        if action=="UPDATE" and existing is None:
            return {"status":"REJECTED","errors":[ValidationError("ENTITY_NOT_FOUND",None,"Entity not found")]}
        errors=self.validator.validate(entity,row,self.store,context=action,existing=existing)
        if errors:
            return {"status":"REJECTED","errors":errors}
        before=self.store.snapshot()
        pk=self._pk(entity)
        key=row[pk]
        row=dict(row)
        if action=="CREATE":
            row["created_at"] = datetime.now(timezone.utc).isoformat()
            row["updated_at"] = row["created_at"]
        try:
            if action=="CREATE":
                self.store.insert(entity,key,row)
            else:
                self.store.update(entity,key,row)
            self.audit.append(entity,key,action,request_id)
            self._requests.add(request_id)
            return {"status":"COMMITTED","entity_id":key}
        except Exception:
            self.store.replace(before)
            raise

    def _pk(self,entity):
        from .schema import ENTITIES
        return ENTITIES[entity]["pk"]
