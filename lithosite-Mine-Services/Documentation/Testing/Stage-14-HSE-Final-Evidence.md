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

Automated regression result:
**96 passed in 2.78s**

## Reload Persistence Gate — PASS

After the HSE Closed event was committed, the official offline runtime was refreshed with browser reload.

Post-reload evidence confirmed:
- HSE remained the active screen.
- HSE Register remained at 2 records.
- The Closed event remained **Closed**.
- Persisted Closed At remained `2026-09-30T11:12`.
- The Open event remained **Open**.
- The Open event retained an empty Closed At.
- Sidebar HSE active state remained selected.
- Footer remained **OFFLINE · A.2 · Database + Runtime Ready · Map Cache Ready (Offline)**.

The reload therefore did not reset the active V26 workspace or lose persisted HSE data.

## Regression / Baseline Integrity

- V25 remains FINAL / LOCKED.
- V24 remains removed.
- V23 remains removed.
- V22 remains removed.
- No unrelated historical artifact was restored for the Stage 14 gate.

## Decision

Current status: **PASS — Stage 14 HSE acceptance gate complete.**
