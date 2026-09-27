from __future__ import annotations
from dataclasses import dataclass
import re
from typing import Any, Mapping, Optional
from .schema import ENTITIES, LISTS, FK_RULES, NUMERIC_FIELDS, SYSTEM_FIELDS

@dataclass(frozen=True)
class ValidationError:
    code: str
    field: Optional[str]
    message: str

class ValidationEngine:
    """Shared validation boundary for CREATE, UPDATE, IMPORT and RESTORE."""
    def validate(self, entity: str, row: Mapping[str, Any], store=None, context="CREATE", existing=None):
        errors = []
        if entity not in ENTITIES:
            return [ValidationError("SCHEMA_INVALID", None, f"Unknown entity: {entity}")]
        spec = ENTITIES[entity]
        for field, typ in spec["fields"].items():
            if field in spec.get("required", set()) and field not in row:
                errors.append(ValidationError("REQUIRED_MISSING", field, f"Missing field: {field}"))
                continue
            if field in row and row[field] in (None, "") and field in spec.get("required", set()):
                errors.append(ValidationError("REQUIRED_MISSING", field, f"Missing required field: {field}"))
        pk = spec["pk"]
        if existing is not None and row.get(pk) != existing.get(pk):
            errors.append(ValidationError("PK_IMMUTABLE", pk, "Primary key cannot be changed"))
        for field, typ in spec["fields"].items():
            if field not in row or row[field] in (None, ""):
                continue
            if field in SYSTEM_FIELDS:
                if context in {"CREATE", "IMPORT", "RESTORE"}:
                    errors.append(ValidationError("SYSTEM_FIELD_PROTECTED", field, f"System field is generated: {field}"))
                continue
            if not isinstance(row[field], typ):
                errors.append(ValidationError("TYPE_INVALID", field, f"Invalid type for {field}"))
        for field in NUMERIC_FIELDS:
            if field in row and row[field] not in (None, ""):
                if not isinstance(row[field], (int, float)) or isinstance(row[field], bool) or row[field] < 0:
                    errors.append(ValidationError("RANGE_INVALID", field, f"{field} must be numeric and >= 0"))
        if entity == "Equipment" and row.get("owner_type") == "Contractor" and not row.get("owner_name"):
            errors.append(ValidationError("CONDITIONAL_INVALID", "owner_name", "owner_name is required for Contractor"))
        if entity in {"Issues", "HSE"}:
            if row.get("status") == "Closed" and not row.get("closed_at"):
                errors.append(ValidationError("CONDITIONAL_INVALID", "closed_at", "closed_at is required when status is Closed"))
            if row.get("status") != "Closed" and row.get("closed_at") not in (None, ""):
                errors.append(ValidationError("CONDITIONAL_INVALID", "closed_at", "closed_at must be blank unless status is Closed"))
        if entity == "Operations" and row.get("quantity") not in (None, "") and not row.get("unit"):
            errors.append(ValidationError("CONDITIONAL_INVALID", "unit", "unit is required when quantity is populated"))
        if entity == "Plans":
            if row.get("target_quantity") not in (None, "") and not row.get("unit"):
                errors.append(ValidationError("CONDITIONAL_INVALID", "unit", "unit is required when target_quantity is populated"))
            if row.get("period") and not re.fullmatch(r"\d{4}-\d{2}", str(row["period"])):
                errors.append(ValidationError("PERIOD_INVALID", "period", "period must use YYYY-MM"))
        if entity == "HSE" and row.get("severity") not in (None, "") and row.get("severity") not in LISTS["hse_severity"]:
            errors.append(ValidationError("ENUM_INVALID", "severity", "Invalid HSE severity"))
        if entity == "HSE" and row.get("status") not in (None, "") and row.get("status") not in LISTS["hse_status"]:
            errors.append(ValidationError("ENUM_INVALID", "status", "Invalid HSE status"))
        if entity == "Maintenance" and row.get("status") not in (None, "") and row.get("status") not in LISTS["maintenance_status"]:
            errors.append(ValidationError("ENUM_INVALID", "status", "Invalid maintenance status"))
        if entity == "Plans" and row.get("status") not in (None, "") and row.get("status") not in LISTS["plan_status"]:
            errors.append(ValidationError("ENUM_INVALID", "status", "Invalid plan status"))
        if store is not None:
            for key, (target_entity, target_pk, required) in FK_RULES.items():
                owner, field = key.split(".")
                if owner != entity or field not in row or row.get(field) in (None, ""):
                    continue
                if not store.exists(target_entity, row[field]):
                    errors.append(ValidationError("FK_NOT_FOUND", field, f"Referenced {target_entity}.{target_pk} not found"))
            if context == "CREATE" and store.exists(entity, row.get(pk)):
                errors.append(ValidationError("PK_DUPLICATE", pk, f"Duplicate primary key: {row.get(pk)}"))
        return errors

    def validate_dataset(self, rows_by_entity: Mapping[str, list[Mapping[str, Any]]], store=None, context="IMPORT"):
        errors=[]
        for entity, rows in rows_by_entity.items():
            seen=set()
            pk=ENTITIES.get(entity,{}).get("pk")
            for row in rows:
                key=row.get(pk) if pk else None
                if key in seen:
                    errors.append(ValidationError("PK_DUPLICATE", pk, f"Duplicate primary key in dataset: {key}"))
                seen.add(key)
                errors.extend(self.validate(entity,row,store=store,context=context))
        return errors
