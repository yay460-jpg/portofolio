"""Stage 20 A.3 MapMarker schema helpers used by validation.

The default runtime schema remains A.2. This module is imported by the A.3
validation path so marker-specific rules remain isolated from HSE/domain rules.
"""

from .map_marker_contract import (
    MAP_MARKER_VALID_STATUS,
    MAP_MARKER_VALID_TYPES,
)

MAP_MARKER_TEXT_FIELDS = {
    "marker_id",
    "marker_type",
    "label",
    "source_entity",
    "source_id",
    "status",
}


def validate_map_marker_row(row):
    errors = []
    for field in ("marker_id", "marker_type", "easting", "northing", "elevation"):
        if row.get(field) in (None, ""):
            errors.append((field, "required"))

    for field in MAP_MARKER_TEXT_FIELDS:
        if field in row and row[field] not in (None, "") and not isinstance(row[field], str):
            errors.append((field, "text"))

    for field in ("easting", "northing", "elevation"):
        value = row.get(field)
        if value not in (None, "") and (
            not isinstance(value, (int, float)) or isinstance(value, bool)
        ):
            errors.append((field, "numeric"))

    if row.get("marker_type") not in (None, "") and row["marker_type"] not in MAP_MARKER_VALID_TYPES:
        errors.append(("marker_type", "controlled"))

    if row.get("status") not in (None, "") and row["status"] not in MAP_MARKER_VALID_STATUS:
        errors.append(("status", "controlled"))

    if bool(row.get("source_entity")) != bool(row.get("source_id")):
        errors.append(("source_entity/source_id", "paired"))

    return errors
