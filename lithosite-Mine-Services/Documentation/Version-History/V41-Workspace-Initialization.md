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
- Hardened Report History legacy-key enumeration against storage access exceptions and added runtime migration coverage for malformed current data, interrupted key enumeration, immutable-only writes, and non-destructive fallback.
- Consolidated the Report History migration and storage-failure scenarios into one canonical runtime harness to avoid duplicate test entry points.
- Hardened KPI snapshot/audit coordination: retries of an existing committed snapshot reconcile a missing audit entry; audit records store the actual finalized snapshot (including ID, revision, FINAL status, and fingerprint); repeated retries avoid duplicate audit records; and the Reports UI warns when audit persistence did not succeed.
- Added a branch-only Jekyll build validation workflow using the same GitHub Pages build action, with no deployment, so documentation can be checked before changing the locked main baseline.

## Contract audit

- Repointed 23 active UI contract test files across Dashboard, Reports, Data Management, HSE, Maintenance, Map, Operations, Plans/Target Plan, and WorkFront to the canonical runtime HTML. The historical UI snapshot remains archived as evidence only. Where cache dates were stale, checks assert stable asset paths and script order instead of fixed query dates.
- Follow-up cache-contract audit normalized 31 test files to assert stable asset paths and ordering instead of fixed cache-buster values; the runtime asset query strings remain unchanged.
- Generalized remaining test labels that named earlier stages/releases, removed a hard-coded legacy KPI policy key from the migration contract test, and replaced the app-info release-string assertion with a generic release-label guard.
- Replaced the stale V37/Stage 26 app-info display with version-neutral workspace metadata and aligned the artifact label with the canonical Mine Services Operations entry point.

## KPI contract dependency audit

- Neutralized legacy V34/V35/V36 release labels in the active KPI engine/foundation metadata. Preserved algorithm and storage-contract revisions as component-level identifiers, and added generic compatibility loading for older version-prefixed KPI store files so historical snapshots are retained.
- Migrated the shared Dashboard/Reports KPI policy cache from a release-prefixed key to a version-neutral key. Both readers discover legacy version-prefixed keys and normalize valid saved policy into the canonical key without deleting the legacy value.

## Runtime source neutralization

- Removed stale V23/V34/V35/V38/V39/V40/Stage labels from active runtime comments, diagnostics, and source metadata. Component-level identifiers and the A.3 schema contract remain intact; report metadata now defaults to the neutral application label.

## Data Management identifiers

- Renamed the Data Management module's release-stage-specific DOM identifier namespace to `dataManagement...` across its generated markup, CSS selectors, and tests. Its tests now use a generic release-marker guard and stable script/style paths rather than literal stage labels or cache dates. The dataset save/load/backup dialog behavior stays owned by the same module.

## Compatibility audit

- `ImportCoordinator.read_xlsx()` now closes the opened workbook in a `finally` block across success, schema/header rejection, and unexpected parse failure; regression tests track the close call on both accepted and rejected workbook paths.


- Remaining in-place A.3 header/list repairs in `PersistenceStore.load()` now write and verify a sibling workbook before atomic replacement; temporary validation checks both canonical entity headers and required controlled-list headers, with fault-injection tests proving the active XLSX bytes remain unchanged on validation/replace failures.


- Evidence status/list/file/preview reads now share the host adapter lifecycle lock with record creation/deletion and uploads. File bytes are read while the lock is held, then responses are sent after releasing it, preventing false not-found/partial-read races without holding the runtime lock during network writes.


- Host lifecycle locking retains compatibility with handle-only adapter shims through a guarded post-process helper and no-op context fallback; the production RuntimeAdapter still uses the shared re-entrant lock.


- The host now keeps record mutation and Plan/HSE/Maintenance Evidence-folder lifecycle in the same adapter critical section. Evidence uploads re-check the owner record and commit the file under that same lock, preventing DELETE/CREATE from racing between record verification and upload.


- RuntimeAdapter now serializes complete requests with a re-entrant lock because the desktop host shares one adapter across ThreadingHTTPServer workers. A deterministic concurrency test verifies a read cannot enter the shared runtime while a write transaction is blocked.


- Global Capacity/Checker migration now accepts only canonical header prefixes for the affected A.3 sheets, rejects unknown schemas or populated unnamed columns, verifies the serialized workbook before replacement, and uses an atomic temp-file swap with source-preservation tests.


- Equipment capacity migration now writes to a sibling temporary workbook and verifies the final Equipment header plus resolved/preserved/unresolved profile assignments before atomic replacement; injected replace failures preserve the active workbook byte-for-byte.


- Measurement-header migration now saves to a same-directory temporary workbook, verifies the renamed headers there, and only then atomically replaces the active workbook. Fault-injection tests prove verification or replacement failure leaves the original workbook byte-for-byte intact and removes the temporary file.


- A.2-to-A.3 migration publishes the validated temporary workbook with an atomic no-overwrite install; if a target appears after the initial check, migration fails without replacing it or mutating the source.


- Backup listing and retention discovery now skip symlinks, non-regular entries, and paths whose metadata cannot be read, so one stale/unreadable directory entry does not break listing or save retention; targeted tests inject a stat failure for each package type.


- Topography and Marker Location backup writes now use a same-directory temporary file and atomic replacement; base64 length is checked against the package-size limit before decoding, and fault-injection tests verify failed replacement leaves no partial backup.


- Dataset load failure rollback restores controlled-list vocabulary and active-dataset metadata as well as entity data and AuditLog. Dataset save/save-as now compensate the JSON file, temp file, active-dataset pointer, and AuditLog state if workbook audit persistence fails.


- Import staging now copies the active store's controlled vocabulary before validation, so imports honor the authoritative workbook `_Lists` values instead of staging-store defaults; coverage verifies custom values are accepted and retired defaults are rejected.


- Snapshot `MERGE_RUNTIME` now deduplicates identical audit events by `audit_id` and rejects conflicting payloads for a reused audit ID before mutating runtime data; tests cover both outcomes.


- Dashboard and Reports now share one KPI policy storage owner with behavioral tests for newest-valid selection, malformed-cache fallback, canonical precedence, and preservation of legacy values.

- Report-history compatibility audit: malformed canonical or legacy cache entries no longer prevent fallback to the next valid legacy history. Behavioral tests verify newest-valid selection, canonical-key precedence, and non-destructive migration.

## Workspace policy

All new implementation work starts from this branch. Do not add version-specific runtime artifacts. Keep the current runtime entry point canonical and version-neutral. Update version-history documents when a release is completed; do not treat this workspace initialization as a release or baseline lock.
