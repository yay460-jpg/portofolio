"""One-time V38 workbook migration for Global Capacity and hauling snapshots.

Run from the Mine Services repository:
    python -m src.mine_services.migrate_v38_capacity [path-to-xlsx]

The migration is additive: existing rows are preserved and new fields start blank.
"""
from pathlib import Path
import sys
from openpyxl import load_workbook

from . import schema_a3

DEFAULT_DB = Path(__file__).resolve().parents[2] / "Database" / "Mine-Services-Database-A3.xlsx"

def migrate(path: Path):
    wb = load_workbook(path)
    required_sheets = list(schema_a3.SHEETS)

    if "GlobalCapacity" not in wb.sheetnames:
        ws = wb.create_sheet("GlobalCapacity")
        ws.append(schema_a3.HEADERS["GlobalCapacity"])

    for entity in ("WorkFront", "Operations"):
        ws = wb[entity]
        expected = schema_a3.HEADERS[entity]
        current = [c.value for c in ws[1]]
        missing = expected[len(current):]
        for header in missing:
            ws.cell(row=1, column=ws.max_column + 1, value=header)

    for entity in required_sheets:
        if entity not in wb.sheetnames:
            raise ValueError(f"Cannot migrate: required existing sheet is missing: {entity}")

    if "_System" not in wb.sheetnames:
        raise ValueError("Cannot migrate: _System sheet is missing")

    found = False
    ws = wb["_System"]
    for row in ws.iter_rows():
        for cell in row:
            if cell.value == "schema_version":
                ws.cell(row=cell.row, column=cell.column + 1, value=schema_a3.SCHEMA_VERSION)
                found = True
                break
        if found:
            break
    if not found:
        ws.append(["schema_version", schema_a3.SCHEMA_VERSION])

    wb.save(path)
    return path

if __name__ == "__main__":
    target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_DB
    print(migrate(target))
