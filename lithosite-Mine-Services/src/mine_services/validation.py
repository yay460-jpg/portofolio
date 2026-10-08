from dataclasses import dataclass
from datetime import date, datetime, time
import re

from . import schema as DEFAULT_SCHEMA
from .map_marker_validation import validate_map_marker_row


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
    "Checker": {"observation_date"},
}
TIME_FIELDS = {
    "Operations": {"transaction_time", "end_time"},
    "Maintenance": {"start_time", "end_time"},
    "Checker": {"start_time", "end_time"},
}
DATETIME_FIELDS = {
    "Operations": {"created_at", "updated_at"},
    "AuditLog": {"timestamp"},
}
TEXT_FIELDS = {
    "Equipment": {"equipment_id", "category", "type", "owner_type", "owner_name", "status"},
    "WorkFront": {"work_front_id", "domain", "location", "responsible", "status", "capacity_profile_id"},
    "GlobalCapacity": {"capacity_profile_id", "capacity_name", "unit", "status"},
    "Checker": {"checker_id", "checker_name", "shift", "equipment_id", "work_front_id", "activity", "material", "source"},
    "Operations": {"transaction_id", "domain", "work_front_id", "equipment_id", "activity", "unit", "status", "source", "capacity_profile_id", "capacity_unit", "shift", "material", "checker_name"},
    "Maintenance": {"maintenance_id", "equipment_id", "event_type", "failure_code", "action", "status", "source"},
    "Issues": {"issue_id", "domain", "work_front_id", "equipment_id", "description", "severity", "status", "assigned_to"},
    "Plans": {"plan_id", "period", "domain", "work_front_id", "activity", "unit", "status"},
    "HSE": {"hse_id", "domain", "work_front_id", "event_type", "severity", "description", "action", "status"},
}


