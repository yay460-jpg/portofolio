# Stage 16 — Reports Contract

## Status
ACTIVE

## Workspace
V28

## Baseline
V27 FINAL / LOCKED

## Schema
A.2

## Scope
Reports

## Objective
Provide an offline-first Reports module in the Lithosite Mine Services Desktop Master for operational reporting from the existing runtime data.

## Functional Scope
- Report Overview
- Operational Summary
- Equipment Summary
- Work Front Summary
- Maintenance Summary
- Issues Summary
- Plans Summary
- HSE Summary
- Report filtering by supported operational dimensions
- Report refresh from RuntimeAdapter
- Read-only report presentation
- Print/export preparation only where supported by the existing runtime contract

## Runtime Contract
V28 Desktop Master → RuntimeAdapter → Validation / Read → XLSX A.2 → AuditLog where applicable.

Reports must consume existing persisted data through RuntimeAdapter and must not bypass the runtime/database layer.

## Constraints
- V27 remains FINAL / LOCKED and must not be modified.
- Schema A.2 remains unchanged.
- Offline-first operation remains mandatory.
- Reports are read-only; no direct domain mutation from Reports.
- No new database tables or schema changes for Stage 16 unless separately contracted.
- Existing domain CRUD and Stage 15 Data Management behavior must remain intact.
- Desktop-first layout remains the master UI.

## Acceptance Gate
Stage 16 requires:
1. Contract recorded.
2. Reports UI implementation evidence.
3. Runtime/read-path evidence.
4. Filter and aggregation verification.
5. Regression evidence.
6. Persistence/read integrity verification.
7. Final PASS evidence.

## Entry Rule
Implementation may begin only after this contract is recorded.

## Final Decision
- Decision: PASS

## Final Rule
All Stage 16 Reports work must be implemented in V28. V27 must remain untouched.

