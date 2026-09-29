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

## Stage 14 Start

V26 is a workspace copy only at creation. No Stage 14 feature scope has been declared yet.

The next Stage 14 change must be defined and tested explicitly before implementation.
