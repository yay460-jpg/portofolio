"""A2-to-A3 schema migration contract.

This module records the A3 workbook shape produced from the A2 baseline.
A3 is now the active runtime schema; A2 remains represented here as the
historical migration source and compatibility boundary.
"""

from .map_marker_contract import MAP_MARKER_ENTITY, MAP_MARKER_HEADERS, MAP_MARKER_PRIMARY_KEY

CURRENT_SCHEMA_VERSION = "A.2"
TARGET_SCHEMA_VERSION = "A.3"

MAP_MARKER_SHEET = MAP_MARKER_ENTITY
MAP_MARKER_PK = MAP_MARKER_PRIMARY_KEY
MAP_MARKER_SCHEMA_HEADERS = list(MAP_MARKER_HEADERS)

A2_DOMAIN_ENTITIES = [
    "Equipment",
    "WorkFront",
    "Operations",
    "Maintenance",
    "Issues",
    "Plans",
    "HSE",
]

A3_DOMAIN_ENTITIES = A2_DOMAIN_ENTITIES + [MAP_MARKER_ENTITY]

A3_SHEETS = [
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
    MAP_MARKER_SHEET,
    "AuditLog",
]

A3_HEADERS_ADDITIONS = {
    MAP_MARKER_ENTITY: MAP_MARKER_SCHEMA_HEADERS,
}

A3_PRIMARY_KEYS_ADDITIONS = {
    MAP_MARKER_ENTITY: MAP_MARKER_PK,
}

def target_schema_contract():
    return {
        "from_version": CURRENT_SCHEMA_VERSION,
        "to_version": TARGET_SCHEMA_VERSION,
        "added_entity": MAP_MARKER_ENTITY,
        "domain_entities": list(A3_DOMAIN_ENTITIES),
        "sheets": list(A3_SHEETS),
        "headers": {MAP_MARKER_ENTITY: list(MAP_MARKER_SCHEMA_HEADERS)},
        "primary_keys": {MAP_MARKER_ENTITY: MAP_MARKER_PK},
    }
