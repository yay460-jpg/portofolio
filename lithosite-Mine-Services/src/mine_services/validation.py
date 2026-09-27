from dataclasses import dataclass
from datetime import date, datetime, time
import re
from .schema import *

@dataclass(frozen=True)
class ValidationError:
    code: str
    field: str | None
    message: str

DATE_FIELDS = {
    "Equipment": {"effective_from", "effective_to"},
    "WorkFront": {"effective_from", "effective_to"},
    "Operations": {"transaction_date"},
    "Maintenance": {"event_date"},
    "Issues": {"issue_date"},
    "HSE": {"event_date"},
}
TIME_FIELDS = {
    "Operations": {"transaction_time"},
    "Maintenance": {"start_time", "end_time"},
}
DATETIME_FIELDS = {
    "Operations": {"created_at", "updated_at"},
    "AuditLog": {"timestamp"},
}
TEXT_FIELDS = {
    "Equipment": {"equipment_id", "category", "type", "owner_type", "owner_name", "status"},
    "WorkFront": {"work_front_id", "domain", "location", "responsible", "status"},
    "Operations": {"transaction_id", "domain", "work_front_id", "equipment_id", "activity", "unit", "status", "source"},
    "Maintenance": {"maintenance_id", "equipment_id", "event_type", "failure_code", "action", "status", "source"},
    "Issues": {"issue_id", "domain", "work_front_id", "equipment_id", "description", "severity", "status", "assigned_to"},
    "Plans": {"plan_id", "period", "domain", "work_front_id", "activity", "unit", "status"},
    "HSE": {"hse_id", "domain", "work_front_id", "event_type", "severity", "description", "action", "status"},
}

class ValidationEngine:
    def _type_valid(self, entity, field, value):
        if value in (None, ""):
            return True
        if field in DATE_FIELDS.get(entity, set()):
            return (isinstance(value, date) and not isinstance(value, datetime)) or (
                isinstance(value, str) and bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", value))
            )
        if field in TIME_FIELDS.get(entity, set()):
            return isinstance(value, time) or (
                isinstance(value, str) and bool(re.fullmatch(r"\d{2}:\d{2}(:\d{2})?", value))
            )
        if field in DATETIME_FIELDS.get(entity, set()):
            return isinstance(value, datetime) or (
                isinstance(value, str) and self._parse_datetime(value) is not None
            )
        if field in TEXT_FIELDS.get(entity, set()):
            return isinstance(value, str)
        return True

    @staticmethod
    def _parse_datetime(value):
        if not isinstance(value, str):
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    def validate(self, entity, row, store=None, context="CREATE", existing=None):
        errors = []
        if entity not in DOMAIN_ENTITIES:
            return [ValidationError("VAL-E011", None, "Unknown entity")]

        pk = PKS[entity]

        for field in HEADERS[entity]:
            if field in row and not self._type_valid(entity, field, row[field]):
                errors.append(ValidationError("VAL-E002", field, "Value type is invalid"))

        for field in REQUIRED[entity]:
            if row.get(field) in (None, ""):
                errors.append(ValidationError("VAL-E003", field, "Required field is blank"))

        if existing is not None and row.get(pk) != existing.get(pk):
            errors.append(ValidationError("VAL-E010", pk, "Primary key is immutable"))

        for field in row:
            if field in SYSTEM_FIELDS and context in {"CREATE", "IMPORT", "RESTORE"}:
                errors.append(ValidationError("VAL-E010", field, "System field is generated"))

        for field in NUMERIC:
            if field in row and row[field] not in (None, ""):
                if not isinstance(row[field], (int, float)) or isinstance(row[field], bool) or row[field] < 0:
                    errors.append(ValidationError("VAL-E007", field, "Numeric value must be >= 0"))

        for key, (target, targetpk, required) in FK.items():
            owner, field = key.split(".")
            if owner == entity and row.get(field) not in (None, "") and store and not store.exists(target, row[field]):
                errors.append(ValidationError("VAL-E005", field, f"Referenced {target}.{targetpk} not found"))

        lists = getattr(store, "controlled_lists", {}) if store else {}
        for key, listname in CONTROLLED.items():
            owner, field = key.split(".")
            if owner == entity and row.get(field) not in (None, "") and lists and row[field] not in lists.get(listname, set()):
                errors.append(ValidationError("VAL-E006", field, "Controlled value is invalid"))

        if entity == "Equipment" and row.get("owner_type") == "Contractor" and not row.get("owner_name"):
            errors.append(ValidationError("VAL-E008", "owner_name", "owner_name required for Contractor"))

        if entity in {"Issues", "HSE"}:
            if row.get("status") == "Closed" and not row.get("closed_at"):
                errors.append(ValidationError("VAL-E008", "closed_at", "closed_at required when Closed"))
            if row.get("status") != "Closed" and row.get("closed_at") not in (None, ""):
                errors.append(ValidationError("VAL-E008", "closed_at", "closed_at must be blank unless Closed"))

        if entity == "Operations" and row.get("quantity") not in (None, "") and not row.get("unit"):
            errors.append(ValidationError("VAL-E008", "unit", "unit required with quantity"))

        if entity == "Plans" and row.get("target_quantity") not in (None, "") and not row.get("unit"):
            errors.append(ValidationError("VAL-E008", "unit", "unit required with target_quantity"))

        if entity == "Plans" and row.get("period") and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", str(row["period"])):
            errors.append(ValidationError("VAL-E009", "period", "period must be YYYY-MM"))

        if row.get("effective_from") and row.get("effective_to"):
            start = row["effective_from"]
            end = row["effective_to"]
            if isinstance(start, str) and isinstance(end, str):
                if end < start:
                    errors.append(ValidationError("VAL-E008", "effective_to", "effective_to must be >= effective_from"))
            elif end < start:
                errors.append(ValidationError("VAL-E008", "effective_to", "effective_to must be >= effective_from"))

        if context == "CREATE" and store and store.exists(entity, row.get(pk)):
            errors.append(ValidationError("VAL-E004", pk, "Primary key duplicate"))

        return errors

    def validate_dataset(self, rows, store=None, context="IMPORT"):
        errors = []
        seen = {}
        for entity, items in rows.items():
            if entity not in DOMAIN_ENTITIES:
                errors.append(ValidationError("VAL-E011", None, f"Unknown entity: {entity}"))
                continue
            pk = PKS[entity]
            seen[entity] = set()
            for row in items:
                key = row.get(pk)
                if key in (None, ""):
                    errors.append(ValidationError("VAL-E003", pk, "Primary key blank"))
                elif key in seen[entity]:
                    errors.append(ValidationError("VAL-E004", pk, "Primary key duplicate in dataset"))
                seen[entity].add(key)
                errors.extend(self.validate(entity, row, store, context))
        return errors
