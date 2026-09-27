from dataclasses import dataclass
import re
from .schema import *
@dataclass(frozen=True)
class ValidationError:
 code:str; field:str|None; message:str
class ValidationEngine:
 def validate(self,entity,row,store=None,context="CREATE",existing=None):
  e=[]
  if entity not in DOMAIN_ENTITIES:return [ValidationError("VAL-E011",None,"Unknown entity")]
  pk=PKS[entity]
  for f in REQUIRED[entity]:
   if row.get(f) in (None,""):e.append(ValidationError("VAL-E003",f,"Required field is blank"))
  if existing is not None and row.get(pk)!=existing.get(pk):e.append(ValidationError("VAL-E010",pk,"Primary key is immutable"))
  for f in row:
   if f in SYSTEM_FIELDS and context in {"CREATE","IMPORT","RESTORE"}:e.append(ValidationError("VAL-E010",f,"System field is generated"))
  for f in NUMERIC:
   if f in row and row[f] not in (None,"") and (not isinstance(row[f],(int,float)) or isinstance(row[f],bool) or row[f]<0):e.append(ValidationError("VAL-E007",f,"Numeric value must be >= 0"))
  for key,(target,targetpk,required) in FK.items():
   owner,f=key.split(".")
   if owner==entity and row.get(f) not in (None,"") and store and not store.exists(target,row[f]):e.append(ValidationError("VAL-E005",f,f"Referenced {target}.{targetpk} not found"))
  lists=getattr(store,"controlled_lists",{}) if store else {}
  for key,listname in CONTROLLED.items():
   owner,f=key.split(".")
   if owner==entity and row.get(f) not in (None,"") and lists and row[f] not in lists.get(listname,set()):e.append(ValidationError("VAL-E006",f,"Controlled value is invalid"))
  if entity=="Equipment" and row.get("owner_type")=="Contractor" and not row.get("owner_name"):e.append(ValidationError("VAL-E008","owner_name","owner_name required for Contractor"))
  if entity in {"Issues","HSE"}:
   if row.get("status")=="Closed" and not row.get("closed_at"):e.append(ValidationError("VAL-E008","closed_at","closed_at required when Closed"))
   if row.get("status")!="Closed" and row.get("closed_at") not in (None,""):e.append(ValidationError("VAL-E008","closed_at","closed_at must be blank unless Closed"))
  if entity=="Operations" and row.get("quantity") not in (None,"") and not row.get("unit"):e.append(ValidationError("VAL-E008","unit","unit required with quantity"))
  if entity=="Plans" and row.get("target_quantity") not in (None,"") and not row.get("unit"):e.append(ValidationError("VAL-E008","unit","unit required with target_quantity"))
  if entity=="Plans" and row.get("period") and not re.fullmatch(r"\d{4}-\d{2}",str(row["period"])):e.append(ValidationError("VAL-E009","period","period must be YYYY-MM"))
  if row.get("effective_from") and row.get("effective_to") and row["effective_to"]<row["effective_from"]:e.append(ValidationError("VAL-E008","effective_to","effective_to must be >= effective_from"))
  if context=="CREATE" and store and store.exists(entity,row.get(pk)):e.append(ValidationError("VAL-E004",pk,"Primary key duplicate"))
  return e
 def validate_dataset(self,rows,store=None,context="IMPORT"):
  out=[]; seen={}
  for entity,items in rows.items():
   if entity not in DOMAIN_ENTITIES: out.append(ValidationError("VAL-E011",None,f"Unknown entity: {entity}")); continue
   pk=PKS[entity]; seen[entity]=set()
   for row in items:
    k=row.get(pk)
    if k in (None,""):out.append(ValidationError("VAL-E003",pk,"Primary key blank"))
    elif k in seen[entity]:out.append(ValidationError("VAL-E004",pk,"Primary key duplicate in dataset"))
    seen[entity].add(k); out.extend(self.validate(entity,row,store,context))
  return out
