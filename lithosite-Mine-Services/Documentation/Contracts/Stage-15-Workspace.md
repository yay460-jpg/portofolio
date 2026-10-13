# Stage 15 — V27 Closure Lock

## Baseline

V27 is the completed and locked Stage 15 baseline, copied directly from the locked V26 Stage 14 baseline.

- V22: removed
- V23: removed
- V24: removed
- V25: removed
- V26: retired from runtime/workspace; historical documentation retained
- V27: FINAL / LOCKED

## Workspace Artifact

`Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v27-STAGE15.html`

## Shell

`ui/shared/shell-navigation-v27.js`

The V27 shell is copied from V26 and uses an isolated session storage key:

`lithosite-v27-active-screen`

This prevents Stage 15 workspace state from sharing the V26 session key.

## Baseline Rule

V26 is retired from the active runtime/workspace. V27 is now frozen and must not be modified.

## Runtime Baseline

- Schema: A.2
- Offline database: `Database/Mine-Services-Database-A2.xlsx`
- Desktop Host: `127.0.0.1:8765`
- Official launcher: `Start-Mine-Services.bat`

## Stage 15 Acceptance

- Operational Data Management: PASS / FINAL
- Automated regression: 98 passed
- Import Data UI: PASS
- Backup: PASS
- Restore: PASS / COMMITTED / AUDITED
- V27 smoke test: PASS

## Copy Integrity

V27 is a workspace copy of the locked V26 baseline. No Stage 15 feature implementation has been introduced by the workspace creation itself.

## Successor

V27 is copied into the V28 Stage 16 workspace.

## Final Decision

**STAGE 15 — V27: PASS / FINAL / LOCKED**
