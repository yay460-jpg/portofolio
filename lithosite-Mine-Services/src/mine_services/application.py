from datetime import datetime,timezone
import json,uuid
from .validation import ValidationEngine,ValidationError
from .persistence import PersistenceStore
from .transaction import TransactionManager
from .schema import PKS,HEADERS
class ApplicationService:
 def __init__(self,store=None,validator=None):self.store=store or PersistenceStore();self.validator=validator or ValidationEngine();self.tx=TransactionManager(self.store);self._requests=set()
 def create(self,entity,row,request_id):
  if request_id in self._requests:return {"status":"DUPLICATE_REQUEST"}
  errors=self.validator.validate(entity,row,self.store,"CREATE")
  if errors:return {"status":"REJECTED","errors":errors}
  row=dict(row);now=datetime.now(timezone.utc).isoformat()
  if "created_at" in HEADERS[entity]:row["created_at"]=now;row["updated_at"]=now
  self.tx.begin()
  try:
   pk=PKS[entity];self.store.insert(entity,row[pk],row);self._audit(entity,row[pk],"CREATE",request_id,None,row);self.tx.commit();self._requests.add(request_id);return {"status":"COMMITTED","entity_id":row[pk]}
  except Exception:self.tx.rollback();raise
 def update(self,entity,pk,patch,request_id):
  if request_id in self._requests:return {"status":"DUPLICATE_REQUEST"}
  old=self.store.get(entity,pk)
  if old is None:return {"status":"REJECTED","errors":[ValidationError("ENTITY_NOT_FOUND",None,"Entity not found")]}
  row={**old,**patch}
  if "created_at" in old:row["created_at"]=old["created_at"]
  errors=self.validator.validate(entity,row,self.store,"UPDATE",old)
  if errors:return {"status":"REJECTED","errors":errors}
  if "updated_at" in HEADERS[entity]:row["updated_at"]=datetime.now(timezone.utc).isoformat()
  self.tx.begin()
  try:self.store.update(entity,pk,row);self._audit(entity,pk,"UPDATE",request_id,old,row);self.tx.commit();self._requests.add(request_id);return {"status":"COMMITTED","entity_id":pk}
  except Exception:self.tx.rollback();raise
 def delete(self,entity,pk,request_id):
  if request_id in self._requests:return {"status":"DUPLICATE_REQUEST"}
  old=self.store.get(entity,pk)
  if old is None:return {"status":"REJECTED","errors":[ValidationError("ENTITY_NOT_FOUND",None,"Entity not found")]}
  self.tx.begin()
  try:self.store.delete(entity,pk);self._audit(entity,pk,"DELETE",request_id,old,None);self.tx.commit();self._requests.add(request_id);return {"status":"COMMITTED","entity_id":pk}
  except Exception:self.tx.rollback();raise
 def read(self,entity,pk=None):return self.store.get(entity,pk) if pk is not None else self.store.all(entity)
 def _audit(self,entity,pk,action,request_id,old,new):
  self.store.add_audit({"audit_id":str(uuid.uuid4()),"timestamp":datetime.now(timezone.utc).isoformat(),"entity":entity,"entity_id":pk,"action":action,"old_value":json.dumps(old,default=str,sort_keys=True) if old is not None else None,"new_value":json.dumps(new,default=str,sort_keys=True) if new is not None else None,"source":request_id})
