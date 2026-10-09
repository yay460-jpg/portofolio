# Database

Authoritative Mine Services database and schema artifacts.

## V39 source of truth

**The one and only active runtime workbook is:**

`Database/Mine-Services-Database-A3.xlsx`

The Desktop Host resolves its default database path to this workbook:

`desktop-host/server.py` → `DB_PATH` → `Database/Mine-Services-Database-A3.xlsx`

The canonical schema definition is `src/mine_services/schema.py`, with schema version `A.3`. The workbook's `_System` sheet records the active schema version.

Rules:

- Runtime reads and writes the canonical A3 workbook above only, unless an explicit `MINE_SERVICES_DB` override is deliberately configured for a separate test environment.
- Never treat a backup workbook, a Dataset snapshot, an A1/A2 workbook, or a migration input copy as the live database.
- Do not create parallel active workbooks such as `Mine-Services-Database-A3-copy.xlsx`, `...-latest.xlsx`, or `...-final.xlsx`.
- Do not overwrite, reset, or replace the active workbook with a Git version during normal development; local runtime writes are expected.
- Run a schema migration only when a defined migration contract requires it. A migration should preserve existing records and be safe to rerun where designed to be idempotent.

## Folder responsibilities

| Path | Purpose | Runtime source of truth? |
|---|---|---|
| `Mine-Services-Database-A3.xlsx` | Active A3 operational database | **YES — only live workbook** |
| `Archive/` | Frozen historical or pre-migration workbook copies kept for rollback/audit evidence | No |
| `Datasets/` | Named Dataset Manager snapshots used to save/load a dataset | No; a snapshot becomes current only through the Dataset Manager workflow |
| `marker-location/` | Marker-location backup packages and supporting files | No; auxiliary storage |
| `topography/` | Topography backup packages | No; auxiliary storage |
| `Evidence/` | Central file store for record-linked PDF, image, and Word evidence | No; auxiliary file storage referenced by application records |

The directories are separate storage areas for different purposes, not duplicate live databases.


The Evidence store uses record-specific folders under `Database/Evidence/`, such as `TargetPlan/<plan_id>/`, `HSE/<hse_id>/`, and `Maintenance/<maintenance_id>/`. The Target Plan Evidence modal is currently a read-only viewer; files are copied into their record folder manually until an upload workflow is explicitly implemented. See `Database/Evidence/README.md` for supported formats and handling rules.

## Historical and pre-migration workbook copies

Historical database baselines belong under `Database/Archive/`. Keep one clearly named archival copy for each meaningful baseline or migration checkpoint; include the baseline/migration and date in the filename. Examples:

- `Archive/Mine-Services-Database-A1.xlsx` — preserved A1 baseline.
- `Archive/Mine-Services-Database-A3.pre-v38-lists-YYYYMMDD.xlsx` — preserved pre-migration A3 copy, if present locally.

A pre-migration copy is rollback evidence, not a second active database. If such a file is found in the `Database/` root, stop the Desktop Host before moving it into `Database/Archive/`; verify the filename and that it is not the configured `DB_PATH`. Do not delete it merely to reduce clutter. The active workbook remains `Mine-Services-Database-A3.xlsx`.

## Retired schema generations

- A.1 — historical predecessor.
- A.2 — retired; not a runtime source.
- A.3 — current V39 schema and the only active runtime schema.

`Mine-Services-Database.xlsx` (A2) is retired and must not be used as the runtime source. Historical A1/A2 documentation and migration utilities may remain for audit/history but do not change the active runtime contract.

## V38 measurement-field migration (historical migration)

The canonical A3 workbook uses `measurement` for measurement units and `capacity_measurement` for an applied capacity unit. `Equipment.unit_no` remains an equipment identifier and is not renamed.

For an existing A3 workbook created before this V38 migration, the migration utility is retained for controlled legacy upgrades only:

```powershell
python -m src.mine_services.migrate_v38_measurement
```

Do not run historical migrations against the active workbook unless the workbook has the exact pre-migration contract expected by that utility and a backup has been verified.
