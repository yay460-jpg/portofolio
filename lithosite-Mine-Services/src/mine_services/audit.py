from datetime import datetime, timezone
import uuid

from .schema import HEADERS


class AuditRepository:
    """Append-only audit boundary used by application mutations."""

    def __init__(self, store=None):
        self.store = store
        self._events = []

    def append(self, entity, entity_id, action, request_id, old_value=None, new_value=None, source=None):
        event = {
            "audit_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "entity": entity,
            "entity_id": entity_id,
            "action": action,
            "old_value": old_value,
            "new_value": new_value,
            "source": source or request_id,
        }
        if self.store is not None:
            self.store.add_audit(event)
        else:
            self._events.append(dict(event))
        return event

    def all(self):
        if self.store is not None:
            return self.store.audit()
        return list(self._events)
