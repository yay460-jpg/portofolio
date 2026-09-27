from openpyxl import load_workbook
from datetime import datetime,timezone
import uuid
from .schema import DOMAIN_ENTITIES,HEADERS,PKS
from .validation import ValidationEngine
from .persistence import PersistenceStore
class ImportCoordinator:
 def __init__(self,store,validator=None,transaction=None):
  from .transaction import TransactionManager
  self.store=store;self.validator=validator or ValidationEngine();self.transaction=transaction or TransactionManager(store)
 def read_xlsx(self,path):
  wb=load_workbook(path,data_only=True);missing=(set(DOMAIN_ENTITIES)|{"_System","_Lists"})-set(wb.sheetnames)
  if missing:return None,[{"code":"VAL-E011","message":f"Missing sheets: {sorted(missing)}"}]
  rows={}
  for e in DOMAIN_ENTITIES:
   vals=list(wb[e].values);headers=list(vals[0])
   if headers!=HEADERS[e]:return None,[{"code":"VAL-E011","field":e,"message":"Header mismatch"}]
   rows[e]=[dict(zip(headers,v)) for v in vals[1:] if not all(x is None for x in v)]
  return rows,[]
 def import_xlsx(self,path):
  rows,errors=self.read_xlsx(path)
  if errors:return {"status":"REJECTED","rows_committed":0,"errors":errors}
  return self.import_dataset(rows)
 def import_dataset(self,rows):
  pre=self.validator.validate_dataset(rows,self.store,"IMPORT")
  if pre:return {"status":"REJECTED","rows_committed":0,"errors":pre}
  staged=PersistenceStore();staged.replace(self.store.snapshot())
  for entity,items in rows.items():
   for row in items:
    pk=PKS[entity]
    if staged.exists(entity,row.get(pk)):return {"status":"REJECTED","rows_committed":0,"errors":[{"code":"VAL-E004","field":pk,"message":"Primary key already exists"}]}
    staged.insert(entity,row[pk],row)
  errors=self.validator.validate_dataset(rows,staged,"IMPORT")
  if errors:return {"status":"REJECTED","rows_committed":0,"errors":errors}
  self.transaction.begin()
  try:
   for entity,items in rows.items():
    for row in items:self.store.insert(entity,row[PKS[entity]],row)
   event={"audit_id":str(uuid.uuid4()),"timestamp":datetime.now(timezone.utc).isoformat(),"entity":"_System","entity_id":"IMPORT","action":"IMPORT","old_value":None,"new_value":str({e:len(v) for e,v in rows.items()}),"source":"ImportCoordinator"}
   self.store.add_audit(event);self.transaction.commit()
   return {"status":"COMMITTED","rows_committed":sum(len(v) for v in rows.values()),"errors":[]}
  except Exception:
   self.transaction.rollback();return {"status":"REJECTED","rows_committed":0,"errors":[{"code":"VAL-E012","message":"Atomic import aborted"}]}
