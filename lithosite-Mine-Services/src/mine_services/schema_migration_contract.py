"""A2-to-A3 schema migration contract.

A2 is preserved here only as the historical migration source definition.
A3 is the single active runtime schema in mine_services.schema.
"""

from .map_marker_contract import MAP_MARKER_ENTITY, MAP_MARKER_HEADERS, MAP_MARKER_PRIMARY_KEY
from . import schema as A3_SCHEMA

CURRENT_SCHEMA_VERSION = "A.2"
TARGET_SCHEMA_VERSION = A3_SCHEMA.SCHEMA_VERSION

MAP_MARKER_SHEET = MAP_MARKER_ENTITY
MAP_MARKER_PK = MAP_MARKER_PRIMARY_KEY
MAP_MARKER_SCHEMA_HEADERS = list(MAP_MARKER_HEADERS)

A2_SHEETS = [
    "_Baseline",
    "_System",
    "_Lists",
    "Equipment",
    "WorkFront",
    "Operations",
    "Maintenance",
    "Issues",
    "Plans",
    "HSE",
    "AuditLog",
]

A2_DOMAIN_ENTITIES = [
    "Equipment",
    "WorkFront",
    "Operations",
    "Maintenance",
    "Issues",
    "Plans",
    "HSE",
]

A2_HEADERS = {
    "Equipment": ["equipment_id", "unit_no", "category", "type", "owner_type", "owner_name", "status", "effective_from", "effective_to"],
    "WorkFront": ["work_front_id", "domain", "location", "responsible", "status", "effective_from", "effective_to"],
    "Operations": ["transaction_id", "transaction_date", "transaction_time", "domain", "work_front_id", "equipment_id", "activity", "quantity", "unit", "actual_hours", "target_hours", "status", "source", "created_at", "updated_at"],
    "Maintenance": ["maintenance_id", "equipment_id", "event_date", "event_type", "failure_code", "start_time", "end_time", "downtime_hours", "action", "status", "source"],
    "Issues": ["issue_id", "issue_date", "domain", "work_front_id", "equipment_id", "description", "severity", "status", "assigned_to", "closed_at"],
    "Plans": ["plan_id", "period", "domain", "work_front_id", "activity", "target_quantity", "unit", "target_hours", "status"],
    "HSE": ["hse_id", "event_date", "domain", "work_front_id", "event_type", "severity", "description", "action", "status", "closed_at"],
    "AuditLog": ["audit_id", "timestamp", "entity", "entity_id", "action", "old_value", "new_value", "source"],
}

A3_DOMAIN_ENTITIES = list(A3_SCHEMA.DOMAIN_ENTITIES)
A3_SHEETS = list(A3_SCHEMA.SHEETS)

A3_HEADERS_ADDITIONS = {
    "GlobalCapacity": list(A3_SCHEMA.HEADERS["GlobalCapacity"]),
    "Checker": list(A3_SCHEMA.HEADERS["Checker"]),
    "WorkFront": [h for h in A3_SCHEMA.HEADERS["WorkFront"] if h not in A2_HEADERS["WorkFront"]],
    "Operations": [
        h for h in A3_SCHEMA.HEADERS["Operations"]
        if h not in A2_HEADERS["Operations"] and h != "measurement"
    ],
    MAP_MARKER_ENTITY: MAP_MARKER_SCHEMA_HEADERS,
}

A3_PRIMARY_KEYS_ADDITIONS = {
    "GlobalCapacity": A3_SCHEMA.PKS["GlobalCapacity"],
    "Checker": A3_SCHEMA.PKS["Checker"],
    MAP_MARKER_ENTITY: MAP_MARKER_PK,
}


def target_schema_contract():
    return {
        "from_version": CURRENT_SCHEMA_VERSION,
        "to_version": TARGET_SCHEMA_VERSION,
        "added_entity": MAP_MARKER_ENTITY,
        "domain_entities": list(A3_DOMAIN_ENTITIES),
        "sheets": list(A3_SHEETS),
        "headers": {key: list(value) for key, value in A3_HEADERS_ADDITIONS.items()},
        "primary_keys": dict(A3_PRIMARY_KEYS_ADDITIONS),
    }
