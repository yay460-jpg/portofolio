# V36 / Stage 25 — Closure Lock

## Status

V36 / Stage 25 is frozen as the baseline for the V37 cleanup workspace.

Locked branch baseline:
- branch: `v36-workspace`
- baseline commit: `86141e7b029315773e1747da9f0c33e1a1d5d165`
- active artifact: `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v36-STAGE25.html`

## Locked scope

V36 closes the Reports/KPI Policy Set and positive KPI-path work completed during Stage 25, including:
- KPI Time Console as Policy Set configuration point.
- Work Time Baseline selection.
- EU denominator selection.
- Effective Time Rule selection.
- Apply/Reset/Cancel behavior.
- Applied policy persistence across browser refresh.
- Reset confirmation before replacing policy selection.
- Equipment Unit column in Reports/KPI.
- Fleet KPI calculation path and validation gates.
- Actual-database and policy-functional KPI tests.
- Operations reference vocabulary additions for `Mining` and `cycle`.
- Regression baseline established during V36.

## V36 lock rule

No cleanup, schema retirement, refactoring, or historical-file removal is to be performed on the locked V36 branch after this closure marker.

All remaining cleanup is deferred to V37 and must be traceable as a separate change.

## V37 carry-forward audit targets

V37 will trace and classify legacy/dead material before deletion. The audit must cover:
1. A2 schema/runtime compatibility paths and migration references.
2. Retired database filenames and stale database references.
3. V34/V35 active-entry references that should be historical only.
4. Legacy tests that still point to retired artifacts or schemas.
5. Stale documentation and README references.
6. Unused/duplicate UI modules, CSS, JS, compatibility shims, and dead selectors.
7. Desktop-host legacy configuration switches and entry markers.
8. Old comments, provenance labels, and duplicated policy definitions.
9. Any duplicated or shadow runtime contracts.
10. Test-only helpers introduced during V36 that should be retained, consolidated, or retired.

V37 must classify each finding as KEEP-HISTORICAL, KEEP-ACTIVE, MIGRATE, or REMOVE before making destructive changes.
