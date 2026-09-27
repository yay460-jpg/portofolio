# Mine Services Runtime Architecture

## Purpose

This document defines the implementation boundary for Mine Services after the Stage 2 contracts.

## Implementation Order

1. Validation Engine
2. Offline Persistence
3. Transaction Manager
4. Audit Repository
5. Import Coordinator
6. Backup and Restore
7. Application Service CRUD
8. Integration tests

## Layer Boundary

UI/API
→ Application Service
→ Validation Engine
→ Transaction Manager
→ Repository / Persistence Store
→ Audit Repository

Import and Restore adapters enter through the Application/Transaction boundary and must not write directly to persistence.

## Contract Sources

The active Stage 2 contracts are stored under Documentation/Contracts/Stage-2/.

## Locked Constraints

- Database schema remains A.1 unless a controlled schema change is approved.
- Runtime operates offline.
- Mutations are validated before commit.
- Mutations are atomic.
- Primary keys are immutable.
- Foreign keys are enforced at application level.
- Audit is written after successful mutation.
- Baseline artifacts are outside runtime mutation.
- Restore failure must leave runtime state unchanged.

## Stage 3 Boundary

Stage 3 implements the contracts. It must not silently redefine the Stage 2 data model or business rules.

Any required contract change must be documented and audited before implementation proceeds.
