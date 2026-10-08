"""Safe A.2 -> A.3 workbook migration for the active V38 schema.

The migration never mutates the source workbook. It creates a separate target
workbook, validates the A.2 source contract, adds the V38 GlobalCapacity and
Checker sheets, appends V38 capacity fields, adds an empty MapMarker sheet,
updates _System.schema_version to A.3, and validates the resulting structure.
"""

from pathlib import Path
from tempfile import NamedTemporaryFile

from openpyxl import load_workbook

from .schema_migration_contract import (
    CURRENT_SCHEMA_VERSION,
    TARGET_SCHEMA_VERSION,
    A2_DOMAIN_ENTITIES,
    A2_HEADERS,
    A3_SHEETS,
    MAP_MARKER_ENTITY,
    MAP_MARKER_SCHEMA_HEADERS,
    A3_HEADERS_ADDITIONS,
)


class SchemaMigrationError(ValueError):
    pass


def _read_schema_version(workbook):
    ws = workbook["_System"]
    for row in ws.iter_rows(values_only=True):
        values = list(row)
        for index, value in enumerate(values):
            if value == "schema_version" and index + 1 < len(values):
                candidate = values[index + 1]
                if candidate is not None:
                    return str(candidate)
    raise SchemaMigrationError("SCHEMA_VERSION:MISSING")


def _set_schema_version(workbook, version):
    ws = workbook["_System"]
    for row in ws.iter_rows():
        for index, cell in enumerate(row):
            if cell.value == "schema_version":
                if index + 1 >= len(row):
                    raise SchemaMigrationError("SCHEMA_VERSION:VALUE_MISSING")
                row[index + 1].value = version
                return
    raise SchemaMigrationError("SCHEMA_VERSION:MISSING")


def _validate_a2_source(workbook):
    required = set(A2_DOMAIN_ENTITIES) | {"_Baseline", "_System", "_Lists", "AuditLog"}
    missing = required - set(workbook.sheetnames)
    if missing:
        raise SchemaMigrationError(f"SHEET_MISSING:{sorted(missing)}")

    unexpected = set(workbook.sheetnames) - required
    if unexpected:
        raise SchemaMigrationError(f"SHEET_UNEXPECTED:{sorted(unexpected)}")

    version = _read_schema_version(workbook)
    if version != CURRENT_SCHEMA_VERSION:
        raise SchemaMigrationError(
            f"SCHEMA_VERSION:{version} (expected {CURRENT_SCHEMA_VERSION})"
        )

    for entity in A2_DOMAIN_ENTITIES:
        values = list(workbook[entity].values)
        expected = A2_HEADERS[entity]
        if not values or list(values[0]) != expected:
            raise SchemaMigrationError(f"HEADER_MISMATCH:{entity}")

    audit = list(workbook["AuditLog"].values)
    if not audit or list(audit[0]) != A2_HEADERS["AuditLog"]:
        raise SchemaMigrationError("HEADER_MISMATCH:AuditLog")


def _validate_a3_result(workbook):
    if list(workbook.sheetnames) != A3_SHEETS:
        raise SchemaMigrationError(
            f"SHEETS_MISMATCH:{list(workbook.sheetnames)}"
        )

    if _read_schema_version(workbook) != TARGET_SCHEMA_VERSION:
        raise SchemaMigrationError("SCHEMA_VERSION:A3_UPDATE_FAILED")

    for entity, additions in A3_HEADERS_ADDITIONS.items():
        if entity in {"GlobalCapacity", "Checker"}:
            rows = list(workbook[entity].values)
            if not rows or list(rows[0]) != list(additions):
                raise SchemaMigrationError(f"HEADER_MISMATCH:{entity}")

    for entity in ("WorkFront", "Operations"):
        values = list(workbook[entity].values)
        expected = list(A2_HEADERS[entity])
        if entity == "Operations" and "unit" in expected:
            expected[expected.index("unit")] = "measurement"
        expected += A3_HEADERS_ADDITIONS[entity]
        if not values or list(values[0]) != expected:
            raise SchemaMigrationError(f"HEADER_MISMATCH:{entity}")

    marker = workbook[MAP_MARKER_ENTITY]
    if list(marker.values)[0] != tuple(MAP_MARKER_SCHEMA_HEADERS):
        raise SchemaMigrationError("HEADER_MISMATCH:MapMarker")

    if marker.max_row != 1:
        raise SchemaMigrationError("MAPMARKER_NOT_EMPTY")

    # WorkFront and Operations now carry the A.3 appended fields.
    # The remaining A.2 domain sheets must retain their original headers.
    for entity in A2_DOMAIN_ENTITIES:
        if entity in {"WorkFront", "Operations"}:
            continue
        values = list(workbook[entity].values)
        expected = list(A2_HEADERS[entity])
        if entity == "Plans" and "unit" in expected:
            expected[expected.index("unit")] = "measurement"
        if not values or list(values[0]) != expected:
            raise SchemaMigrationError(f"HEADER_MISMATCH:{entity}")

    audit = list(workbook["AuditLog"].values)
    if not audit or list(audit[0]) != A2_HEADERS["AuditLog"]:
        raise SchemaMigrationError("HEADER_MISMATCH:AuditLog")


def migrate_a2_to_a3(source_path, target_path):
    source = Path(source_path)
    target = Path(target_path)

    if not source.exists():
        raise FileNotFoundError(source)
    if source.resolve() == target.resolve():
        raise SchemaMigrationError("SOURCE_TARGET_MUST_DIFFER")
    if target.exists():
        raise FileExistsError(target)

    workbook = load_workbook(source)
    _validate_a2_source(workbook)

    # Add V38 A.3 sheets and append the new headers to existing A2 sheets.
    for entity in ("GlobalCapacity", "Checker"):
        ws = workbook.create_sheet(entity, index=workbook.sheetnames.index("Operations"))
        ws.append(A3_HEADERS_ADDITIONS[entity])

    for entity in ("WorkFront", "Operations"):
        ws = workbook[entity]
        additions = A3_HEADERS_ADDITIONS[entity]
        current = [cell.value for cell in ws[1]]
        for header in additions:
            if header not in current:
                ws.cell(row=1, column=ws.max_column + 1, value=header)
                current.append(header)

    # Canonical V38 terminology replaces the historical A2 "unit" field.
    operations_headers = [cell.value for cell in workbook["Operations"][1]]
    if "unit" in operations_headers and "measurement" not in operations_headers:
        workbook["Operations"].cell(
            row=1, column=operations_headers.index("unit") + 1, value="measurement"
        )

    lists = workbook["_Lists"]
    list_headers = [cell.value for cell in lists[1]]
    if "unit" in list_headers and "measurement" not in list_headers:
        lists.cell(
            row=1, column=list_headers.index("unit") + 1, value="measurement"
        )

    workbook.create_sheet(MAP_MARKER_ENTITY, index=len(workbook.sheetnames) - 1)
    marker = workbook[MAP_MARKER_ENTITY]
    marker.append(MAP_MARKER_SCHEMA_HEADERS)
    _set_schema_version(workbook, TARGET_SCHEMA_VERSION)

    _validate_a3_result(workbook)

    target.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(
        prefix=target.stem + ".",
        suffix=target.suffix,
        dir=target.parent,
        delete=False,
    ) as file:
        temp_path = Path(file.name)

    try:
        workbook.save(temp_path)
        temp_path.replace(target)
    finally:
        if temp_path.exists():
            temp_path.unlink()

    return target
