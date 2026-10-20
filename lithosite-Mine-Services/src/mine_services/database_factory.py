"""Create an empty canonical A.3 workbook for a fresh installation.

This factory is intentionally create-if-missing. It never copies or overwrites
an existing operational workbook.
"""
from __future__ import annotations

import os
from pathlib import Path
from tempfile import NamedTemporaryFile

from openpyxl import Workbook

from . import schema
from .persistence import PersistenceStore


def _build_empty_a3_workbook(path: Path) -> None:
    workbook = Workbook()
    workbook.remove(workbook.active)

    for sheet_name in schema.SHEETS:
        worksheet = workbook.create_sheet(sheet_name)
        if sheet_name in schema.HEADERS:
            worksheet.append(schema.HEADERS[sheet_name])
        elif sheet_name == "NIK":
            worksheet.append(schema.NIK_HEADERS)
        elif sheet_name == "_System":
            worksheet.append(["schema_version", schema.SCHEMA_VERSION])
        elif sheet_name == "_Lists":
            list_names = list(dict.fromkeys(schema.CONTROLLED.values()))
            controlled = PersistenceStore().controlled_lists
            worksheet.append(list_names)
            for row_index in range(max((len(controlled.get(name, set())) for name in list_names), default=0)):
                worksheet.append([
                    sorted(controlled.get(name, set()))[row_index]
                    if row_index < len(controlled.get(name, set()))
                    else None
                    for name in list_names
                ])
        elif sheet_name == "_Baseline":
            worksheet.append(["baseline"])
            worksheet.append([f"{schema.SCHEMA_VERSION} baseline"])

    workbook.save(path)
    workbook.close()


def ensure_a3_database(path: str | Path) -> Path:
    """Ensure an empty A.3 database exists without modifying any existing file."""
    target = Path(path)
    if target.exists():
        return target
    target.parent.mkdir(parents=True, exist_ok=True)

    # Build in the destination directory, then publish atomically. os.link fails
    # if another process created target, so an existing database is never replaced.
    with NamedTemporaryFile(
        prefix=target.stem + ".",
        suffix=target.suffix,
        dir=target.parent,
        delete=False,
    ) as handle:
        temporary = Path(handle.name)
    try:
        _build_empty_a3_workbook(temporary)
        try:
            os.link(temporary, target)
        except FileExistsError:
            pass
        return target
    finally:
        if temporary.exists():
            temporary.unlink()
