# Stage 5 — Runtime Adapter Contract

## Purpose

Stage 5 defines the external UI/API adapter boundary for Mine Services. The adapter owns transport-neutral request and response envelopes and routes to the existing RuntimeInterface.

It does not own domain rules, persistence, transaction behavior, or audit semantics.

## Boundary

    Lithosite UI / API
            |
            v
    RuntimeAdapter
            |
            v
    RuntimeInterface
            |
            +--> ApplicationService
            +--> ImportCoordinator
            +--> SnapshotManager
            |
            v
    Offline PersistenceStore

The adapter must never expose PersistenceStore, ValidationEngine, TransactionManager, or AuditRepository to callers.

## Request Envelope

Every adapter request is an object containing:

- request_id — required correlation and idempotency identifier.
- operation — CREATE, UPDATE, DELETE, READ, IMPORT_XLSX, BACKUP, or RESTORE.
- operation-specific fields.

CREATE requires entity and row.
UPDATE requires entity, entity_id, and patch.
DELETE requires entity and entity_id.
READ requires entity and optionally entity_id.
IMPORT_XLSX requires path.
BACKUP optionally accepts source, default runtime.
RESTORE requires snapshot and optionally accepts mode, default REPLACE_RUNTIME.

## Response Envelope

The adapter always returns request_id and preserves the runtime result structure. Successful runtime results retain their existing status, lifecycle, mode, or data fields.

Adapter contract failures use:

- ADP-001 — request is not an object
- ADP-002 — unsupported operation
- ADP-003 — required envelope field missing
- ADP-005 — runtime operation failed; implementation details are not exposed

Adapter errors do not replace application/import/restore error codes returned by the runtime.

## Security And Boundary Rules

1. UI/API code calls RuntimeAdapter, not persistence or repositories.
2. Adapter validation is limited to transport/envelope shape.
3. Domain validation remains in the existing ValidationEngine and application/import/restore services.
4. Mutation request IDs continue to reach ApplicationService unchanged.
5. Runtime remains offline; the adapter introduces no network dependency into the core.
6. Runtime exceptions are sanitized at the adapter boundary.
7. The adapter must not expose internal repository objects through response data.
8. Stage 2 schema A.1 and Stage 3/4 behavior remain authoritative.
9. Baseline artifacts remain outside runtime mutation.

## Stage 5 Acceptance

Stage 5 is PASS when the adapter routes the defined operations, preserves existing runtime semantics, rejects malformed envelopes before runtime execution, does not expose persistence internals, and passes the Stage 5 integration tests without modifying the A.1 data contract.
