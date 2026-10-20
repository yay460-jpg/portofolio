# Lithosite — Mine Services

Mine Services is the Lithosite **offline-first desktop runtime** for mine work control, operational data management, equipment, work fronts, maintenance, plans, HSE, issues, reporting, and supporting spatial/topography workflows.

## Current Runtime

- **Workspace:** Locked baseline (version-neutral runtime)
- **Schema:** A.3
- **Canonical database:** `Database/Mine-Services-Database-A3.xlsx`
- **Runtime:** Python Desktop Host
- **Default local endpoint:** `http://127.0.0.1:8765/`
- **Runtime database:** local XLSX
- **VS Code Live Server:** development-only; not the official runtime acceptance path

The A.3 schema is the **single active schema** for the active workspace. Earlier A.1/A.2 schemas and databases are historical predecessors and are not active runtime sources.

## Baseline and Workspace

- **Locked baseline:** see `Documentation/Version-History/Baseline/README.md`.
- **Canonical active artifact:** `Artifacts/Mine-Services-Operations.html`.
- **Workspace policy:** create the next development workspace from the locked baseline; runtime filenames remain version-neutral.
- **Plan vs Actual:** initial dialog is retained; business semantics and date/shift behavior remain on HOLD pending owner direction.

## Open Mine Services

### Normal use / offline runtime

Double-click:

`Start-Mine-Services.bat`

The launcher starts the local Desktop Host when needed, waits for the health endpoint, and opens Mine Services in the browser.

The same launcher is available under:

`desktop-host/start-mine-services.bat`

### Development / UI work

Use VS Code and Live Server for static UI development when required.

For CRUD, persistence, validation, transaction, audit, and offline acceptance testing, use the Desktop Host:

`http://127.0.0.1:8765/`

**Do not use Live Server as the runtime acceptance path.**

## Runtime Architecture

```text
Start-Mine-Services.bat
        ↓
Python Desktop Host :8765
        │
        ├── UI / HTML / JS / assets
        ├── RuntimeAdapter
        ├── Validation / transaction services
        └── Offline persistence
                ↓
        Mine-Services-Database-A3.xlsx
```

The Desktop Host is the authoritative local runtime path. Live Server is only a development convenience for static UI work.

## Shared Contracts

The active workspace uses shared contracts as the canonical owners for shared application behavior. Application-level behavior must not be reimplemented as independent module owners.

### Shared navigation

Canonical navigation owner:

`ui/shared/shell-navigation.js`

The current workspace uses this canonical owner exclusively; there is no parallel navigation owner.

### Shared modal behavior

Canonical modal lifecycle and shell ownership:

- `ui/shared/modal-show-contract.js`
- `ui/shared/modal-shell-contract.css`

The shared modal contract controls the application data-entry modal lifecycle and prevents multiple application data modals from being active at the same time.

### Navigation guard

Canonical navigation guard:

`ui/shared/navigation-guard-contract.js`

The guard coordinates navigation with visible blocking modals and shared application state.

### Runtime status

Runtime health/status behavior is provided through the shared runtime status/client layer. Module-specific runtime status text is treated as an accessory of the shared modal footer where applicable.

## Canonical Database and Schema

The active workspace database is:

`Database/Mine-Services-Database-A3.xlsx`

The canonical schema definition is:

`src/mine_services/schema.py`

Current schema version:

`A.3`

The A3 workbook is the single active runtime database. Schema evolution is tracked through the database system metadata and documented migration contracts.

Historical A.1/A.2 databases and migration utilities may remain in the repository as historical records or migration boundaries. They must not be treated as the current runtime source.

## Measurement Terminology

The current workspace retains **Measurement** as the canonical field terminology where the value represents a measurement unit.

Canonical examples include:

- `Operations.measurement`
- `Operations.capacity_measurement`
- `Plans.measurement`
- `GlobalCapacity.measurement`
- `_Lists.measurement`

`Equipment.unit_no` remains an equipment identifier and is not renamed to Measurement.

The historical measurement migration contract is documented in:

`Documentation/Contracts/Measurement-Field-Migration-Contract.md`

## Project Structure

```text
Database/
    └── Mine-Services-Database-A3.xlsx

Documentation/
    └── contracts, evidence, stage records, and project documentation

Artifacts/
    └── Desktop Master HTML artifacts

desktop-host/
    └── Python local runtime host and launcher

ui/
    ├── shared/
    └── modules/

src/
    └── validation, transaction, application, persistence, schema, and migration services

tests/
    └── automated regression and contract tests
```

## Workspace and baseline status

- Current baseline — **locked**
- Schema A.3 — **canonical / active**
- Database A3 — **canonical / active**
- Offline Desktop Runtime — **implemented**
- Offline Desktop Launcher — **implemented**
- Shared Modal Shell Contract — **active**
- Navigation Guard Contract — **active**
- Shared Runtime Status — **active**
- Controlled Vocabulary — **locked**
- MapMarker — **A.3 active / Phase B complete**
- Checker — **active**
- Global Capacity — **active**
- Operation form layout — **locked**
- Application shell boundary — **locked**
- Legacy active-runtime residue audit — **closed**
- Full pytest on GitHub Actions — latest recorded baseline gate **PASS**; see `Documentation/Version-History/Baseline/README.md`. CI uses an isolated temporary A3 fixture and does not replace or modify the operational workbook.
- Desktop Host runtime bootstrap — **validated against A.3**

Version lineage is recorded only in `Documentation/Version-History/`. The active runtime entry point is version-neutral.

## Database Protection

Earlier database generations are historical predecessors:

- A.1 — historical predecessor
- A.2 — retired predecessor
- A.3 — **canonical runtime database**

The active runtime database is:

`Database/Mine-Services-Database-A3.xlsx`

Local XLSX changes are expected during runtime testing. Do not use destructive Git commands to restore, reset, or delete local database changes unless those changes have been explicitly reviewed.

## Runtime Endpoint

The default local endpoint is fixed:

`http://127.0.0.1:8765/`

Port `8765` is the default Mine Services Desktop Host endpoint, not a randomly allocated temporary port.

The Python host process can be restarted. When it is stopped or after a Windows restart, run:

`Start-Mine-Services.bat`

again.

## Development Rule

When working in the current workspace:

1. Treat `src/mine_services/schema.py` as the canonical schema source.
2. Treat `Database/Mine-Services-Database-A3.xlsx` as the active runtime database.
3. Use the Desktop Host for runtime acceptance.
4. Use shared contracts for shared shell/modal/navigation behavior.
5. Do not introduce parallel owners for behavior already governed by a shared contract.
6. Keep historical version notes in Documentation; keep active runtime and test filenames version-neutral.
7. Update the relevant documentation and contracts when a canonical runtime boundary changes.
8. Preserve historical A.1/A.2 stage records as historical evidence; do not rewrite them to current current workspace state.
9. Do not treat future Android Host work as part of desktop runtime acceptance.
