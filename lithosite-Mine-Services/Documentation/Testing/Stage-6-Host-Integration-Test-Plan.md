# Stage 6 — Host Integration Test Plan

## Scope

Verify a concrete Lithosite host implementation against the locked Stage 5 RuntimeAdapter contract.

## Test Groups

### Request Mapping

- UI command maps to the correct Stage 5 operation;
- request_id is preserved;
- entity and entity_id are preserved;
- row and patch payloads are preserved;
- backup and restore options are preserved.

### Response Mapping

- COMMITTED is presented as success;
- VALIDATED is presented as validation success for DRY_RUN;
- REJECTED preserves runtime error codes;
- DUPLICATE_REQUEST preserves application idempotency semantics;
- sanitized adapter errors are presented without internal exception details.

### Boundary

- host does not access PersistenceStore;
- host does not access ValidationEngine;
- host does not access TransactionManager;
- host does not write AuditLog;
- host does not maintain a second authoritative Mine Services database;
- all mutations route through RuntimeAdapter.

### Offline

- core operation succeeds without network access;
- deployment-specific bridge does not require a remote service;
- runtime data remains in the approved offline persistence boundary.

### Regression

- Stage 2 contracts remain unchanged;
- Stage 3 tests remain green;
- Stage 4 tests remain green;
- Stage 5 tests remain green;
- Database A.1 remains unchanged.

## Acceptance Rule

Stage 6 may be baselined only after a concrete host runtime is selected and an end-to-end host-to-RuntimeAdapter test has passed locally. Documentation-only host definition is not sufficient for Stage 6 PASS.
