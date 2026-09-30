# Stage 15 — V27 Workspace

## Baseline

V27 is the active Stage 15 workspace copied directly from the locked V26 Stage 14 baseline.

- V22: removed
- V23: removed
- V24: removed
- V25: removed
- V26: FINAL / LOCKED
- V27: ACTIVE Stage 15 workspace

## Workspace Artifact

`Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v27-STAGE15.html`

## Shell

`ui/shared/shell-navigation-v27.js`

The V27 shell is copied from V26 and uses an isolated session storage key:

`lithosite-v27-active-screen`

This prevents Stage 15 workspace state from sharing the V26 session key.

## Baseline Rule

V26 remains the locked Stage 14 baseline and must not be modified.

All Stage 15 functional, UI, runtime, and test changes must be made against V27.

## Runtime Baseline

- Schema: A.2
- Offline database: `Database/Mine-Services-Database-A2.xlsx`
- Desktop Host: `127.0.0.1:8765`
- Official launcher: `Start-Mine-Services.bat`

## Stage 15 Scope

Stage 15 scope is intentionally **not preselected** in this workspace creation. The next functional scope will be defined before implementation.

## Copy Integrity

V27 is a workspace copy of the locked V26 baseline. No Stage 15 feature implementation has been introduced by the workspace creation itself.

## Final Rule

Do not modify V26 to implement Stage 15. V27 is the only active workspace for the next stage.
