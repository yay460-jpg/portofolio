# Stage 4 — Integration and Runtime Interface

## Purpose

Stage 4 defines the integration boundary between Lithosite UI/API adapters and the validated Mine Services runtime.

The runtime interface is an adapter boundary. It does not replace the locked Stage 2 contracts or the Stage 3 implementation layers.

## Runtime Boundary

```
Lithosite UI / API Adapter
        |
        v
RuntimeInterface
        |
        +--> ApplicationService
        |      |
        |      +--> ValidationEngine
        |      +--> TransactionManager
        |      +--> AuditRepository
        |
        +--> ImportCoordinator ---------> AuditRepository
        |
        +--> SnapshotManager ------------> AuditRepository
        |
        v
Offline PersistenceStore
```

UI/API integration must use `RuntimeInterface`. PersistenceStore, ValidationEngine, TransactionManager, and AuditRepository remain internal implementation boundaries. Application mutations, import, and restore all use the same `AuditRepository` instance for the runtime store.

## Supported Operations

### Commands

- `create(entity, row, request_id)`
- `update(entity, entity_id, patch, request_id)`
- `delete(entity, entity_id, request_id)`

All mutation commands inherit the Stage 2.6 application contract.

### Queries

- `read(entity, entity_id=None)`

Read operations do not mutate runtime state.

### Data Operations

- `import_xlsx(path)`
- `backup(source)`
- `restore(snapshot, mode)`

Import and restore continue to use their existing atomic validation boundaries.

## Locked Integration Rules

1. UI/API code must not write directly to PersistenceStore.
2. UI/API code must not bypass ValidationEngine through a repository call.
3. Mutation requests require a request ID.
4. Duplicate request IDs remain idempotent.
5. Runtime remains offline.
6. Stage 2 schema A.1 remains authoritative.
7. Stage 3 validation, transaction, persistence, and audit behavior remains authoritative.
8. Import and restore cannot bypass validation before mutation.
9. Baseline artifacts remain outside runtime mutation.
10. Integration adapters must not redefine domain business rules.
11. Application mutations, import, and restore must route audit writes through the shared `AuditRepository` boundary.

## Error Handling

The integration layer returns the existing application/import/restore result structures. It does not translate errors into undocumented business semantics.

## Stage 4 Acceptance

Stage 4 is PASS when:

- the integration boundary is executable;
- commands and queries reach the correct Stage 3 services;
- persistence internals are not exposed as the public runtime interface;
- existing validation, transaction, audit, import, and restore contracts remain intact;
- integration tests pass without modifying the locked Stage 2 data contract.

## Next Boundary

After Stage 4 acceptance, the next work should be the actual Lithosite UI/API adapter integration rather than expanding the runtime core without a defined interface contract.