class ValidationEngine:
    def __init__(self, schema_module=None):
        self.schema = schema_module or DEFAULT_SCHEMA

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
        if entity == "MapMarker":
            if field in {"marker_id", "marker_type", "label", "source_entity", "source_id", "status"}:
                return isinstance(value, str)
            if field in {"easting", "northing", "elevation"}:
                return isinstance(value, (int, float)) and not isinstance(value, bool)
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
        if entity not in self.schema.DOMAIN_ENTITIES:
            return [ValidationError("VAL-E011", None, "Unknown entity")]

        pk = self.schema.PKS[entity]

        for field in self.schema.HEADERS[entity]:
            if field in row and not self._type_valid(entity, field, row[field]):
                errors.append(ValidationError("VAL-E002", field, "Value type is invalid"))

        for field in self.schema.REQUIRED[entity]:
            if row.get(field) in (None, ""):
                errors.append(ValidationError("VAL-E003", field, "Required field is blank"))

        # Numeric runtime fields are non-negative by contract.
        for field in getattr(self.schema, "NUMERIC", set()):
            if field not in row or row.get(field) in (None, ""):
                continue
            value = row.get(field)
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                errors.append(ValidationError("VAL-E002", field, "Value type is invalid"))
            elif value < 0:
                errors.append(ValidationError("VAL-E007", field, "Value must be greater than or equal to zero"))

        if existing is not None and row.get(pk) != existing.get(pk):
            errors.append(ValidationError("VAL-E010", pk, "Primary key is immutable"))

        for field in self.schema.SYSTEM_FIELDS:
            if field in row and context in {"CREATE", "IMPORT", "UPDATE"}:
                errors.append(ValidationError("VAL-E010", field, "System field is generated"))

        for key, (target, targetpk, required) in self.schema.FK.items():
            owner, field = key.split(".")
            if owner == entity and row.get(field) not in (None, "") and store and not store.exists(target, row[field]):
                errors.append(ValidationError("VAL-E005", field, f"Referenced {target}.{targetpk} not found"))

        lists = getattr(store, "controlled_lists", {}) if store else {}
        for key, listname in self.schema.CONTROLLED.items():
            owner, field = key.split(".")
            if owner == entity and row.get(field) not in (None, "") and lists and row[field] not in lists.get(listname, set()):
                errors.append(ValidationError("VAL-E006", field, "Controlled value is invalid"))

        if entity == "MapMarker":
            marker_errors = validate_map_marker_row(row)
            for field, reason in marker_errors:
                code = "VAL-E003" if reason == "required" else "VAL-E002"
                errors.append(ValidationError(code, field, f"MapMarker validation failed: {reason}"))

        if entity == "GlobalCapacity":
            if row.get("capacity_value") in (None, "") or float(row.get("capacity_value")) <= 0:
                errors.append(ValidationError("VAL-E007", "capacity_value", "Capacity must be greater than zero"))
            if row.get("unit") != "ton":
                errors.append(ValidationError("VAL-E006", "unit", "Global Capacity unit must be ton"))

        if entity == "Checker":
            start = row.get("start_time")
            end = row.get("end_time")
            if start not in (None, "") and end not in (None, ""):
                start_text = start.strftime("%H:%M:%S") if isinstance(start, time) else str(start)
                end_text = end.strftime("%H:%M:%S") if isinstance(end, time) else str(end)
                if end_text < start_text:
                    errors.append(ValidationError("VAL-E008", "end_time", "end_time must be >= start_time"))

            activity = str(row.get("activity") or "").strip().lower()
            equipment = store.get("Equipment", row.get("equipment_id")) if store and row.get("equipment_id") else None
            is_dump_truck = str((equipment or {}).get("type") or "").strip().lower() == "dump truck"
            if is_dump_truck and activity == "hauling" and row.get("retase") in (None, ""):
                errors.append(ValidationError("VAL-E003", "retase", "Retase is required for Dump Truck Hauling"))

        if entity == "Operations":
            start = row.get("transaction_time")
            end = row.get("end_time")
            if start not in (None, "") and end not in (None, ""):
                start_text = start.strftime("%H:%M:%S") if isinstance(start, time) else str(start)
                end_text = end.strftime("%H:%M:%S") if isinstance(end, time) else str(end)
                if end_text < start_text:
                    errors.append(ValidationError("VAL-E008", "end_time", "end_time must be >= transaction_time"))

        if (
            entity == "Operations"
            and "retase" in self.schema.HEADERS.get(entity, [])
            and str(row.get("activity") or "").strip().lower() == "hauling"
        ):
            equipment = store.get("Equipment", row.get("equipment_id")) if store and row.get("equipment_id") else None
            is_dump_truck = str((equipment or {}).get("type") or "").strip().lower() == "dump truck"
            if is_dump_truck and row.get("retase") in (None, ""):
                errors.append(ValidationError("VAL-E003", "retase", "Retase is required for Dump Truck Hauling"))
            if is_dump_truck and row.get("applied_capacity") in (None, ""):
                errors.append(ValidationError("VAL-E003", "applied_capacity", "Applied Capacity is required for Dump Truck Hauling"))
            if is_dump_truck and row.get("unit") != "ton":
                errors.append(ValidationError("VAL-E006", "unit", "Dump Truck Hauling quantity unit must be ton"))
            if is_dump_truck and row.get("quantity") not in (None, "") and row.get("retase") not in (None, "") and row.get("applied_capacity") not in (None, ""):
                expected = float(row["retase"]) * float(row["applied_capacity"])
                if abs(float(row["quantity"]) - expected) > 1e-9:
                    errors.append(ValidationError("VAL-E008", "quantity", "Quantity must equal Retase × Applied Capacity"))

        if entity == "Operations" and row.get("quantity") not in (None, "") and not row.get("unit"):
            errors.append(ValidationError("VAL-E008", "unit", "unit required with quantity"))

        if entity == "Plans" and row.get("target_quantity") not in (None, "") and not row.get("unit"):
            errors.append(ValidationError("VAL-E008", "unit", "unit required with target_quantity"))

        if entity == "Plans" and row.get("period") and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", str(row["period"])):
            errors.append(ValidationError("VAL-E009", "period", "period must be YYYY-MM"))

        if entity in {"Issues", "HSE"} and "closed_at" in self.schema.HEADERS.get(entity, {}):
            status = str(row.get("status") or "").strip().lower()
            closed_at = row.get("closed_at")
            if status == "closed" and closed_at in (None, ""):
                errors.append(ValidationError("VAL-E008", "closed_at", "closed_at is required when status is Closed"))
            elif status in {"open", "in progress"} and closed_at not in (None, ""):
                errors.append(ValidationError("VAL-E008", "closed_at", "closed_at must be blank unless Closed"))

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
        for entity, items in rows.items():
            if entity not in self.schema.DOMAIN_ENTITIES:
                errors.append(ValidationError("VAL-E011", None, f"Unknown entity: {entity}"))
                continue
            pk = self.schema.PKS[entity]
            seen = set()
            for row in items:
                key = row.get(pk)
                if key in (None, ""):
                    errors.append(ValidationError("VAL-E003", pk, "Primary key blank"))
                elif key in seen:
                    errors.append(ValidationError("VAL-E004", pk, "Primary key duplicate in dataset"))
                seen.add(key)
                errors.extend(self.validate(entity, row, store, context))
        return errors
