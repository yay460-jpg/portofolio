from dataclasses import dataclass
from datetime import date, datetime, time
import json
import math
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
    "Plans": {"start_date", "end_date"},
}
TIME_FIELDS = {
    "Operations": {"transaction_time", "end_time"},
    "Maintenance": {"start_time", "end_time"},
    "Checker": {"start_time", "end_time"},
}
DATETIME_FIELDS = {
    "Operations": {"created_at", "updated_at"},
    "AuditLog": {"timestamp"},
    "RainfallSimulation": {"created_at", "updated_at"},
}
TEXT_FIELDS = {
    "Equipment": {"equipment_id", "category", "type", "owner_type", "owner_name", "status"},
    "WorkFront": {"work_front_id", "domain", "location", "responsible", "status", "capacity_profile_id"},
    "GlobalCapacity": {"capacity_profile_id", "capacity_name", "measurement", "status"},
    "Checker": {"checker_id", "checker_name", "shift", "equipment_id", "work_front_id", "activity", "material", "source"},
    "Operations": {"transaction_id", "domain", "work_front_id", "equipment_id", "activity", "measurement", "status", "source", "capacity_profile_id", "capacity_measurement", "shift", "material", "checker_name"},
    "Maintenance": {"maintenance_id", "equipment_id", "event_type", "failure_code", "action", "status", "source", "shift"},
    "Issues": {"issue_id", "domain", "work_front_id", "equipment_id", "description", "severity", "status", "assigned_to"},
    "Plans": {"plan_id", "period", "start_date", "end_date", "domain", "work_front_id", "activity", "measurement", "status"},
    "HSE": {"hse_id", "domain", "work_front_id", "event_type", "severity", "description", "action", "status"},
    "RainfallSimulation": {"simulation_id", "scenario_name", "status", "topography_name", "terrain_fingerprint", "flow_algorithm", "depression_treatment", "result_summary_json", "model_version", "notes"},
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

        # Maintenance Action is distinct from Event Type. Preserve the existing
        # A.3 action vocabulary while allowing Repairing as its own action.
        if entity == "Maintenance" and row.get("action") not in (None, "") and lists:
            allowed_actions = set(lists.get("maintenance_event_type", set())) | {"Repairing"}
            if row["action"] not in allowed_actions:
                errors.append(ValidationError("VAL-E006", "action", "Controlled value is invalid"))

        if entity == "MapMarker":
            marker_errors = validate_map_marker_row(row)
            for field, reason in marker_errors:
                code = "VAL-E003" if reason == "required" else "VAL-E002"
                errors.append(ValidationError(code, field, f"MapMarker validation failed: {reason}"))

        if entity == "RainfallSimulation":
            allowed_status = {"DRAFT", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"}
            allowed_depression_treatment = {"FILL", "BREACH", "PRESERVE"}
            if row.get("status") not in allowed_status:
                errors.append(ValidationError("VAL-E006", "status", "Rainfall simulation status is invalid"))
            if row.get("flow_algorithm") != "D8":
                errors.append(ValidationError("VAL-E006", "flow_algorithm", "Only the D8 flow algorithm is currently supported"))
            if row.get("depression_treatment") not in allowed_depression_treatment:
                errors.append(ValidationError("VAL-E006", "depression_treatment", "Depression treatment is invalid"))

            for field in ("rainfall_intensity_mm_hr", "rainfall_duration_min", "grid_resolution_m"):
                value = row.get(field)
                if value not in (None, "") and (
                    isinstance(value, bool) or not isinstance(value, (int, float))
                    or not math.isfinite(float(value)) or float(value) <= 0
                ):
                    errors.append(ValidationError("VAL-E007", field, "Value must be a finite number greater than zero"))

            for field in ("runoff_coefficient", "catchment_area_m2", "total_rainfall_mm",
                          "estimated_runoff_volume_m3", "max_flow_accumulation_cells"):
                value = row.get(field)
                if value in (None, ""):
                    continue
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                    errors.append(ValidationError("VAL-E002", field, "Value must be a finite number"))
                    continue
                if field == "runoff_coefficient" and not 0 <= float(value) <= 1:
                    errors.append(ValidationError("VAL-E007", field, "Runoff coefficient must be between 0 and 1"))
                elif field == "catchment_area_m2" and float(value) <= 0:
                    errors.append(ValidationError("VAL-E007", field, "Catchment area must be greater than zero"))
                elif field in {"total_rainfall_mm", "estimated_runoff_volume_m3", "max_flow_accumulation_cells"} and float(value) < 0:
                    errors.append(ValidationError("VAL-E007", field, "Result values must be non-negative"))

            accumulation = row.get("max_flow_accumulation_cells")
            if accumulation not in (None, "") and (
                isinstance(accumulation, bool) or not isinstance(accumulation, int)
            ):
                errors.append(ValidationError("VAL-E002", "max_flow_accumulation_cells", "Flow accumulation must be an integer cell count"))

            fingerprint = row.get("terrain_fingerprint")
            if fingerprint not in (None, "") and not re.fullmatch(r"[0-9a-fA-F]{64}", str(fingerprint)):
                errors.append(ValidationError("VAL-E002", "terrain_fingerprint", "Terrain fingerprint must be a SHA-256 hex digest"))
            summary = row.get("result_summary_json")
            if summary not in (None, ""):
                if not isinstance(summary, str) or len(summary) > 30000:
                    errors.append(ValidationError("VAL-E007", "result_summary_json", "Result summary must be a JSON object no longer than 30000 characters"))
                else:
                    try:
                        parsed_summary = json.loads(summary)
                    except (TypeError, ValueError):
                        parsed_summary = None
                    if not isinstance(parsed_summary, dict):
                        errors.append(ValidationError("VAL-E002", "result_summary_json", "Result summary must contain a JSON object"))

            if len(str(row.get("scenario_name") or "")) > 120:
                errors.append(ValidationError("VAL-E007", "scenario_name", "Scenario name must be at most 120 characters"))
            if len(str(row.get("notes") or "")) > 1000:
                errors.append(ValidationError("VAL-E007", "notes", "Notes must be at most 1000 characters"))

        if entity == "GlobalCapacity":
            if row.get("capacity_value") in (None, "") or float(row.get("capacity_value")) <= 0:
                errors.append(ValidationError("VAL-E007", "capacity_value", "Capacity must be greater than zero"))
            if row.get("measurement") != "ton":
                errors.append(ValidationError("VAL-E006", "measurement", "Global Capacity measurement must be ton"))

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

        if entity == "Operations" and str(row.get("checker_name") or "").strip():
            if row.get("end_time") in (None, ""):
                errors.append(ValidationError("VAL-E003", "end_time", "end_time is required when Checker Name is provided"))
            if row.get("shift") in (None, ""):
                errors.append(ValidationError("VAL-E003", "shift", "shift is required when Checker Name is provided"))

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
            equipment_profile_id = (equipment or {}).get("capacity_profile_id")
            if is_dump_truck and equipment_profile_id in (None, ""):
                errors.append(ValidationError("VAL-E003", "capacity_profile_id", "Equipment Global Capacity Profile is required for Dump Truck Hauling"))
            if is_dump_truck and row.get("capacity_profile_id") in (None, ""):
                errors.append(ValidationError("VAL-E003", "capacity_profile_id", "Capacity profile is required for Dump Truck Hauling"))
            if is_dump_truck and row.get("applied_capacity") in (None, ""):
                errors.append(ValidationError("VAL-E003", "applied_capacity", "Applied Capacity is required for Dump Truck Hauling"))
            if is_dump_truck and row.get("measurement") != "ton":
                errors.append(ValidationError("VAL-E006", "measurement", "Dump Truck Hauling quantity measurement must be ton"))
            if is_dump_truck and row.get("quantity") not in (None, "") and row.get("retase") not in (None, "") and row.get("applied_capacity") not in (None, ""):
                expected = float(row["retase"]) * float(row["applied_capacity"])
                if abs(float(row["quantity"]) - expected) > 1e-9:
                    errors.append(ValidationError("VAL-E008", "quantity", "Quantity must equal Retase × Applied Capacity"))

        if entity == "Operations" and row.get("quantity") not in (None, "") and not row.get("measurement"):
            errors.append(ValidationError("VAL-E008", "measurement", "measurement required with quantity"))

        if entity == "Plans" and row.get("target_quantity") not in (None, "") and not row.get("measurement"):
            errors.append(ValidationError("VAL-E008", "measurement", "measurement required with target_quantity"))

        if entity == "Plans" and row.get("period") and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", str(row["period"])):
            errors.append(ValidationError("VAL-E009", "period", "period must be YYYY-MM"))

        if entity == "Plans":
            start_date = row.get("start_date")
            end_date = row.get("end_date")
            if start_date and end_date and str(end_date) < str(start_date):
                errors.append(ValidationError("VAL-E008", "end_date", "end_date must be on or after start_date"))
            if start_date and re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(start_date)):
                expected_period = str(start_date)[:7]
                if row.get("period") and str(row["period"]) != expected_period:
                    errors.append(ValidationError("VAL-E008", "period", "period must match the month of start_date"))

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

        if entity == "Equipment" and row.get("unit_no") not in (None, "") and store:
            candidate = str(row["unit_no"]).strip().casefold()
            for stored in store.all("Equipment"):
                if str(stored.get("equipment_id") or "") == str(row.get("equipment_id") or ""):
                    continue
                if str(stored.get("unit_no") or "").strip().casefold() == candidate:
                    errors.append(ValidationError("VAL-E004", "unit_no", "Unit / Fleet No. must be unique"))
                    break

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
