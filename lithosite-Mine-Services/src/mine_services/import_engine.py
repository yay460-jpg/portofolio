from __future__ import annotations
from .schema import ENTITIES
from .validation import ValidationEngine

class ImportCoordinator:
    """Stages a complete dataset and commits it only when validation passes."""
    def __init__(self, store, validator=None, transaction=None):
        from .transaction import TransactionManager
        self.store=store
        self.validator=validator or ValidationEngine()
        self.transaction=transaction or TransactionManager(store)

    def import_dataset(self, rows_by_entity):
        errors=self.validator.validate_dataset(rows_by_entity, store=self.store, context="IMPORT")
        if errors:
            return {"status":"REJECTED","rows_read":sum(len(v) for v in rows_by_entity.values()),"rows_committed":0,"errors":errors}
        staged=self.store.snapshot()
        try:
            self.transaction.begin()
            for entity, rows in rows_by_entity.items():
                pk=ENTITIES[entity]["pk"]
                for row in rows:
                    if self.store.exists(entity,row[pk]):
                        raise ValueError(f"PK_DUPLICATE:{entity}.{pk}:{row[pk]}")
                    self.store.insert(entity,row[pk],row)
            self.transaction.commit()
            return {"status":"COMMITTED","rows_read":sum(len(v) for v in rows_by_entity.values()),"rows_committed":sum(len(v) for v in rows_by_entity.values()),"errors":[]}
        except Exception as exc:
            self.store.replace(staged)
            if self.transaction.active:
                self.transaction.rollback()
            return {"status":"REJECTED","rows_read":sum(len(v) for v in rows_by_entity.values()),"rows_committed":0,"errors":[str(exc)]}
