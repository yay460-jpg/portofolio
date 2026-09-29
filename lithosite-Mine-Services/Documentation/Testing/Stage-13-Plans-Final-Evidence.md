# Stage 13 — Plans Final Evidence

## Scope
Stage 13 introduces the **Plans** module in the V25 Desktop Master workspace.

- Active workspace: `V25 Stage 13`
- Protected predecessor: `V24 Stage 12`
- Schema: `A.2`
- Database architecture: offline-first XLSX through RuntimeAdapter
- Shell layout: inherited from V24 and preserved

## Plans Contract
Authoritative schema:

`plan_id, period, domain, work_front_id, activity, target_quantity, unit, target_hours, status`

Runtime controls include:

- Primary key: `plan_id`
- Foreign key: `work_front_id -> WorkFront.work_front_id` (optional)
- Controlled values: `domain`, `unit`, `status`
- Period validation: `YYYY-MM`
- Numeric validation: `target_quantity`, `target_hours`

## V25 Integration
Plans is integrated into the Desktop Master shell:

`Dashboard → Operations → Equipment → Work Front → Maintenance → Issues → Plans → HSE → Reports`

The shell and internal workspace layout remain aligned with the V24 baseline.

Files:

- `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v25-STAGE13.html`
- `ui/shared/shell-navigation-v25.js`
- `ui/modules/plans/plans.js`
- `tests/test_stage13_plans.py`

## Runtime Path

`Plans UI → V25 Shell Navigation → plans.js → RuntimeAdapter → Validation → Transaction → XLSX Persistence → AuditLog`

## Functional Gate
The Plans module implements:

- READ
- CREATE
- UPDATE
- DELETE
- filter by Plan ID / Period / Domain / Work Front / Status
- Runtime-authoritative validation
- audit-backed mutation flow

## Test Coverage
Stage 13 adds backend and shell-contract coverage for:

- Plans CRUD
- audit sequence
- Work Front FK rejection
- controlled-value rejection
- invalid period rejection
- negative numeric rejection
- V25 Plans shell/module contract

## Final State
This evidence document records the Stage 13 implementation state. Final PASS/LOCK is issued only after the local regression suite and manual UI gate are executed against V25.
