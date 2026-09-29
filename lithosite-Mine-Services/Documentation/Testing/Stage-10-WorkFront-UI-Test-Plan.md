# Stage 10 — Work Front UI Test Plan

**Status:** DRAFT / CONTRACTED

## Static contract checks

Target test file:

tests/test_stage10_workfront_ui.py

Checks:
- Work Front screen exists in the active desktop shell;
- RuntimeAdapter client is referenced;
- WorkFront READ is routed through runtime;
- CREATE / UPDATE / DELETE are routed through runtime;
- work_front_id is retained during edit;
- A.1 Work Front fields are represented;
- service_domain and work_front_status are runtime-controlled;
- no IndexedDB/localStorage persistence is introduced;
- runtime reference-protection behavior is surfaced;
- Runtime Error is distinct from an empty dataset;
- established shell navigation remains intact.

## Runtime acceptance

The Stage 10 runtime cycle must verify:
1. create a valid WorkFront record;
2. update it without changing work_front_id;
3. verify CREATE and UPDATE audit events;
4. delete an unreferenced record and verify DELETE + audit;
5. attempt deletion of a referenced WorkFront record and verify runtime rejection;
6. verify invalid controlled vocabulary is rejected;
7. verify authoritative _Lists values are exposed by RuntimeInterface;
8. verify persistence survives XLSX reload;
9. run the complete pytest regression suite.

## Baseline protection

Stage 8 Operations and Stage 9 Equipment must remain green throughout Stage 10.

## PASS gate

Stage 10 becomes PASS / BASELINED only after:
- implementation is complete;
- automated UI/runtime tests pass;
- full regression is green;
- final evidence is recorded.

