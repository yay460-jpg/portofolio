"""A.3 runtime schema with V38 Global Capacity, Checker, and hauling fields.

A.3 remains the active runtime schema. V38 extends the active contract with
GlobalCapacity configuration, Checker field observations, and WorkFront/Operations
capacity references.
"""

from .schema import (
    HEADERS as _A2_HEADERS,
    PKS as _A2_PKS,
    REQUIRED as _A2_REQUIRED,
    NUMERIC as _A2_NUMERIC,
    SYSTEM_FIELDS as _A2_SYSTEM_FIELDS,
    FK as _A2_FK,
    CONTROLLED as _A2_CONTROLLED,
)

SCHEMA_VERSION = "A.3"

SHEETS = [
    "_Baseline", "_System", "_Lists", "Equipment", "WorkFront",
    "GlobalCapacity", "Checker", "Operations", "Maintenance", "Issues",
    "Plans", "HSE", "MapMarker", "AuditLog",
]

DOMAIN_ENTITIES = [
    "Equipment", "WorkFront", "GlobalCapacity", "Checker", "Operations",
    "Maintenance", "Issues", "Plans", "HSE", "MapMarker",
]

HEADERS = dict(_A2_HEADERS)
HEADERS["GlobalCapacity"] = [
    "capacity_profile_id", "capacity_name", "unit_brand", "capacity_value", "unit",
    "status", "effective_from", "effective_to",
]
HEADERS["Checker"] = [
    "checker_id", "operation_id", "checker_name", "observation_date", "start_time",
    "end_time", "shift", "equipment_id", "work_front_id", "activity",
    "material", "retase", "source",
]
HEADERS["WorkFront"] = HEADERS["WorkFront"] + ["capacity_profile_id"]
HEADERS["Operations"] = HEADERS["Operations"] + [
    "retase", "capacity_profile_id", "applied_capacity", "capacity_unit",
    "end_time", "shift", "material", "checker_name",
]
HEADERS["MapMarker"] = [
    "marker_id", "marker_type", "label", "easting", "northing", "elevation",
    "source_entity", "source_id", "status",
]

PKS = dict(_A2_PKS)
PKS["GlobalCapacity"] = "capacity_profile_id"
PKS["Checker"] = "checker_id"
PKS["MapMarker"] = "marker_id"

REQUIRED = dict(_A2_REQUIRED)
REQUIRED["GlobalCapacity"] = {
    "capacity_profile_id", "capacity_name", "capacity_value", "unit", "status",
}
REQUIRED["Checker"] = {
    "checker_id", "checker_name", "observation_date", "start_time",
    "end_time", "shift", "equipment_id", "work_front_id", "activity", "source",
}
REQUIRED["MapMarker"] = {
    "marker_id", "marker_type", "easting", "northing", "elevation",
}

NUMERIC = set(_A2_NUMERIC) | {
    "easting", "northing", "elevation",
    "capacity_value", "retase", "applied_capacity",
}

SYSTEM_FIELDS = set(_A2_SYSTEM_FIELDS)

FK = dict(_A2_FK)
FK["WorkFront.capacity_profile_id"] = ("GlobalCapacity", "capacity_profile_id", False)
FK["Operations.capacity_profile_id"] = ("GlobalCapacity", "capacity_profile_id", False)
FK["Checker.operation_id"] = ("Operations", "transaction_id", False)
FK["Checker.equipment_id"] = ("Equipment", "equipment_id", True)
FK["Checker.work_front_id"] = ("WorkFront", "work_front_id", True)

CONTROLLED = dict(_A2_CONTROLLED)
CONTROLLED["GlobalCapacity.unit"] = "unit"
CONTROLLED["GlobalCapacity.status"] = "capacity_status"
CONTROLLED["Checker.shift"] = "checker_shift"
CONTROLLED["Checker.material"] = "checker_material"
CONTROLLED["Operations.shift"] = "checker_shift"
CONTROLLED["Operations.material"] = "checker_material"
