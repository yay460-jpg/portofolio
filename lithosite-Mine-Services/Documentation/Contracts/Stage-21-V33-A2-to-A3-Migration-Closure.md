# V33 A2-to-A3 Migration Closure

## 1. V33 Scope

V33 establishes the A3 database as the current Mine Services runtime source of truth and retires the A2 database artifact from the repository.

The migration covers the database schema, runtime cutover, UI runtime status reporting, regression-test targeting, and current database documentation.

## 2. Baseline

The V33 migration started from the A2 database:

- Database: `Database/Mine-Services-Database.xlsx`
- Schema version: `A.2`
- Existing A2 domain sheets were preserved during migration.
- The A2 database was treated as the migration source, not as the future runtime source of truth.

The A2-to-A3 migration implementation is non-destructive to the source workbook: the migration creates a separate A3 target workbook and validates the result.

## 3. Target A3

The A3 database is:

`Database/Mine-Services-Database-A3.xlsx`

The validated A3 workbook contains:

`_Baseline, _System, _Lists, Equipment, WorkFront, Operations, Maintenance, Issues, Plans, HSE, MapMarker, AuditLog`

The `_System.schema_version` value is `A.3`.

## 4. Schema Changes

A3 extends the A2 domain model with the `MapMarker` entity.

MapMarker fields:

- `marker_id`
- `marker_type`
- `label`
- `easting`
- `northing`
- `elevation`
- `source_entity`
- `source_id`
- `status`

Required spatial identity fields are `marker_id`, `marker_type`, `easting`, `northing`, and `elevation`.

The A2 data sheets were preserved in the migrated A3 workbook.

## 5. Runtime Cutover

The desktop runtime was changed so the default database is:

`Database/Mine-Services-Database-A3.xlsx`

The runtime schema selection supports A3 through the A3 schema module.

Health reporting exposes the active schema, allowing the UI to display the actual runtime schema instead of embedding a fixed A2/A3 value.

A2 remains supported where explicitly required by migration/test compatibility paths, but it is no longer the default runtime source.

## 6. UI / Runtime Status

V33 removed the hardcoded A2 schema label from the current artifact.

The V33 artifact now obtains runtime status through `runtime-status.js`, which reads the runtime health response and displays:

- offline/online mode
- active schema
- runtime readiness

Reports also include the schema returned by runtime health.

The current UI therefore does not need a manual A2-to-A3 string update when the active runtime schema changes.

## 7. Validation Evidence

The migration and runtime behavior were validated before final A2 retirement, including:

- A2-to-A3 migration validation.
- A3 workbook structure and `_System` validation.
- MapMarker persistence and CRUD validation.
- Runtime persistence across restart.
- A3 runtime health validation.
- Full regression after retargeting current-artifact tests.

Final full regression result:

`232 passed in 4.40s`

## 8. Current Artifact Test Alignment

Several legacy tests still referenced the retired V32 Stage 20 artifact. Those tests were retargeted to the current V33 Stage 21 artifact:

- `tests/test_stage8_operations_ui.py`
- `tests/test_stage14_hse.py`
- `tests/test_stage15_data_management.py`
- `tests/test_stage16_reports.py`
- `tests/test_stage20_geo_engine.py`

Only the artifact path was changed; the existing test contracts and assertions were preserved.

Historical evidence documents that intentionally record V32/V29 state were not rewritten as part of this migration.

## 9. Source-of-Truth Transition

After validation:

- A3 is the current database source of truth.
- `Database/README.md` identifies A3 as the active database.
- The A2 database file was removed from the repository.
- The V33 runtime no longer depends on the A2 database filename as its default source.

The retirement applies to the A2 database artifact. A2 schema/migration compatibility code may remain where required to support historical migration logic and tests.

## 10. A2 Retirement

The A2 database artifact:

`Database/Mine-Services-Database.xlsx`

was removed from the repository only after the A3 cutover and full regression were validated.

This prevents two competing database source-of-truth files from remaining in the active repository.

## 11. Preservation Constraints

The following were intentionally preserved:

- V32-LOCKED baseline.
- Existing A3 data migrated from A2.
- Existing Map/Top View behavior and stabilized map functionality.
- Existing migration support required for A2-to-A3 transition.
- Historical documentation that records earlier stage state.

No global A2-to-A3 string replacement was used.

## 12. Git Evidence

Final V33 closure commit:

`19cdee18d7f2951d99ff7cd54f98d8ac61f18977`

Commit message:

`stage33: retire A2 database source`

The commit was pushed to `origin/main`.

At closure, local `HEAD` and `origin/main` were both:

`19cdee18d7f2951d99ff7cd54f98d8ac61f18977`

## 13. Final V33 State

V33 migration status: **CLOSED**

Current database:

`Database/Mine-Services-Database-A3.xlsx`

Current schema:

`A.3`

A2 database artifact:

**Retired / removed from repository**

Final regression:

**232 passed**

V33 establishes A3 as the database baseline for subsequent development stages.
