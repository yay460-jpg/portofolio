# Stage 9 — Equipment UI Test Plan

**Status:** PASS / BASELINED

## Static contract checks

`tests/test_stage9_equipment_ui.py`

Checks:
- Equipment screen exists in the active desktop shell;
- RuntimeAdapter client is referenced;
- Equipment READ is routed through runtime;
- CREATE / UPDATE / DELETE are routed through runtime;
- Equipment fields are represented;
- no IndexedDB/localStorage persistence is introduced;
- A.1 Equipment controlled fields are represented;
- standard Runtime Error handling is present;
- Equipment navigation is protected by the V21 shell contract.

**Result:** 8/8 tests passed.

## Runtime acceptance evidence

The Stage 9 runtime regression covers:
- Equipment CREATE / UPDATE / DELETE;
- Equipment validation and controlled-vocabulary rejection;
- Equipment audit creation and AuditLog readback;
- authoritative controlled lists through `RuntimeInterface.read("_Lists")`;
- atomic import rejection;
- snapshot integrity protection.

The complete local regression suite was executed after Stage 9 implementation.

**Regression result:** 58 passed in 2.34s.

## Stage 9 PASS record

Stage 9 is baselined after the implementation and regression cycle. The Equipment UI uses the canonical RuntimeAdapter boundary, the Equipment entity contract is represented, controlled lists remain runtime-authoritative, browser-side database persistence is prohibited, and the Stage 8 baseline remains green.

Evidence record:
`Documentation/Testing/Stage-9-Equipment-Final-Evidence.md`

## Functional acceptance

The implementation contract requires the Equipment screen to be exercised through the desktop host for final operational verification, including:
1. open Equipment from the desktop shell;
2. verify Runtime Ready;
3. load Equipment from local XLSX;
4. create a valid equipment record;
5. verify persistence after refresh;
6. verify CREATE AuditLog;
7. edit the record without changing equipment_id;
8. verify UPDATE AuditLog;
9. delete an unreferenced record and verify DELETE + audit;
10. attempt delete of a referenced Equipment record and verify runtime rejection;
11. stop the host and verify Runtime Error is distinct from zero records.

These are operational checks beyond the automated static/runtime regression record and should be repeated when a fresh desktop-host acceptance session is performed.

