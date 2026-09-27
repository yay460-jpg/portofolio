from copy import deepcopy
from pathlib import Path
from tempfile import NamedTemporaryFile
import json
from openpyxl import load_workbook
from .schema import DOMAIN_ENTITIES,HEADERS,PKS
class PersistenceStore:
 def __init__(self,path=None):
  self.path=Path(path) if path else None; self._data={e:{} for e in DOMAIN_ENTITIES}; self._audit=[]; self.controlled_lists={}
  if self.path and self.path.exists(): self.load()
 def snapshot(self): return {"data":deepcopy(self._data),"audit":deepcopy(self._audit)}
 def replace(self,s): self._data=deepcopy(s["data"]); self._audit=deepcopy(s.get("audit",[]))
 def exists(self,e,pk): return pk in self._data.get(e,{})
 def get(self,e,pk): return deepcopy(self._data.get(e,{}).get(pk))
 def all(self,e): return deepcopy(list(self._data.get(e,{}).values()))
 def insert(self,e,pk,row): self._data.setdefault(e,{})[pk]=deepcopy(dict(row))
 def update(self,e,pk,row):
  if not self.exists(e,pk): raise KeyError(pk)
  self._data[e][pk]=deepcopy(dict(row))
 def delete(self,e,pk):
  if not self.exists(e,pk): raise KeyError(pk)
  del self._data[e][pk]
 def add_audit(self,event): self._audit.append(deepcopy(event))
 def audit(self): return deepcopy(self._audit)
 def load(self):
  wb=load_workbook(self.path,data_only=True)
  for e in DOMAIN_ENTITIES:
   rows=list(wb[e].values); headers=list(rows[0])
   if headers!=HEADERS[e]: raise ValueError(f"HEADER_MISMATCH:{e}")
   self._data[e]={}; pk=PKS[e]
   for vals in rows[1:]:
    if all(v is None for v in vals): continue
    row=dict(zip(headers,vals)); self._data[e][row[pk]]=row
  if "_Lists" in wb.sheetnames:
   vals=list(wb["_Lists"].values); self.controlled_lists={h:{r[i] for r in vals[1:] if i<len(r) and r[i] not in (None,"")} for i,h in enumerate(vals[0])}
  if "AuditLog" in wb.sheetnames:
   rows=list(wb["AuditLog"].values); headers=list(rows[0])
   if headers!=HEADERS["AuditLog"]: raise ValueError("HEADER_MISMATCH:AuditLog")
   self._audit=[dict(zip(headers,v)) for v in rows[1:] if not all(x is None for x in v)]
 def save(self):
  if not self.path: return
  wb=load_workbook(self.path)
  for e in DOMAIN_ENTITIES:
   ws=wb[e]
   if list(next(ws.iter_rows(min_row=1,max_row=1,values_only=True)))!=HEADERS[e]: raise ValueError(f"HEADER_MISMATCH:{e}")
   if ws.max_row>1: ws.delete_rows(2,ws.max_row-1)
   for row in self.all(e): ws.append([row.get(h) for h in HEADERS[e]])
  ws=wb["AuditLog"]
  if ws.max_row>1: ws.delete_rows(2,ws.max_row-1)
  for row in self.audit(): ws.append([row.get(h) for h in HEADERS["AuditLog"]])
  with NamedTemporaryFile(prefix=self.path.stem+".",suffix=self.path.suffix,dir=self.path.parent,delete=False) as f: tmp=Path(f.name)
  try: wb.save(tmp); tmp.replace(self.path)
  finally:
   if tmp.exists(): tmp.unlink()
