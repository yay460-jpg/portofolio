"""One-time V39 migration: move operational capacity ownership from WorkFront to Equipment.

The migration is intentionally conservative:
- Existing Equipment.capacity_profile_id values are preserved.
- Blank Equipment profiles are inferred only from Operations history.
- A profile is assigned only when exactly one valid Global Capacity profile can
  be resolved for that equipment.
- Ambiguous or unresolved equipment remains blank for manual assignment.

Run:
    python -m src.mine_services.migrate_v39_equipment_capacity [path-to-xlsx]
"""
from pathlib import Path
import sys

from openpyxl import load_workbook

from . import schema


DEFAULT_DB = Path(__file__).resolve().parents[2] / "Database" / "Mine-Services-Database-A3.xlsx"


def migrate(path: Path):
    wb = load_workbook(path)
    for sheet in ("Equipment", "Operations", "WorkFront", "GlobalCapacity"):
        if sheet not in wb.sheetnames:
            raise ValueError(f"Cannot migrate: required sheet is missing: {sheet}")

    equipment_ws = wb["Equipment"]
    operations_ws = wb["Operations"]
    workfront_ws = wb["WorkFront"]
    capacity_ws = wb["GlobalCapacity"]

    equipment_headers = [cell.value for cell in equipment_ws[1]]
    if equipment_headers != schema.HEADERS["Equipment"]:
        raise ValueError("HEADER_MISMATCH:Equipment")

    operation_headers = [cell.value for cell in operations_ws[1]]
    workfront_headers = [cell.value for cell in workfront_ws[1]]
    capacity_headers = [cell.value for cell in capacity_ws[1]]

    equipment_index = {name: index for index, name in enumerate(equipment_headers)}
    operation_index = {name: index for index, name in enumerate(operation_headers)}
    workfront_index = {name: index for index, name in enumerate(workfront_headers)}
    capacity_index = {name: index for index, name in enumerate(capacity_headers)}

    valid_profiles = {
        row[capacity_index["capacity_profile_id"]]
        for row in capacity_ws.iter_rows(min_row=2, values_only=True)
        if row[capacity_index["capacity_profile_id"]] not in (None, "")
    }

    workfront_profiles = {
        row[workfront_index["work_front_id"]]: row[workfront_index["capacity_profile_id"]]
        for row in workfront_ws.iter_rows(min_row=2, values_only=True)
        if row[workfront_index["work_front_id"]] not in (None, "")
    }

    operation_rows = list(operations_ws.iter_rows(min_row=2, values_only=True))
    resolved = []
    ambiguous = []
    untouched = []

    for row_number, row in enumerate(equipment_ws.iter_rows(min_row=2), start=2):
        equipment_id = row[equipment_index["equipment_id"]].value
        current_profile = row[equipment_index["capacity_profile_id"]].value
        if current_profile not in (None, ""):
            untouched.append(equipment_id)
            continue

        candidates = set()
        for operation in operation_rows:
            if operation[operation_index["equipment_id"]] != equipment_id:
                continue

            profile = operation[operation_index["capacity_profile_id"]]
            if profile in valid_profiles:
                candidates.add(profile)

            if profile in (None, ""):
                legacy_workfront = workfront_profiles.get(operation[operation_index["work_front_id"]])
                if legacy_workfront in valid_profiles:
                    candidates.add(legacy_workfront)

        if len(candidates) == 1:
            profile = next(iter(candidates))
            row[equipment_index["capacity_profile_id"]].value = profile
            resolved.append((equipment_id, profile))
        elif len(candidates) > 1:
            ambiguous.append((equipment_id, sorted(candidates)))
        else:
            untouched.append(equipment_id)

    wb.save(path)
    return resolved, ambiguous, untouched


if __name__ == "__main__":
    target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_DB
    resolved, ambiguous, untouched = migrate(target)
    print(f"Resolved: {len(resolved)}")
    for equipment_id, profile in resolved:
        print(f"  {equipment_id} -> {profile}")
    print(f"Ambiguous: {len(ambiguous)}")
    for equipment_id, profiles in ambiguous:
        print(f"  {equipment_id} -> {', '.join(profiles)}")
    print(f"Unresolved/unchanged: {len(untouched)}")
    print(target)
