# Stage 6 — Host Integration Test Plan

## Scope

Verify a concrete Lithosite Android host implementation against the locked Stage 5 RuntimeAdapter contract.

The repository currently has no native Android Gradle/Kotlin application host. Therefore the tests below define the required implementation gate; they do not claim execution.

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

### Android Runtime Invocation

- Android host can initialize the embedded Python runtime;
- Android host can import the Mine Services package;
- Android host can invoke RuntimeAdapter;
- Python exception paths are converted into the host error contract;
- request_id survives the Kotlin/Java → Python → RuntimeAdapter → response path;
- repeated request_id does not execute a mutation twice.

### Persistence Boundary

- Mine Services runtime data is stored only in the approved offline persistence boundary;
- Android host cannot bypass RuntimeAdapter to mutate persistence;
- Android host does not create a parallel authoritative Mine Services database;
- backup and restore use SnapshotManager through RuntimeAdapter;
- baseline workbook is not modified by runtime operations.

### Security Boundary

- Python runtime is loaded only from the packaged application/runtime path;
- imported files are validated through the existing import contract;
- runtime file paths cannot be supplied by UI as arbitrary persistence targets;
- host errors do not expose Python tracebacks or filesystem internals;
- no network dependency is required for core Mine Services operations.

### Offline

- CREATE, UPDATE, DELETE, READ work with network disabled;
- IMPORT_XLSX works with network disabled;
- BACKUP and DRY_RUN RESTORE work with network disabled;
- full RESTORE works with network disabled;
- no Google Apps Script or remote API is required.

### Regression

- Stage 2 contracts remain unchanged;
- Stage 3 tests remain green;
- Stage 4 tests remain green;
- Stage 5 tests remain green;
- Database A.1 remains unchanged.

## Acceptance Rule

Stage 6 may be baselined only after:

1. a concrete Android host project exists;
2. the embedded Python runtime initializes successfully;
3. the real RuntimeAdapter is invoked from the Android host;
4. the end-to-end host-to-RuntimeAdapter test passes locally;
5. offline behavior is verified;
6. security boundary tests pass;
7. the complete Python regression suite remains green.

Documentation-only host definition is not sufficient for Stage 6 PASS.
