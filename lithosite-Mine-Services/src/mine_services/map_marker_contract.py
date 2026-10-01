"""Stage 20 MapMarker persistence contract.

This module defines the future persistence shape without activating MapMarker
as a runtime domain entity yet. Activation requires an explicit schema
migration and XLSX contract update in a later Stage 20.8K step.
"""

MAP_MARKER_ENTITY = "MapMarker"
MAP_MARKER_PRIMARY_KEY = "marker_id"

MAP_MARKER_HEADERS = [
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

MAP_MARKER_REQUIRED_FIELDS = {
    "marker_id",
    "marker_type",
    "easting",
    "northing",
    "elevation",
}

MAP_MARKER_SPATIAL_FIELDS = {
    "easting",
    "northing",
    "elevation",
}

MAP_MARKER_REFERENCE_FIELDS = {
    "source_entity",
    "source_id",
}

MAP_MARKER_VALID_TYPES = (
    "HSE",
    "ASSET",
    "FACILITY",
    "WORKFRONT",
    "STOCKPILE",
    "DISPOSAL",
    "DRAINAGE",
    "WORKSHOP",
    "OTHER",
)

MAP_MARKER_VALID_STATUS = (
    "ACTIVE",
    "INACTIVE",
    "REMOVED",
)

MAP_MARKER_SOURCE_ENTITIES = {
    "HSE": "HSE",
    "ASSET": "Equipment",
    "FACILITY": "Facility",
    "WORKFRONT": "WorkFront",
    "STOCKPILE": "Stockpile",
    "DISPOSAL": "Disposal",
    "DRAINAGE": "Drainage",
    "WORKSHOP": "Workshop",
    "OTHER": "Other",
}
