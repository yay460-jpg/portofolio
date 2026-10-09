import sys
from pathlib import Path

from openpyxl import load_workbook, Workbook

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services.persistence import PersistenceStore
from mine_services.schema import SCHEMA_VERSION, SHEETS, HEADERS, CONTROLLED


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
            list_names = list(dict.fromkeys(CONTROLLED.values()))
            ws.append(list_names)
            for row_index in range(max(len(PersistenceStore().controlled_lists[name]) for name in list_names)):
                ws.append([
                    sorted(PersistenceStore().controlled_lists[name])[row_index]
                    if row_index < len(PersistenceStore().controlled_lists[name])
                    else None
                    for name in list_names
                ])
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


def test_stage20_a3_persistence_migrates_top_soil_into_checker_material_list(tmp_path):
    target = tmp_path / "a3-top-soil.xlsx"
    make_a3_workbook(target)

    workbook = load_workbook(target)
    lists = workbook["_Lists"]
    headers = [cell.value for cell in lists[1]]
    material_column = headers.index("checker_material") + 1
    for row_index in range(2, lists.max_row + 1):
        if lists.cell(row=row_index, column=material_column).value == "Top Soil":
            lists.cell(row=row_index, column=material_column).value = None
    workbook.save(target)

    first_store = PersistenceStore(target)
    assert "Top Soil" in first_store.controlled_lists["checker_material"]

    # Reopening should be idempotent: do not add duplicate vocabulary entries.
    PersistenceStore(target)
    saved = load_workbook(target, data_only=True)
    stored_materials = [
        saved["_Lists"].cell(row=row_index, column=material_column).value
        for row_index in range(2, saved["_Lists"].max_row + 1)
    ]
    assert stored_materials.count("Top Soil") == 1
