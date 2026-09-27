# Stage 4 Integration Test Plan

## Objective

Verify that Lithosite integration adapters have a single runtime boundary and that Stage 3 contracts remain enforced through that boundary.

## Test Areas

### Runtime Interface
- CREATE reaches ApplicationService.
- UPDATE reaches ApplicationService.
- DELETE reaches ApplicationService.
- READ remains non-mutating.
- Import enters through ImportCoordinator.
- Backup and restore enter through SnapshotManager.

### Boundary Protection
- RuntimeInterface does not expose PersistenceStore.
- RuntimeInterface does not expose ValidationEngine.
- RuntimeInterface does not expose AuditRepository.
- ApplicationService, ImportCoordinator, and SnapshotManager share the same AuditRepository boundary.
- Mutations still require request IDs.
- Duplicate request IDs remain idempotent.

### Regression
- All Stage 3 tests remain green.
- No Stage 2 schema or business-rule changes are introduced.

## Acceptance

Stage 4 integration is PASS only when the runtime interface tests and the complete Stage 3 regression suite pass together.
