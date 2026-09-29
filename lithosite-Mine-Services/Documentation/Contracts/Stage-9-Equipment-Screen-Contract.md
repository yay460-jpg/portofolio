# Stage 9 — Equipment Screen Contract

**Status:** CONTRACT / READY FOR IMPLEMENTATION  
**Module:** Lithosite | Mine Services  
**Desktop Master:** Operations v20 LOCKED shell  
**Database Contract:** Schema A.1  
**Runtime Boundary:** RuntimeAdapter  
**Persistence:** Local XLSX / offline-first

## 1. Purpose

Stage 9 implements the Equipment master-data screen as the second functional desktop screen after Operations.

Stage 9 must reuse the Stage 8 runtime, validation, transaction, persistence, and audit boundaries. It must not create a parallel database or alter the locked Operations v20 artifact.

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