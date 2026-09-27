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

### 3. Audit
- Successful mutation creates an audit event.
- Failed mutation does not create a successful mutation audit.
- Audit records are append-only.

### 4. Import
- Valid workbook imports atomically.
- Any validation error rejects the complete import.
- Mixed valid/invalid data produces zero committed rows.
- Successful import produces an audit event.

### 5. Backup and Restore
- Snapshot checksum is verified before commit.
- Invalid snapshot is rejected without mutation.
- Restore is atomic.
- DRY_RUN never mutates runtime state.
- Successful restore creates an audit event.

### 6. Application Service
- UI/API cannot bypass application services.
- Duplicate request IDs are idempotent.
- CRUD errors are returned through the defined application error model.

## Acceptance Rule

Stage 3 is PASS only when implementation tests demonstrate conformance to the Stage 2 contracts without undocumented contract changes.
