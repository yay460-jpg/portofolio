"""A.3 runtime schema for the MapMarker persistence rollout.

A.2 remains the default schema until the production workbook migration and
runtime activation are completed. This module provides an explicit opt-in A.3
schema for isolated persistence testing.
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
    "MapMarker",
    "AuditLog",
]
DOMAIN_ENTITIES = [
    "Equipment",
    "WorkFront",
    "Operations",
    "Maintenance",
    "Issues",
    "Plans",
    "HSE",
    "MapMarker",
]

HEADERS = dict(_A2_HEADERS)
HEADERS["MapMarker"] = [
    "marker_id",
    "marker_type",
    "label",
    "easting",
    "northing",
    "elevation",
    "source_entity",
    "source_id",
    "status",
]

PKS = dict(_A2_PKS)
PKS["MapMarker"] = "marker_id"

REQUIRED = dict(_A2_REQUIRED)
REQUIRED["MapMarker"] = {
    "marker_id",
    "marker_type",
    "easting",
    "northing",
    "elevation",
}

NUMERIC = set(_A2_NUMERIC) | {"easting", "northing", "elevation"}
SYSTEM_FIELDS = set(_A2_SYSTEM_FIELDS)
FK = dict(_A2_FK)
CONTROLLED = dict(_A2_CONTROLLED)
