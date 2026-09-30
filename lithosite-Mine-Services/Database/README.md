# Database

Authoritative Mine Services database and schema artifacts.

## Current database ? Single Source of Truth

`Mine-Services-Database.xlsx` is the single active database used by the offline runtime.

Rules:
- Runtime reads and writes only `Mine-Services-Database.xlsx`.
- Stage progression does not create a new database filename.
- Schema evolution is tracked by the schema version in `_System`.
- The current schema version is `A.2`.
- A new database version is created only when an actual schema migration is required.
- Historical database baselines are stored under `Database/Archive/` and are not runtime sources.

## Historical archive

`Archive/Mine-Services-Database-A1.xlsx` is the preserved A1 baseline.

It is retained for historical reference and rollback evidence only.

The locked baseline is protected from runtime mutation.
