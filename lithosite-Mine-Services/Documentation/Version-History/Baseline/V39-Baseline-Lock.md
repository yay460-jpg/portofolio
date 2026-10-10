# V39 Baseline Lock — Lithosite Mine Services

**Status:** LOCKED / CLOSED TO FEATURE CHANGES  
**Locked version:** V39  
**Baseline branch:** `v39-workspace`  
**Validated code snapshot:** `5da238623454bc6df3f97feb57b07b7e89c26c4e`  
**Main artifact:** `lithosite-Mine-Services/Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html`  
**Lock date:** 2026-10-10

## Final verification

The local full test suite was run after the final V39 code and cache-key changes:

```text
python -m pytest -q
434 passed in 27.15s
```

This result was reported from the project's local Windows workstation on 2026-10-10. The test result applies to the validated code snapshot above; the documentation-only commits that record this lock do not change runtime code.

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

## Baseline policy

- V39 is the current locked baseline. Do not add new feature or layout work to `v39-workspace`.
- V38 is superseded as the current baseline. Its branch, migration code, contracts, and historical notes are retained for rollback and traceability; they are not deleted as history.
- New development starts in `v40-workspace`, derived from this locked V39 state.
- Operational databases and Evidence files remain governed by their existing runtime/storage contracts; a baseline lock must not overwrite operational data.
