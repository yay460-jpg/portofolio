import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services.map_marker_validation import validate_map_marker_row


def valid_marker():
    return {
        "marker_id": "MK-001",
        "marker_type": "HSE",
        "label": "HSE-001",
        "easting": 450000.0,
        "northing": 9700000.0,
        "elevation": 25.0,
        "source_entity": "HSE",
        "source_id": "HSE-001",
        "status": "ACTIVE",
    }


def test_stage20_map_marker_validation_accepts_valid_row():
    assert validate_map_marker_row(valid_marker()) == []


def test_stage20_map_marker_validation_requires_spatial_coordinates():
    row = valid_marker()
    row["easting"] = None
    errors = validate_map_marker_row(row)
    assert ("easting", "required") in errors


def test_stage20_map_marker_validation_rejects_invalid_marker_type():
    row = valid_marker()
    row["marker_type"] = "UNKNOWN"
    assert ("marker_type", "controlled") in validate_map_marker_row(row)


def test_stage20_map_marker_validation_rejects_invalid_status():
    row = valid_marker()
    row["status"] = "Closed"
    assert ("status", "controlled") in validate_map_marker_row(row)


def test_stage20_map_marker_validation_requires_paired_domain_link():
    row = valid_marker()
    row["source_id"] = ""
    assert ("source_entity/source_id", "paired") in validate_map_marker_row(row)
