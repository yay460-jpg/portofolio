# Stage 14 — V26 Workspace

## Baseline

V26 is the active Stage 14 workspace copied from the locked V25 Stage 13 baseline.

- V24: removed
- V25: FINAL / LOCKED
- V26: ACTIVE Stage 14 workspace

## Workspace Artifact

`Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v26-STAGE14.html`

## Shell

`ui/shared/shell-navigation-v26.js`

The V26 shell is copied from V25 and uses an isolated session storage key:

`lithosite-v26-active-screen`

This prevents Stage 14 workspace state from sharing the V25 session key.

## Baseline Rule

V25 remains locked and must not be modified.

All Stage 14 functional, UI, runtime, and test changes must be made against V26.

## Runtime Baseline

- Schema: A.2
- Offline database: `Database/Mine-Services-Database-A2.xlsx`
- Desktop Host: `127.0.0.1:8765`
- Official launcher: `Start-Mine-Services.bat`

## Stage 14 — HSE Functional Scope

The first Stage 14 functional scope is **HSE**.

### HSE Contract

HSE uses the existing Schema A.2 entity:

- `hse_id`
- `event_date`
- `domain`
- `work_front_id`
- `event_type`
- `severity`
- `description`
- `action`
- `status`
- `closed_at`

### V26 Implementation

- UI screen: `hseScreen`
- Shell route: `HSE`
- Module: `ui/modules/hse/hse.js`
- Runtime path: RuntimeAdapter → ApplicationService → XLSX persistence → AuditLog
- Work Front is an optional FK.
- Controlled values are read from authoritative `_Lists`.
- CREATE / UPDATE / DELETE are runtime-validated and audit-backed.
- Closed HSE events require `closed_at`; non-Closed events must not persist `closed_at`.
- The existing shell layout remains unchanged.

### Stage 14 Test Contract

Automated coverage is defined in:

`tests/test_stage14_hse.py`

The test contract covers:

- HSE CRUD and audit
- Work Front FK rejection
- controlled-vocabulary rejection
- Closed / non-Closed timestamp validation
- V26 HSE shell/module contract

Manual acceptance will be performed against the official offline Desktop Host after the automated suite passes.


