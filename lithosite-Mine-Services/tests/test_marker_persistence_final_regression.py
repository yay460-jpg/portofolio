import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parents[1] / "src"))

from mine_services import PersistenceStore
from mine_services import schema


def test_kf_a3_is_canonical_default_schema():
    assert schema.SCHEMA_VERSION == "A.3"
    assert "MapMarker" in schema.DOMAIN_ENTITIES
    assert schema.PKS["MapMarker"] == "marker_id"


def test_kf_a3_default_persistence_supports_mapmarker():
    store = PersistenceStore()
    marker = {
        "marker_id": "MK-KF-001",
        "marker_type": "HSE",
        "label": "HSE-KF",
        "easting": 450000.0,
        "northing": 9700000.0,
        "elevation": 25.0,
        "source_entity": "HSE",
        "source_id": "HSE-KF-001",
        "status": "ACTIVE",
    }

    store.insert("MapMarker", marker["marker_id"], marker)
    assert store.get("MapMarker", "MK-KF-001") == marker


def test_kf_a3_marker_sheet_is_not_added_to_hse_headers():
    assert schema.HEADERS["HSE"] == schema.HEADERS["HSE"]
    assert "easting" not in schema.HEADERS["HSE"]
    assert "northing" not in schema.HEADERS["HSE"]
    assert "elevation" not in schema.HEADERS["HSE"]


def test_kf_a3_default_store_is_not_legacy_a2():
    store = PersistenceStore()
    assert store.schema.SCHEMA_VERSION != "A.2"
    assert "MapMarker" in store.schema.DOMAIN_ENTITIES
