from __future__ import annotations
from datetime import datetime, timezone
import hashlib, json, uuid

class SnapshotManager:
    """Creates and verifies one consistent offline runtime snapshot."""
    def __init__(self, store):
        self.store=store

    def capture(self):
        payload=self.store.snapshot()
        raw=json.dumps(payload,sort_keys=True,separators=(",",":"),default=str).encode()
        checksum=hashlib.sha256(raw).hexdigest()
        return {"snapshot_id":str(uuid.uuid4()),"schema_version":"A.1","created_at":datetime.now(timezone.utc).isoformat(),"payload":payload,"checksum":checksum,"checksum_algorithm":"SHA-256","status":"SEALED"}

    def verify(self, snapshot):
        raw=json.dumps(snapshot["payload"],sort_keys=True,separators=(",",":"),default=str).encode()
        return hashlib.sha256(raw).hexdigest()==snapshot.get("checksum") and snapshot.get("schema_version")=="A.1"

    def restore(self, snapshot, mode="REPLACE_RUNTIME"):
        if not self.verify(snapshot):
            return {"status":"REJECTED","reason":"CHECKSUM_OR_SCHEMA"}
        before=self.store.snapshot()
        try:
            if mode=="REPLACE_RUNTIME":
                self.store.replace(snapshot["payload"])
            elif mode=="MERGE_RUNTIME":
                merged=self.store.snapshot()
                for entity,rows in snapshot["payload"].items():
                    merged.setdefault(entity,{}).update(rows)
                self.store.replace(merged)
            elif mode=="DRY_RUN":
                return {"status":"VALIDATED","mode":mode}
            else:
                return {"status":"REJECTED","reason":"MODE_INVALID"}
            return {"status":"COMMITTED","mode":mode}
        except Exception:
            self.store.replace(before)
            raise
