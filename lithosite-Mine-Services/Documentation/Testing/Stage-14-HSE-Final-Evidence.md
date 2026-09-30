# Stage 14 — HSE Functional Evidence

## Workspace
- Workspace: V26
- Stage: 14
- Schema: A.2
- Runtime: Offline Desktop Host `127.0.0.1:8765`
- Database: `Database/Mine-Services-Database-A2.xlsx`
- Screen: `hseScreen`
- Module: `ui/modules/hse/hse.js`

## Manual Evidence Captured

The V26 HSE screen was exercised in the official offline runtime.

### CREATE — PASS
A test HSE event was created and appeared in the HSE Register:
- event date: 2026-09-30
- domain: Disposal & Stockpile
- description: HSE functional gate test - near miss observation.
- severity: Medium
- status: Open

The register showed `1 records · Runtime Ready`.

### UPDATE — PASS
The same event was updated:
- severity: High
- status: In Progress

The updated values appeared in the HSE Register and the screen remained on HSE.

### DELETE — PASS
The delete confirmation was displayed with the Runtime validation/audit message. After confirmation the HSE Register returned to:
`0 records · Runtime Ready`.

### Closed At validation — PASS
An attempt to set Status = Closed without Closed At was rejected with:
`Closed At is required when Status is Closed.`

### Closed event persistence — PASS
A Closed HSE event was committed and displayed in the register with:
- status: Closed
- closed_at automatically populated by the UI workflow
- the register displayed the persisted Closed At value

### HSE lifecycle — PASS
The V26 UI now follows the operational lifecycle:
- Open → Closed At empty/disabled
- In Progress → Closed At empty/disabled
- Closed → Closed At enabled and automatically populated when needed

Runtime validation remains authoritative for invalid payloads.
An Open/In Progress record carrying a Closed At value is rejected by the runtime with `VAL-E008`.

## Layout / Shell Gate

PASS:
- V26 shell layout preserved.
- HSE active state uses the existing sidebar.
- No shell redesign or module-specific navigation workaround was introduced.
- Offline footer remained visible with Schema A.2 and Runtime Ready state.

## Automated Gate

The Stage 14 automated test contract is defined in:
`tests/test_stage14_hse.py`

It covers:
- HSE CRUD and audit
- Work Front FK rejection
- controlled vocabulary rejection
- Closed / non-Closed Closed At validation
- V26 HSE shell/module contract

Automated execution result is **PENDING** until the test suite is executed against the current V26 checkout. The test contract was updated to the current V26 HSE module cache version and runtime adapter boundary.

## Remaining Acceptance Checks

Before declaring the HSE gate fully closed:
1. Execute the complete pytest regression suite.
2. Verify Open/In Progress with a populated Closed At is rejected through the runtime.
3. Perform a browser reload after a committed mutation and confirm HSE remains the active workspace.
4. Confirm no unrelated V25/V24/V23/V22 artifact is modified or restored.

## Decision

Current status: **MANUAL FUNCTIONAL EVIDENCE PASS / OVERALL GATE PENDING AUTOMATED REGRESSION + FINAL RELOAD CHECK.**
