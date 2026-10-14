# Stage 9 — Equipment Screen Contract

**Status:** PASS / BASELINED  
**Module:** Lithosite | Mine Services  
**Desktop Master:** V22 latest stable desktop shell  
**Database Contract:** Schema A.1  
**Runtime Boundary:** RuntimeAdapter  
**Persistence:** Local XLSX / offline-first

## 1. Purpose

Stage 9 implements the Equipment master-data screen as the second functional desktop screen after Operations.

Stage 9 must reuse the Stage 8 runtime, validation, transaction, persistence, and audit boundaries. It must not create a parallel database or alter the consolidated V22 stable baseline.

## 2. A.1 Equipment Contract

Equipment fields are fixed to:

`equipment_id, category, type, owner_type, owner_name, status, effective_from, effective_to`

Primary key: `equipment_id`.

Controlled fields:
- `category` → `equipment_category`
- `type` → `equipment_type`
- `owner_type` → `owner_type`
- `status` → `equipment_status`

Required field: `equipment_id`.

## 3. Screen Responsibility

The Equipment screen is responsible for:
- viewing equipment master records;
- filtering equipment records;
- creating equipment records;
- editing equipment records through RuntimeAdapter;
- deleting equipment records through RuntimeAdapter when reference rules permit;
- surfacing validation and runtime outcomes;
- operating fully offline.

It is not responsible for:
- changing Schema A.1;
- direct XLSX mutation;
- browser-side business persistence;
- direct AuditLog writes;
- bypassing RuntimeAdapter;
- changing Operations transaction semantics.

## 4. Runtime Contract

Reads:
`Equipment UI → RuntimeAdapter → ApplicationService → Persistence`

Mutations:
`Equipment UI → RuntimeAdapter → ApplicationService → Validation → Transaction → Persistence / Audit`

All CRUD must use the canonical `Equipment` entity and `equipment_id` primary key.

## 5. UI States

The screen must distinguish:
- Loading
- Ready with records
- Ready with zero records
- Validation Error
- Runtime Error
- Offline Ready

Runtime failure must never be rendered as an empty equipment dataset.

## 6. CRUD Acceptance

### CREATE
Create a valid Equipment row through RuntimeAdapter and verify persistence plus CREATE audit.

### UPDATE
Update an existing Equipment row without changing `equipment_id`. Verify persistence plus UPDATE audit.

### DELETE
Require explicit confirmation. Runtime must enforce reference protection. A failed delete must leave the record intact.

## 7. Reference Integrity

Equipment is a parent entity for at least Operations and Maintenance references in Schema A.1.

Therefore delete behavior must respect existing FK rules. The UI must display the runtime rejection rather than attempting a client-side workaround.

## 8. Offline / Security Rules

- No IndexedDB/localStorage business database.
- No direct XLSX writes from the browser.
- No cloud or external REST dependency for normal CRUD.
- RuntimeAdapter remains authoritative.
- Audit remains runtime-controlled.

## 9. Performance

- Filter operations must not mutate data.
- Reference/list data should be read through runtime.
- Do not reload the complete application shell for filtering.
- Refresh the affected Equipment view after successful mutation.

## 10. Stage 9 Acceptance Gate

Stage 9 can become PASS only when:
- Equipment is reachable from the locked desktop shell;
- A.1 Equipment fields are represented correctly;
- controlled vocabularies come from the runtime/schema contract;
- CREATE / UPDATE / DELETE route through RuntimeAdapter;
- validation errors are surfaced correctly;
- protected deletes are rejected correctly;
- successful mutations create AuditLog entries;
- persistence survives refresh/reload;
- offline operation works;
- Stage 8 baseline remains intact;
- regression tests are green.

**Next implementation step:** build the Equipment screen against this contract, then add Stage 9 test evidence before baseline.
## 11. Unit Database — Canonical Equipment Master

The Equipment toolbar exposes **Unit List** between **Refresh** and **Global Capacity**. The modal is the compact master-data workspace for the unit records already stored in the canonical A.3 `Equipment` entity. It is not a second persistence layer.

Columns:
- Date Record — `effective_from` (existing effective date; do not invent a creation timestamp).
- Unique ID — `equipment_id` (immutable primary key).
- Type — `type`.
- Brand — resolved from `GlobalCapacity.unit_brand` through `capacity_profile_id`.
- Category — `category`.
- Status — `status`.
- Action — `Edit` and `Delete`, both through RuntimeAdapter and existing reference-protection rules.

### Add Unit workflow

The modal must provide an **Add Unit** button. It opens the existing Equipment form in Unit mode, validates required fields and creates the row using `CREATE Equipment` through RuntimeAdapter. Editing an existing unit opens the same form using `UPDATE Equipment`; the `equipment_id` primary key remains immutable while `unit_no` can be corrected. After save or cancel, the user returns to the Unit Database list and the list is refreshed after successful mutation.

### Persistence and schema decision

The current A.3 schema already has the canonical `Equipment` worksheet/entity, including `equipment_id`, `unit_no`, category, type, status, dates, and a GlobalCapacity reference. Operational records reference `Equipment.equipment_id`. Therefore this implementation must use that existing source of truth and must not create a parallel `Units` worksheet/entity or browser storage. Introducing a distinct `Units` entity would be a separate schema migration requiring an approved schema-version change and explicit migration/reference plan; it is not part of this A.3 UI change.

The modal reads and mutates only through RuntimeAdapter. It must preserve loading, empty, ready, validation-error, and refresh-failure states, and must never bypass audit, transactions, or delete-reference protections.
