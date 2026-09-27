from datetime import datetime, timezone
import uuid

class AuditRepository:
    def __init__(self):
        self._events=[]

    def append(self, entity, entity_id, action, request_id):
        event={
            "audit_id":str(uuid.uuid4()),
            "timestamp":datetime.now(timezone.utc).isoformat(),
            "entity":entity,
            "entity_id":entity_id,
            "action":action,
            "request_id":request_id,
        }
        self._events.append(event)
        return event

    def all(self):
        return list(self._events)
