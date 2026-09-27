from openpyxl import load_workbook
from .schema import DOMAIN_ENTITIES,HEADERS,PKS
from .validation import ValidationEngine
class ImportCoordinator:
 def __init__(self,store,validator=None,transaction=None):
  from .transaction import TransactionManager
  self.store=store;self.validator=validator or ValidationEngine();self.transaction=transaction or TransactionManager(store)
 def read_xlsx(self,path):
  wb=load_workbook(path,data_only=True); required=set(DOMAIN_ENTITIES)|{"_System","_Lists"}
  missing=required-set(wb.sheetnames)
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
  errors=self.validator.validate_dataset(rows,self.store,"IMPORT")
  if errors:return {"status":"REJECTED","rows_committed":0,"errors":errors}
  self.transaction.begin()
  try:
   for entity,items in rows.items():
    for row in items:self.store.insert(entity,row[PKS[entity]],row)
   self.transaction.commit();return {"status":"COMMITTED","rows_committed":sum(len(v) for v in rows.values()),"errors":[]}
  except Exception:
   self.transaction.rollback();return {"status":"REJECTED","rows_committed":0,"errors":[{"code":"VAL-E012","message":"Atomic import aborted"}]}
