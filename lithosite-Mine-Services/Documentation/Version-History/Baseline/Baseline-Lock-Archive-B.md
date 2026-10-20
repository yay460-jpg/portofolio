# V40 Baseline Lock — Lithosite Mine Services

**Status:** LOCKED  
**Owner decision:** V40 is closed as the latest baseline and is to be promoted to `main`.  
**Source validation commit:** `a7bafa5f8f4ef276595ae712eb909a80497f3219`  
**Source validation:** GitHub Actions Full Pytest #457 — PASS on exact commit `a7bafa5f8f4ef276595ae712eb909a80497f3219`; **573 passed in 49.32s**. Earlier Full Pytest #451 and the local 573-test run also passed on their respective source states.  
**Canonical runtime entry point:** `Artifacts/Mine-Services-Operations.html`  
**Schema:** A.3  
**Database:** `Database/Mine-Services-Database-A3.xlsx`

## Lock decision

V40 is the accepted baseline for the current Mine Services runtime. Version-specific runtime artifact copies are retired from the active `Artifacts/` directory. The Desktop Host and launcher use the version-neutral canonical artifact.

The post-validation cleanup normalizes active artifact, migration utility, and regression-test filenames so they do not carry a release identifier. The normalized tree passed the full test suite on exact commit `a7bafa5f8f4ef276595ae712eb909a80497f3219` before promotion to `main`.

## Retained baseline scope

- Reports CSS cascade cleanup is closed; do not reopen it without evidence of a regression or duplicate/dead rule.
- Deep Navy date/time picker contrast is retained in the shared form-field stylesheet.
- Existing dashboard, map, Equipment Performance, modal, and persistence behavior is preserved.
- Schema A.3 and the operational workbook path remain canonical.
- The repository's unrelated portfolio projects are outside this promotion scope.

## Explicitly deferred / not represented as PASS

- **Plan vs Actual business semantics: HOLD.** Keep the initial dialog; do not lock universal category formulas, date/shift comparison behavior, or full Target Plan/Dashboard integration until the owner gives the business definition. The global, version-neutral reminder in `Documentation/README.md` is authoritative.
- **Runtime acceptance against the developer's operational A3 workbook:** not evidenced by CI. Full Pytest uses an isolated temporary fixture. The owner has chosen to close and lock V40; this runtime gate is recorded as deferred rather than falsely marked PASS. Do not reset, replace, or mutate the operational workbook to satisfy the gate.

## Promotion and workspace rollover

1. Promote the validated, version-neutral Mine Services project tree to repository `main`, preserving unrelated repository projects.
2. Verify the canonical entry point and current baseline documentation on `main`.
3. Create the next development workspace from the promoted `main` baseline. New work must begin from that fresh workspace, not from the superseded workspace.
4. Keep version lineage and release evidence under `Documentation/Version-History/`; do not retain version-specific runtime artifacts in active folders.

## Historical references

Earlier baseline records remain under `Documentation/Version-History/` for historical traceability only. This lock does not rewrite Git history.
