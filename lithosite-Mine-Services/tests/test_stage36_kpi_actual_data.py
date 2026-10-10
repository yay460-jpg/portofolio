from pathlib import Path
import json
import os
import subprocess
import tempfile

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]


def _database_path():
    configured = os.environ.get("MINE_SERVICES_TEST_DB")
    if configured:
        path = Path(configured)
        if not path.is_file():
            raise AssertionError(f"Configured test workbook was not found: {path}")
        return path

    candidates = [
        ROOT / "Database" / "Mine-Services-Database.xlsx",
        ROOT / "Database" / "Mine-Services-Database-A3.xlsx",
    ]
    for path in candidates:
        if path.exists():
            return path
    raise AssertionError("Mine Services database workbook was not found in Database/.")


def _rows(workbook, sheet_name):
    ws = workbook[sheet_name]
    values = list(ws.values)
    assert values, f"{sheet_name} sheet is empty"
    headers = list(values[0])
    return [
        dict(zip(headers, row))
        for row in values[1:]
        if not all(value is None for value in row)
    ]


def test_stage36_actual_database_kpi_default_policy():
    db = _database_path()
    wb = load_workbook(db, read_only=True, data_only=True)

    data = {
        "Equipment": _rows(wb, "Equipment"),
        "Operations": _rows(wb, "Operations"),
        "Maintenance": _rows(wb, "Maintenance"),
    }

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".json",
        encoding="utf-8",
        delete=False,
    ) as handle:
        json.dump(data, handle, default=str)
        json_path = Path(handle.name)

    try:
        harness = ROOT / "tests" / "runtime_kpi_actual_data_harness.js"
        result = subprocess.run(
            ["node", str(harness), str(json_path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        json_path.unlink(missing_ok=True)

    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout.strip())

    assert output["equipmentCount"] == len(data["Equipment"])
    assert output["operationsCount"] == len(data["Operations"])
    assert output["maintenanceCount"] == len(data["Maintenance"])

    assert output["policy"]["baseline"]["baseline_id"] == "TB-PROJECT-DAY-0600-1800"
    assert output["policy"]["baseline"]["shift_start"] == "06:00"
    assert output["policy"]["baseline"]["shift_end"] == "18:00"
    assert output["policy"]["euDenominator"] == "AVAILABLE"
    assert output["policy"]["effectiveTimeRule"] == "PURE_EFFECTIVE"

    assert output["calculationState"] == "NEEDS_VALIDATION"

    # The currently seeded V36 database has no validated event coverage
    # sufficient to make a fleet KPI READY under the default policy.
    assert output["eligible"] == 0
    assert output["excluded"] == output["equipmentCount"]

    assert output["fleetPA"] is None
    assert output["fleetUA"] is None
    assert output["fleetEU"]["status"] == "NEEDS_VALIDATION"
    assert output["fleetEU"]["value"] is None

    print("ACTUAL_DATABASE_KPI_DEFAULT_POLICY_PASS")
    print("date=" + str(output["date"]))
    print("Fleet PA=" + str(output["fleetPA"]))
    print("Fleet UA=" + str(output["fleetUA"]))
    print("Fleet EU=" + str(output["fleetEU"]))
    print("Calculation State=" + str(output["calculationState"]))
    print("Eligible=" + str(output["eligible"]))
    print("Excluded=" + str(output["excluded"]))
