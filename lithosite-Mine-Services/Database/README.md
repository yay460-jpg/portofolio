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
