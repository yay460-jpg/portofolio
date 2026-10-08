# Database

Authoritative Mine Services database and schema artifacts.

## Current database - Single Source of Truth

`Mine-Services-Database-A3.xlsx` is the single active database used by the offline runtime.

Rules:
- Runtime reads and writes only `Mine-Services-Database-A3.xlsx`.
- The current schema version is `A.3`.
- Schema evolution is tracked by the schema version in `_System`.
- A new database version is created only when an actual schema migration is required.
- Historical database baselines are stored under `Database/Archive/` and are not runtime sources.
- `Mine-Services-Database.xlsx` (A2) is retired and is no longer a runtime source.

## Historical archive

`Archive/Mine-Services-Database-A1.xlsx` is the preserved A1 baseline.

It is retained for historical reference and rollback evidence only.

The locked baseline is protected from runtime mutation.

## V38 Measurement field migration

The active A3 workbook uses the canonical `measurement` field for measurement units. Operations also uses `capacity_measurement` for the applied capacity unit. `Equipment.unit_no` remains an identifier and is not renamed.

For an existing A3 workbook created before this V38 migration, run once from the project root:

```powershell
python -m src.mine_services.migrate_v38_measurement
```

The migration renames only workbook headers and preserves the existing measurement values.
