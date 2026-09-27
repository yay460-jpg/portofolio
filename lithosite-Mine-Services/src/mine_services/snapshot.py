import hashlib,json,uuid
from datetime import datetime,timezone
class SnapshotManager:
 def __init__(self,store):self.store=store
 def capture(self):
  payload=self.store.snapshot();raw=json.dumps(payload,sort_keys=True,default=str,separators=(",",":"),ensure_ascii=False).encode()
  return {"snapshot_id":str(uuid.uuid4()),"schema_version":"A.1","created_at":datetime.now(timezone.utc).isoformat(),"payload":payload,"checksum":hashlib.sha256(raw).hexdigest(),"checksum_algorithm":"SHA-256","status":"SEALED"}
 def verify(self,s):
  raw=json.dumps(s["payload"],sort_keys=True,default=str,separators=(",",":"),ensure_ascii=False).encode();return s.get("schema_version")=="A.1" and hashlib.sha256(raw).hexdigest()==s.get("checksum")
 def restore(self,s,mode="REPLACE_RUNTIME"):
  if not self.verify(s):return {"status":"REJECTED","reason":"CHECKSUM_OR_SCHEMA"}
  if mode=="DRY_RUN":return {"status":"VALIDATED","mode":mode}
  before=self.store.snapshot()
  try:
   if mode=="REPLACE_RUNTIME":self.store.replace(s["payload"])
   elif mode=="MERGE_RUNTIME":
    merged=self.store.snapshot()
    for e,rows in s["payload"]["data"].items():merged["data"].setdefault(e,{}).update(rows)
    merged["audit"].extend(s["payload"].get("audit",[]));self.store.replace(merged)
   else:return {"status":"REJECTED","reason":"MODE_INVALID"}
   self.store.save();return {"status":"COMMITTED","mode":mode}
  except Exception:self.store.replace(before);raise
