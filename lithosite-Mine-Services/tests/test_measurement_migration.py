from pathlib import Path

from openpyxl import Workbook, load_workbook

from src.mine_services.migrate_measurement import migrate


def make_workbook(path: Path):
    wb = Workbook()
    ws = wb.active
    ws.title = "_Lists"
    ws.append(["unit"])
    ws.append(["ton"])
    for sheet, headers in {
        "Operations": ["transaction_id", "quantity", "unit", "capacity_unit"],
        "Plans": ["plan_id", "target_quantity", "unit"],
        "GlobalCapacity": ["capacity_profile_id", "capacity_value", "unit"],
    }.items():
        ws = wb.create_sheet(sheet)
        ws.append(headers)
        if sheet == "Operations":
            ws.append(["OPS-1", 100, "ton", "ton"])
        elif sheet == "Plans":
            ws.append(["PLN-1", 100, "ton"])
        else:
            ws.append(["GC-1", 25, "ton"])
    wb.save(path)


def test_measurement_migration_renames_only_measurement_headers(tmp_path):
    path = tmp_path / "Mine-Services-Database-A3.xlsx"
    make_workbook(path)

    migrate(path)

    wb = load_workbook(path, data_only=False)
    assert [c.value for c in wb["Operations"][1]] == [
        "transaction_id", "quantity", "measurement", "capacity_measurement"
    ]
    assert [c.value for c in wb["Plans"][1]] == [
        "plan_id", "target_quantity", "measurement"
    ]
    assert [c.value for c in wb["GlobalCapacity"][1]] == [
        "capacity_profile_id", "capacity_value", "measurement"
    ]
    assert wb["_Lists"]["A1"].value == "measurement"
    assert wb["_Lists"]["A2"].value == "ton"


def test_measurement_migration_is_idempotent(tmp_path):
    path = tmp_path / "Mine-Services-Database-A3.xlsx"
    make_workbook(path)

    migrate(path)
    migrate(path)

    wb = load_workbook(path, data_only=False)
    assert wb["Operations"]["C1"].value == "measurement"
    assert wb["Operations"]["D1"].value == "capacity_measurement"
