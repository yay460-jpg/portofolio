# Stage 6 — Lithosite Host Integration Contract

## Purpose

Stage 6 defines how a Lithosite host application may invoke the locked Mine Services RuntimeAdapter. The host boundary is separate from the Mine Services domain runtime and must not duplicate persistence or domain validation.

## Boundary

    Lithosite Host UI
            |
            v
    Host Integration Bridge
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

RuntimeAdapter remains the authoritative application-facing boundary defined by Stage 5.

## Host Responsibilities

The host may own screen/navigation state, user interaction, presentation state, deployment-specific process or IPC invocation, request mapping, and localization.

The host must not own Mine Services domain validation, primary-key or foreign-key enforcement, transaction semantics, audit generation, snapshot checksum verification, XLSX import commit logic, or runtime database mutation outside RuntimeAdapter.

## Invocation Contract

The host sends the Stage 5 request envelope to RuntimeAdapter unchanged. It must preserve request_id, operation, entity identifiers, row or patch payloads, snapshot data, restore mode, and runtime result semantics.

Presentation metadata may exist outside the runtime request but must not alter domain fields.

## Offline Rule

The Mine Services runtime remains offline. A host may use an IPC, embedded-runtime, local-process, or other deployment-specific bridge. The chosen bridge must not require a network service for the core offline runtime.

The bridge implementation is deployment-specific and is not yet locked by this contract.

## Security Boundary

1. UI code never accesses PersistenceStore directly.
2. UI code never accesses ValidationEngine directly.
3. UI code never accesses TransactionManager directly.
4. UI code never writes AuditLog directly.
5. Host-side presentation must not expose unsanitized runtime internals.
6. Mutations must route through RuntimeAdapter.
7. Mutation request IDs must be preserved.
8. The host must not maintain a second authoritative Mine Services database.

## Acceptance Boundary

Stage 6 is not PASS merely because a UI can display Mine Services data. A concrete host runtime must exist before host-to-runtime execution can be declared integrated.

Until that runtime exists, this document is the authoritative integration contract. No browser-side persistence implementation should be introduced merely to simulate the Python runtime.

## Locked Constraints

- schema A.1 remains authoritative;
- Phase A remains LOCKED;
- RuntimeAdapter remains the Stage 5 boundary;
- Mine Services remains offline;
- no duplicate domain persistence in UI;
- no direct repository access from UI;
- no undocumented business-rule changes.
