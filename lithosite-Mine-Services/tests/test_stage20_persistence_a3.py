import sys
from pathlib import Path

from openpyxl import load_workbook, Workbook

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services.persistence import PersistenceStore
from mine_services.schema import SCHEMA_VERSION, SHEETS, HEADERS


def make_a3_workbook(path: Path):
    wb = Workbook()
    wb.remove(wb.active)

    for sheet in SHEETS:
        ws = wb.create_sheet(sheet)
        if sheet in HEADERS:
            ws.append(HEADERS[sheet])
        elif sheet == "_System":
            ws.append(["schema_version", "A.3"])
        elif sheet == "_Lists":
            ws.append(["equipment_category"])
            ws.append(["Heavy Equipment"])
        elif sheet == "_Baseline":
            ws.append(["baseline"])
            ws.append(["A.3 baseline"])

    wb.save(path)


def test_stage20_a3_persistence_store_is_default():
    store = PersistenceStore()
    assert store.schema.SCHEMA_VERSION == "A.3"
    assert "MapMarker" in store.schema.DOMAIN_ENTITIES
    assert SCHEMA_VERSION == "A.3"


def test_stage20_a3_persistence_store_holds_mapmarker_in_memory():
    store = PersistenceStore()
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


def test_stage20_a3_persistence_store_roundtrips_canonical_workbook(tmp_path):
    target = tmp_path / "a3.xlsx"
    make_a3_workbook(target)

    store = PersistenceStore(target)
    assert store.schema.SCHEMA_VERSION == "A.3"
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
    assert marker_rows[1] == tuple(
        row[field] for field in store.schema.HEADERS["MapMarker"]
    )


def test_stage20_a3_persistence_store_rejects_non_a3_workbook(tmp_path):
    target = tmp_path / "legacy.xlsx"
    wb = Workbook()
    ws = wb.active
    ws.title = "_System"
    ws.append(["schema_version", "A.2"])
    wb.save(target)

    try:
        PersistenceStore(target)
    except ValueError as exc:
        assert "SCHEMA_VERSION" in str(exc)
    else:
        raise AssertionError("A.3 default store must reject a non-A3 workbook")
