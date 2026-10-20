# Stage 5 — Adapter Integration Test Plan

## Scope

Verify the external UI/API adapter boundary against the locked Stage 4 RuntimeInterface.

## Test Groups

### Envelope

- missing request_id is rejected;
- missing operation is rejected;
- unsupported operation is rejected;
- operation-specific required fields are rejected before runtime execution.

### Command Routing

- CREATE reaches ApplicationService;
- UPDATE reaches ApplicationService;
- DELETE reaches ApplicationService;
- request_id is preserved;
- duplicate request behavior remains the Stage 2.6 application behavior.

### Query Routing

- READ reaches RuntimeInterface;
- READ does not mutate runtime state.

### Data Operations

- IMPORT_XLSX routes through RuntimeInterface;
- BACKUP returns the existing sealed snapshot structure;
- RESTORE routes through RuntimeInterface;
- DRY_RUN restore does not mutate runtime state.

### Boundary And Security

- adapter exposes no persistence object as public API;
- adapter does not import or call PersistenceStore directly;
- adapter errors are sanitized;
- runtime domain errors are not reclassified into new business semantics;
- schema A.1 remains unchanged.

## Acceptance Rule

Stage 5 may be baselined only when the complete local regression suite is green and the adapter tests pass without undocumented changes to Stage 2, Stage 3, or Stage 4 contracts.
