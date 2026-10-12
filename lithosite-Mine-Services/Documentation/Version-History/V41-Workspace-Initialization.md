# V41 — Workspace Initialization

**Status:** ACTIVE DEVELOPMENT WORKSPACE  
**Base baseline:** V40 locked baseline promoted to `main`  
**Base commit:** `f1bc72240441049cc51a5c8aacc537b7e5674c44`  
**Workspace branch:** `v41-workspace`  
**Canonical runtime artifact:** `Artifacts/Mine-Services-Operations.html`

## Workspace creation record

This branch was created directly from the promoted `main` baseline after V40 was explicitly locked. The repository's unrelated portfolio projects were preserved during promotion. Historical snapshots and release records remain under Documentation.

## Standing engineering rules

1. Keep runtime, CSS, JavaScript, configuration, migration, and test filenames version-neutral. Version lineage belongs in Documentation only.
2. Do not edit `main` directly for ordinary development. Work on `v41-workspace`; promote only after an explicit lock decision and validation.
3. Preserve existing PASS behavior. Do not reopen the Reports CSS cascade cleanup without evidence of regression or duplication.
4. Keep the Equipment Performance layout and established dashboard/map behavior protected unless a reproducible defect proves a change is needed.
5. The shared Deep Navy date/time picker contrast fix is part of the baseline.
6. The global Target vs Actual decision remains **HOLD**: retain the initial dialog, but do not finalize universal material-category formulas, date/shift behavior, or full Target Plan/Dashboard integration until owner direction.
7. Do not reset, replace, or mutate the operational A3 workbook as a way to satisfy CI. CI uses an isolated fixture; operational workbook acceptance remains explicitly deferred and unverified.

## Source baseline evidence

- Final normalized source tree passed GitHub Actions Full Pytest #457: **573 passed in 49.32s**, commit `a7bafa5f8f4ef276595ae712eb909a80497f3219`.
- The final baseline documentation commit passed Full Pytest #458.
- V40 lock record: [V40 Baseline Lock](./Baseline/V40-Baseline-Lock.md).

## V41 housekeeping record

- Normalized 48 active test filenames from historical Stage/Vxx labels to feature-oriented names. Added a CI guard to prevent version-labelled test filenames from returning.
- Updated the workspace baseline guard to verify the active artifact directory contains exactly the canonical HTML entry point without hard-coding retired artifact filenames.
- Corrected malformed single-byte dash characters in two historical Stage 16 Markdown records to valid UTF-8, preserving the surrounding evidence text.
- Generalized report-history fallback discovery to recognize legacy versioned cache-key patterns while keeping the active storage key version-neutral.
- Added a branch-only Jekyll build validation workflow using the same GitHub Pages build action, with no deployment, so documentation can be checked before changing the locked main baseline.

## Contract audit

- Repointed 23 active UI contract test files across Dashboard, Reports, Data Management, HSE, Maintenance, Map, Operations, Plans/Target Plan, and WorkFront to the canonical runtime HTML. The historical UI snapshot remains archived as evidence only. Where cache dates were stale, checks now assert stable asset paths and script order instead of fixed query dates.
- Replaced the stale V37/Stage 26 app-info display with version-neutral workspace metadata and aligned the artifact label with the canonical Mine Services Operations entry point.

## KPI contract dependency audit

- Neutralized legacy V34/V35/V36 release labels in the active KPI engine/foundation metadata. Preserved algorithm and storage-contract revisions as component-level identifiers, and added generic compatibility loading for older version-prefixed KPI store files so historical snapshots are retained.
- Migrated the shared Dashboard/Reports KPI policy cache from a release-prefixed key to a version-neutral key. Both readers discover legacy version-prefixed keys and normalize valid saved policy into the canonical key without deleting the legacy value.

## Workspace policy

All new implementation work starts from this branch. Do not add version-specific runtime artifacts. Keep the current runtime entry point canonical and version-neutral. Update version-history documents when a release is completed; do not treat this workspace initialization as a release or baseline lock.
