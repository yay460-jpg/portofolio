import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services.map_marker_contract import (
    MAP_MARKER_ENTITY,
    MAP_MARKER_HEADERS,
    MAP_MARKER_PRIMARY_KEY,
    MAP_MARKER_REQUIRED_FIELDS,
    MAP_MARKER_SPATIAL_FIELDS,
    MAP_MARKER_REFERENCE_FIELDS,
    MAP_MARKER_VALID_TYPES,
    MAP_MARKER_VALID_STATUS,
    MAP_MARKER_SOURCE_ENTITIES,
)


def test_stage20_map_marker_persistence_contract_is_separate_from_hse():
    assert MAP_MARKER_ENTITY == "MapMarker"
    assert MAP_MARKER_ENTITY != "HSE"
    assert MAP_MARKER_PRIMARY_KEY == "marker_id"


def test_stage20_map_marker_persistence_contract_has_canonical_fields():
    assert MAP_MARKER_HEADERS == [
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


def test_stage20_map_marker_contract_requires_explicit_spatial_coordinates():
    assert MAP_MARKER_SPATIAL_FIELDS == {"easting", "northing", "elevation"}
    assert MAP_MARKER_SPATIAL_FIELDS.issubset(MAP_MARKER_REQUIRED_FIELDS)


def test_stage20_map_marker_contract_separates_spatial_and_domain_reference_fields():
    assert MAP_MARKER_REFERENCE_FIELDS == {"source_entity", "source_id"}
    assert MAP_MARKER_SPATIAL_FIELDS.isdisjoint(MAP_MARKER_REFERENCE_FIELDS)


def test_stage20_map_marker_contract_matches_central_marker_types():
    assert MAP_MARKER_VALID_TYPES == (
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


def test_stage20_map_marker_contract_has_non_destructive_status_values():
    assert MAP_MARKER_VALID_STATUS == ("ACTIVE", "INACTIVE", "REMOVED")


def test_stage20_map_marker_contract_maps_hse_and_existing_runtime_entities():
    assert MAP_MARKER_SOURCE_ENTITIES["HSE"] == "HSE"
    assert MAP_MARKER_SOURCE_ENTITIES["ASSET"] == "Equipment"
    assert MAP_MARKER_SOURCE_ENTITIES["WORKFRONT"] == "WorkFront"


def test_stage20_map_marker_contract_is_active_in_canonical_runtime_schema():
    from mine_services.schema import DOMAIN_ENTITIES, SHEETS, HEADERS

    assert "MapMarker" in DOMAIN_ENTITIES
    assert "MapMarker" in SHEETS
    assert HEADERS["MapMarker"] == MAP_MARKER_HEADERS


def test_stage20_map_marker_contract_matches_current_schema_version():
    from mine_services.schema import SCHEMA_VERSION

    assert SCHEMA_VERSION == "A.3"
