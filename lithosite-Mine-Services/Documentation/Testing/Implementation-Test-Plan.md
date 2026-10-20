# Stage 3 Implementation Test Plan

## Objective

Verify that the runtime implementation conforms to the locked Stage 2 contracts.

## Test Sequence

### 1. Validation Engine
- Schema A.1 accepted.
- Required-field failures rejected.
- Type failures rejected.
- Duplicate primary keys rejected.
- Missing foreign keys rejected.
- Controlled-vocabulary failures rejected.
- Conditional business rules enforced.
- System-generated fields protected.

### 2. Persistence
- Valid CREATE commits.
- Invalid CREATE does not mutate state.
- UPDATE preserves immutable primary keys.
- DELETE enforces reference rules.
- Transaction failure rolls back completely.
- Read operations do not mutate state.
- Valid runtime state persists to an offline XLSX store.
- Workbook schema, required sheets, and headers are checked before load/save.
- Locked baseline sheet remains outside runtime mutation.

### 3. Audit
- Successful mutation creates an audit event.
- Failed mutation does not create a successful mutation audit.
- Audit records are append-only.
- Application mutations enter the AuditRepository boundary.

### 4. Import
- Valid workbook imports atomically.
- Any validation error rejects the complete import.
- Mixed valid/invalid data produces zero committed rows.
- Successful import produces an audit event.
- Parent/child rows may resolve foreign keys within the same staged dataset.
- Import error categories map to the Stage 2 error contract.

### 5. Backup and Restore
- Snapshot checksum is verified before commit.
- Entity counts are verified against snapshot payload.
- Invalid snapshot is rejected without mutation.
- Restore is atomic.
- DRY_RUN never mutates runtime state.
- Successful restore creates an audit event.
- MERGE_RUNTIME rejects primary-key collisions rather than silently overwriting runtime rows.

### 6. Application Service
- UI/API runtime mutations use Application Service as the mutation boundary.
- Repository/persistence mutation is not part of the public application path.
- Duplicate request IDs are idempotent.
- Missing request IDs are rejected.
- CRUD errors are returned through the defined application error model.
- Missing entities and existing references return defined application errors.

## Acceptance Rule

Stage 3 is PASS only when implementation tests demonstrate conformance to the Stage 2 contracts without undocumented contract changes.

A local regression result is a runtime verification artifact. GitHub CI status, when available, is tracked separately and must not be implied by local pytest output.
