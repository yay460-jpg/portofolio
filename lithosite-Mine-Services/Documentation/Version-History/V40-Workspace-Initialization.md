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
