# Stage 9 — Equipment UI Test Plan

**Status:** DRAFT / IMPLEMENTATION

## Static contract checks

`tests/test_stage9_equipment_ui.py` should verify:
- Equipment screen exists in the active desktop shell;
- RuntimeAdapter client is referenced;
- Equipment READ is routed through runtime;
- CREATE / UPDATE / DELETE are routed through runtime;
- equipment_id is retained during edit;
- no IndexedDB/localStorage persistence is introduced;
- A.1 Equipment controlled fields are represented;
- standard Loading / Empty / Runtime Error states exist.

## Functional acceptance

Before Stage 9 PASS:
1. open Equipment from the desktop shell;
2. verify Runtime Ready;
3. load Equipment from local XLSX;
4. create a valid equipment record;
5. verify persistence after refresh;
6. verify CREATE AuditLog;
7. edit the record without changing equipment_id;
8. verify UPDATE AuditLog;
9. attempt delete of an unreferenced record and verify DELETE + audit;
10. attempt delete of a referenced Equipment record and verify runtime rejection;
11. stop the host and verify Runtime Error is distinct from zero records;
12. run the full local pytest regression suite.

Stage 9 remains non-PASS until the implementation and evidence are completed.