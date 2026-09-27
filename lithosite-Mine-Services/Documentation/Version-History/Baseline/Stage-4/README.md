# Stage 4 Baseline

## Status

**Stage 4 Integration — PASS**

## Verification

- Full local regression suite: **34 passed, 0 failed**
- Stage 3 regression remained green.
- Stage 4 runtime interface tests passed.
- Shared AuditRepository boundary passed.
- Runtime mutations remained behind ApplicationService.
- Import and restore remained atomic and validated before mutation.
- No Stage 2 schema or business-rule changes were introduced.

## Runtime Boundary

The public integration boundary is:

`RuntimeInterface`

The runtime interface exposes:

- CREATE
- UPDATE
- DELETE
- READ
- XLSX import
- backup
- restore

PersistenceStore, ValidationEngine, TransactionManager, and AuditRepository remain internal runtime boundaries.

## Audit Boundary

ApplicationService, ImportCoordinator, and SnapshotManager use the same AuditRepository instance supplied by RuntimeInterface.

Audit writes therefore follow the common boundary:

`Runtime service → AuditRepository → PersistenceStore`

## Locked Constraints

- Schema version: A.1
- Database mode: OFFLINE
- Phase A database baseline: LOCKED
- Stage 2 contracts remain authoritative.
- Stage 3 implementation remains authoritative.
- Runtime mutations require request IDs.
- Duplicate request IDs remain idempotent.
- Validation occurs before mutation.
- Mutations are atomic.
- Baseline artifacts remain outside runtime mutation.
- No direct UI/API persistence access.
- No undocumented business-rule changes.

## Audit Result

Stage 4 conformance audit: **PASS**

## Baseline Decision

Stage 4 is now **BASELINED**.

The next development boundary is the actual Lithosite UI/API adapter integration. The runtime core should not be expanded without a corresponding interface contract.
