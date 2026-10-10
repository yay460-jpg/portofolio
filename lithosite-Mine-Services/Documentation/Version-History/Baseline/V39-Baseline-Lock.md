# V39 Baseline Lock — Lithosite Mine Services

**Status:** LOCKED / CLOSED TO FEATURE CHANGES  
**Locked version:** V39  
**Baseline branch:** `main` (released baseline; reference branch: `v39-baseline-release`)  
**Validated code snapshot:** `5da238623454bc6df3f97feb57b07b7e89c26c4e`  
**Main artifact at release:** `Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html`  
**Lock date:** 2026-10-10

## Final verification

The local full test suite was run after the final V39 code and cache-key changes:

```text
python -m pytest -q
434 passed in 27.15s
```

This result was reported from the project's local Windows workstation on 2026-10-10. The test result applies to the validated code snapshot above; documentation-only commits that record this lock do not change runtime code.

## Locked scope

V39 is the accepted baseline for the following completed areas:

- Shared Evidence viewer and storage contract for Target Plan, HSE, and per-event Maintenance, including record-scoped upload and preview.
- Green Evidence buttons only when at least one supported file is confirmed for the exact record.
- Dedicated HSE Evidence column with a View button and aligned register layout.
- Target Plan register layout consistency, including normal-weight DRAFT badge typography.
- Work Front Show on Map button styling based on a linked active Marker Location with valid coordinates.
- Site Map navigation to the exact Work Front marker, with a short, softened green blink on its label.
- Asset cache-key, regression-test, and Version History updates for the completed changes.

## Explicitly deferred

The **Plan vs Actual cards in Work Control** remain a future V40 work item. The V39 baseline does not contain that new card implementation.

## Version history and retirement policy

- V39 is the current locked baseline. Do not add new feature or layout work to the retired `v39-workspace` branch.
- V38 (Stage 27) is superseded by V39. Its active HTML artifact and development branch are being retired; the historical record remains in this Version History documentation. V38 is not the current baseline and must not be used for new development.
- New development continues in `v40-workspace`, based on the locked V39 state.
- The V39 release reference is `v39-baseline-release`; the baseline code is also present in `main`.
- Operational databases and Evidence files remain governed by their existing runtime/storage contracts; baseline documentation or artifact cleanup must not overwrite operational data.
