import sys
from pathlib import Path

from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services.persistence import PersistenceStore
from mine_services.schema import SCHEMA_VERSION
from mine_services import schema_a3
from mine_services.schema_migration import migrate_a2_to_a3


def test_stage20_a3_persistence_store_is_opt_in():
    store = PersistenceStore(schema_module=schema_a3)
    assert store.schema.SCHEMA_VERSION == "A.3"
    assert "MapMarker" in store.schema.DOMAIN_ENTITIES
    assert "MapMarker" not in PersistenceStore().schema.DOMAIN_ENTITIES
    assert SCHEMA_VERSION == "A.2"


def test_stage20_a3_persistence_store_holds_mapmarker_in_memory():
    store = PersistenceStore(schema_module=schema_a3)
    row = {
        "marker_id": "MK-A3-001",
        "marker_type": "HSE",
        "label": "HSE-001",
        "easting": 450000.0,
        "northing": 9700000.0,
        "elevation": 25.5,
        "source_entity": "HSE",
        "source_id": "HSE-001",
        "status": "ACTIVE",
    }
    store.insert("MapMarker", row["marker_id"], row)

    assert store.get("MapMarker", "MK-A3-001") == row
    assert store.all("MapMarker") == [row]


def test_stage20_a3_persistence_store_roundtrips_migrated_workbook(tmp_path):
    source = tmp_path / "source-a2.xlsx"
    target = tmp_path / "target-a3.xlsx"

    from tests.test_stage20_schema_migration import make_a2_workbook
    make_a2_workbook(source)
    migrate_a2_to_a3(source, target)

    store = PersistenceStore(target, schema_module=schema_a3)
    assert store.schema.SCHEMA_VERSION == "A.3"
    assert store.get("Equipment", "EQ-MIG-001")["equipment_id"] == "EQ-MIG-001"
    assert store.get("HSE", "HSE-MIG-001")["hse_id"] == "HSE-MIG-001"
    assert store.get("MapMarker", "missing") is None

    row = {
        "marker_id": "MK-A3-002",
        "marker_type": "WORKFRONT",
        "label": "WF-002",
        "easting": 451000.0,
        "northing": 9701000.0,
        "elevation": 30.0,
        "source_entity": "WorkFront",
        "source_id": "WF-002",
        "status": "ACTIVE",
    }
    store.insert("MapMarker", row["marker_id"], row)
    store.save()

    saved = load_workbook(target, data_only=True)
    marker_rows = list(saved["MapMarker"].values)
    assert marker_rows[1] == tuple(row[field] for field in schema_a3.HEADERS["MapMarker"])


def test_stage20_a3_persistence_store_rejects_a2_workbook():
    store = PersistenceStore(schema_module=schema_a3)
    assert store.schema.SCHEMA_VERSION == "A.3"
