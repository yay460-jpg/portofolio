# Stage 8 — Operations UI Test Plan

**Status:** DRAFT / IMPLEMENTATION

## Static UI contract checks

`tests/test_stage8_operations_ui.py`

Checks:

- RuntimeAdapter host endpoint is referenced;
- Operations, WorkFront, and Equipment are read through runtime;
- CREATE / UPDATE / DELETE are routed through runtime;
- activity/source/date/status filters exist;
- edit/delete actions exist;
- runtime connection state exists;
- no IndexedDB/localStorage persistence is introduced;
- A.1 lifecycle status values are used.

## Desktop host checks

`tests/test_desktop_host.py`

Checks:

- local health endpoint returns READY and Schema A.1;
- runtime endpoint routes requests to RuntimeAdapter;
- disallowed browser origin is rejected.

## Functional acceptance still required

Before Stage 8 PASS, run the full local pytest suite and manually exercise the UI through Live Server with the desktop host:

1. start `desktop-host/server.py`;
2. open Operations v1 through Live Server;
3. verify Runtime Ready;
4. verify records load from the local XLSX;
5. create a valid operation;
6. verify the row persists after refresh;
7. verify AuditLog receives the CREATE;
8. edit the operation and verify UPDATE + audit;
9. delete the operation and verify DELETE + audit;
10. submit invalid references/numeric values and verify runtime rejection;
11. stop the host and verify Runtime Error is distinct from zero records.

Stage 8 must remain non-PASS until these runtime and regression checks are completed.
