# V38 Closure Lock — Mine Services

## Status
**V38 documentation closure — PASS**

This document records the current V38 runtime boundary after the schema, terminology, shared-shell, legacy cleanup, and regression work.

## Canonical Runtime
- Workspace: **V38**
- Schema: **A.3**
- Canonical database: `Database/Mine-Services-Database-A3.xlsx`
- Desktop Host: **authoritative local runtime**
- Endpoint: `http://127.0.0.1:8765/`
- Live Server: development-only

A.3 is the single active runtime schema. A.1/A.2 are historical predecessors and are not active runtime sources.

## Shared Ownership
- Navigation: `ui/shared/shell-navigation.js`
- Modal lifecycle: `ui/shared/modal-show-contract.js`
- Modal shell: `ui/shared/modal-shell-contract.css`
- Navigation guard: `ui/shared/navigation-guard-contract.js`
- Runtime status/accessory behavior: shared runtime/modal contract

The former V31 navigation owner is retired. No parallel V31 navigation owner is part of V38.

## Domain / Schema Closure
- MapMarker: **A.3 active; Phase B complete**
- Checker: **V38 active**
- Global Capacity: **V38 active**
- Measurement terminology: **canonical**
- Controlled vocabulary: **locked**
- Desktop Host: **A.3 only**
- Operation form layout: **locked**
- Application shell boundary: **locked**

## Migration / Legacy Closure
The A2-to-A3 migration contract remains available as a historical migration boundary. Its A2 definitions must not be interpreted as an active runtime schema.

Historical stage records that document A.1/A.2 are intentionally preserved as historical evidence and are not rewritten merely to remove historical terminology.

The following active-runtime residue has been audited as closed:
- `schema_a3`
- V31 navigation owner
- `lithosite-v31-active-screen`
- active A2 database paths
- `capacity_unit` in canonical runtime fields
- obsolete module-level runtime/modal owners

Future Android Host references remain outside the current V38 desktop acceptance boundary and are **HOLD**.

## Regression Evidence
Current regression baseline:

**309 passed, 0 failed**

The suite includes the migrated MapMarker, Stage 3, Stage 36, Stage 8, A2-to-A3 migration, persistence, Desktop Host, Checker, Global Capacity, and related V38 coverage.

## Runtime Acceptance
The local Desktop Host was started successfully against the A3 database after the production `_Lists` workbook was synchronized with the required V38 controlled lists:
- `capacity_status`: Active, Inactive
- `checker_shift`: Day, Night
- `checker_material`: Ore, OB, Quarry

A local pre-change database backup was created as:

`Mine-Services-Database-A3.pre-v38-lists-backup.xlsx`

This backup is a local working artifact and should be retained until the V38 closure is accepted locally.

## Explicit HOLD Boundaries
- Android Member implementation
- Selective Animation
- Security / Attacker Simulation
- Final Release

No new feature boundary should be opened until the V38 closure state is formally accepted.

## Closure Rule
V38 is considered structurally closed when:
1. A.3 remains the single active schema.
2. Desktop Host uses the canonical A3 database.
3. Shared shell/navigation ownership remains single-owner.
4. Legacy active-runtime residue remains zero.
5. Historical A2 migration/evidence remains preserved.
6. Regression remains green.
7. Runtime bootstrap remains successful.
