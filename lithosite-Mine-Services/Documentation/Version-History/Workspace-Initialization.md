# V40 — Workspace Initialization

**Status:** OPEN WORKSPACE — NOT LOCKED  
**Workspace branch:** `v40-workspace`  
**Source baseline:** V39 locked baseline  
**Validated V39 code snapshot:** `5da238623454bc6df3f97feb57b07b7e89c26c4e`  
**V40 artifact:** `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html`

## Lineage and lock boundary

V40 was created by branching from the V39 baseline-lock record. Its initial UI artifact is a copy of the V39 Stage 28 artifact renamed to V40 Stage 29. The original `Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html` remains in the repository as the locked V39 reference and must not be edited as part of V40 work.

As part of V40 workspace initialization, the PDF report masthead and footer use version-neutral labels rather than printing a workspace version. The V40 artifact's Report PDF cache key was refreshed; the locked V39 branch remains unchanged.

The V39 baseline was locally validated with:

```text
python -m pytest -q
434 passed in 27.15s
```

That result applies to the V39 validated snapshot. V40 full pytest has since passed in GitHub Actions:
```text
Run: 38060847406
Commit: 9a06d98e5f94b85dff085fb03900d2e241d9f161
Python: 3.13.16
python -m pytest -q
437 passed in 22.65s
```

The two regression tests that read the A3 workbook use the explicit `MINE_SERVICES_TEST_DB` override in CI. The workflow creates a deterministic temporary XLSX fixture in the runner's temporary directory because the repository-stored operational A3 workbook blob is not a valid ZIP/XLSX archive in the remote checkout. The CI fixture validates the workbook-backed regression contracts without overwriting or replacing the operational workbook. Local runtime acceptance against the developer's actual A3 database remains a separate check.

## Workspace runtime

- Desktop Host default entrypoint now targets the V40 Stage 29 artifact.
- `Start-Mine-Services.bat` delegates to the Desktop Host launcher, which also targets the V40 Stage 29 artifact.
- Schema A.3 and `Database/Mine-Services-Database-A3.xlsx` remain the canonical runtime schema/database.
- RuntimeAdapter and Desktop Host remain the only persistence boundary; no parallel browser persistence path is introduced.
- V39 baseline lock and its artifact remain available for comparison and rollback.

## V40 initial backlog

The first planned feature is **Plan vs Actual cards in Work Control**. It remains a backlog item at workspace initialization and has not been implemented by this copy/rename operation.

Initial design constraints:

- Actual production must come from `VALIDATED Operations`.
- Target quantity and Plan context must come from the applicable Target Plan records.
- Variance and achievement must use the same definitions as the Target Plan register.
- Cards should follow Work Control's period/domain/Work Front context and should not use fixed demonstration numbers as runtime data.
- Keep existing Site Map, Equipment Status, Material Movement, Recent Operations, and Issues & Alerts operational while adding the cards.

## Change rule

V40 is the active development workspace. Continue all new features and layout work on `v40-workspace`. V39 is closed and remains locked as the baseline.


## V40 release-gate snapshot — 2026-10-12

This section records the current evidence-based status. It does not convert the workspace into a locked baseline.

| Gate | Status | Evidence / remaining action |
|---|---|---|
| V39 lineage and rollback reference | **PASS / PRESERVE** | V39 remains the locked source baseline; do not edit its artifact as part of V40. |
| Reports CSS cascade cleanup | **PASS — scope closed** | Scope remains closed. No additional deletion is authorized without evidence of dead/duplicate behavior. |
| Reports selector inventory | **PASS for documented scope** | Repeated selectors have explicit KEEP/REVIEW decisions where no deletion is justified. No further CSS deletion is authorized without proof of dead/duplicate behavior. |
| Equipment Performance layout protection | **KEEP / REGRESSION GUARD** | Preserve the fixed 10-column fit and no-horizontal-scroll behavior. Do not modify responsive or state rules without evidence of a regression. |
| Plan vs Actual dialog in Work Control | **PRESENT — BUSINESS SEMANTICS HOLD** | Initial dialog and summary remain as a provisional reference only. Per the global decision reminder in `Documentation/README.md`, pause authoritative date/shift behavior, category-wide formulas, and full Target Plan/Dashboard integration until owner direction. Do not treat displayed sample metrics as an approved universal formula. |
| Runtime acceptance using the operational A.3 workbook | **OPEN / NOT EVIDENCED HERE** | CI uses an isolated temporary workbook fixture. Passing CI does not establish runtime acceptance against the developer's actual operational A.3 database. |
| Overall V40 release and baseline lock | **OPEN** | Complete or explicitly defer the remaining product/runtime gates, update version/test evidence on the final commit, then require Full Pytest PASS on that exact release HEAD. |

### Next controlled action

Continue the release-gate audit outside the completed Reports CSS cleanup. Keep the initial Plan vs Actual dialog available, but follow the global HOLD decision documented in `Documentation/README.md`; do not implement or validate universal date/shift comparison semantics until the owner defines the business model. Runtime acceptance against the operational A.3 workbook remains a separate gate and must not be inferred from CI's isolated workbook fixture.

**Current decision:** Reports CSS cascade cleanup is validated and closed; V40 remains an open development workspace. No baseline lock is declared by this snapshot.


## V40 Plan vs Actual initial implementation — 2026-10-12

The initial dashboard integration is now present on `v40-workspace`:

- Added an isolated **Plan vs Actual** dialog launched from the Work Control header. Existing dashboard grid geometry and the five KPI strip remain unchanged.
- Target Plan is loaded through RuntimeAdapter in a separate error boundary; a Plans read failure does not prevent existing dashboard data from rendering.
- Actuals use only `VALIDATED` Operations and match by plan date range, domain, activity, measurement, and optional Work Front.
- Ambiguous matches are excluded to avoid double counting; measurement units are displayed separately.
- Today comparison uses only Target Plans fully contained in today; multi-day targets are not prorated. Shift-level comparison is explicitly unavailable because Target Plan records do not define shift allocation.
- Added focused regression guards in `tests/test_v40_dashboard_plan_actual.py`.

**Validation status:** Full Pytest #448 passed on exact code HEAD `95889a64bc499c8184b1a61a7eb8787a82be809d`; the local full suite was reported as 573 passed on the same code state before this documentation reconciliation. User-provided screenshots show the dashboard and initial dialog rendering. The business semantics remain on HOLD, and operational A.3 workbook acceptance is not inferred from these screenshots or CI. This is not a V40 release lock.


## Documentation reconciliation — 2026-10-13

The global Target vs Actual decision reminder in `Documentation/README.md` is authoritative and version-neutral. V40 keeps the existing dialog as an initial reference; date/shift semantics, material-category formulas, annual RKAB-to-monthly allocation, and full Target Plan/Dashboard integration remain on HOLD pending owner direction. Do not use this V40 workspace record to convert those unresolved business decisions into release requirements.


## Desktop Runtime acceptance procedure

The local operational workbook acceptance procedure is maintained in [V40 Desktop Runtime Acceptance — Operational A3](../Testing/Desktop-Runtime-A3-Acceptance.md). This gate remains **OPEN / NOT EVIDENCED** until Gates A–C have recorded local evidence. CI uses a temporary fixture and does not establish the state of the operational workbook. No workbook reset, replacement, or mutation is authorized by this checklist; write testing requires a verified backup and explicit approval.
