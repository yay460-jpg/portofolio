# Stage 13 — Plans Final Evidence + Offline Runtime Gate

## Stage
- Workspace: V25
- Stage: 13
- Protected predecessor: V24 Stage 12
- Schema: A.2
- Runtime: Offline Desktop Host
- Default endpoint: `http://127.0.0.1:8765/`
- Database: `Database/Mine-Services-Database-A2.xlsx`

## Automated Regression
Command: `python -m pytest -q`

Final result: **90 passed in 3.05s**

The full regression suite is green after aligning legacy Stage 9–11 shell contracts with the V25 persistence-aware shell.

## Desktop Runtime Gate
Official acceptance path:

`Start-Mine-Services.bat → Desktop Host :8765 → UI → RuntimeAdapter → XLSX A.2`

VS Code Live Server is development-only and is not part of the runtime acceptance path.

The runtime was manually exercised through `http://127.0.0.1:8765/`.

## Manual Functional Evidence

### CREATE — PASS
A new Plans record was committed through **Save via RuntimeAdapter** and appeared in Plans Register.

Observed record:
- Plan ID: `PLN-MUN4O8V`
- Period: `2026-09`
- Domain: `Disposal & Stockpile`
- Activity: `Monthly disposal target`
- Target Quantity: `950`
- Unit: `ton`
- Target Hours: `7`
- Status: `Draft`

The workspace remained on Plans after mutation.

### UPDATE — PASS
An existing Plans record was updated through RuntimeAdapter. The observed target quantity changed from `1100` to `12550`. The workspace remained on Plans after mutation.

### DELETE — PASS
An existing Plans record was deleted through the runtime. After confirmation, Plans Register reported `0 records · Runtime Ready`. The workspace remained on Plans.

### Validation Rejection — PASS
A negative target quantity was submitted: `Target Quantity = -1`. Runtime validation rejected the mutation with: **Target Quantity and Target Hours must be non-negative numbers.** The invalid record was not committed.

## Navigation / Reload Gate
CREATE, UPDATE, and DELETE were executed through the official Desktop Host runtime.

Observed behavior:
- active workspace remained Plans;
- no return to Dashboard occurred after mutation;
- no Live Server reload was involved;
- no module-specific navigation workaround was required.

Shell ownership remains centralized in `ui/shared/shell-navigation-v25.js`, with workspace persistence owned by the shell through `lithosite-v25-active-screen`.

## Offline Runtime Contract
Stage 13 runtime does not require internet access, cloud services, or VS Code Live Server.

Official launcher: `Start-Mine-Services.bat`

Default local endpoint: `127.0.0.1:8765`

The port is fixed by the runtime contract; the Python process may stop/restart while the launcher recreates the same local endpoint.

## Database Protection
The original A.1 workbook remains a protected predecessor.

Active runtime workbook: `Database/Mine-Services-Database-A2.xlsx`

Local XLSX changes are expected during runtime testing and must not be restored or deleted destructively.

## PASS Decision
All Stage 13 automated and manual gates required for the Plans functional/runtime scope are **PASS**.

**Stage 13 is PASS and ready for closure/lock.**

## Evidence Set
- `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v25-STAGE13.html`
- `ui/shared/shell-navigation-v25.js`
- `ui/modules/plans/plans.js`
- `desktop-host/server.py`
- `desktop-host/start-mine-services.bat`
- `Start-Mine-Services.bat`
- `tests/test_stage13_plans.py`
- `tests/test_stage13_desktop_host.py`
- `Documentation/Contracts/Stage-13-Offline-Desktop-Runtime.md`
