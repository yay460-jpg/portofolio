# Stage 10 — Work Front Screen Contract

**Status:** CONTRACT / READY FOR IMPLEMENTATION  
**Module:** Lithosite | Mine Services  
**Desktop Master:** Operations v20.1 LOCKED shell + Stage 9 Equipment baseline  
**Database Contract:** Schema A.1  
**Runtime Boundary:** RuntimeAdapter  
**Persistence:** Local XLSX / offline-first

## 1. Purpose

Stage 10 implements the Work Front master-data screen as the third functional desktop screen after Operations and Equipment.

Stage 10 must reuse the established runtime, validation, transaction, persistence, and audit boundaries. It must not create a parallel database or alter the locked Operations v20.1 baseline.

## 2. A.1 Work Front Contract

Work Front fields are fixed to:

work_front_id, domain, location, responsible, status, effective_from, effective_to

Primary key: work_front_id.

Controlled fields:
- domain → service_domain
- status → work_front_status

Required field:
- work_front_id

## 3. Screen Responsibility

The Work Front screen is responsible for:
- viewing Work Front master records;
- filtering Work Front records;
- creating Work Front records;
- editing Work Front records through RuntimeAdapter;
- deleting Work Front records through RuntimeAdapter when reference rules permit;
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

Work Front UI → RuntimeAdapter → ApplicationService → Persistence

Mutations:

Work Front UI → RuntimeAdapter → ApplicationService → Validation → Transaction → Persistence / Audit

All CRUD must use the canonical WorkFront entity and work_front_id primary key.

## 5. Reference Integrity

Work Front is referenced by:
- Operations.work_front_id — required FK;
- Issues.work_front_id — optional FK;
- Plans.work_front_id — optional FK;
- HSE.work_front_id — optional FK.

Therefore the Runtime layer remains authoritative for delete protection. The UI must display runtime rejection and must not implement a client-side workaround.

## 6. UI States

The screen must distinguish:
- Loading;
- Ready with records;
- Ready with zero records;
- Validation Error;
- Runtime Error;
- Offline Ready.

Runtime failure must never be rendered as an empty Work Front dataset.

## 7. CRUD Acceptance

### CREATE
Create a valid Work Front row through RuntimeAdapter and verify persistence plus CREATE audit.

### UPDATE
Update an existing Work Front row without changing work_front_id. Verify persistence plus UPDATE audit.

### DELETE
Require explicit confirmation. Runtime must enforce all existing FK rules. A failed delete must leave the Work Front record intact.

## 8. Controlled Vocabulary

The UI must obtain controlled values through the authoritative runtime _Lists contract:
- service_domain
- work_front_status

The UI must not hard-code an independent business vocabulary.

## 9. Offline / Security Rules

- No IndexedDB/localStorage business database.
- No direct XLSX writes from the browser.
- No cloud or external REST dependency for normal CRUD.
- RuntimeAdapter remains authoritative.
- Audit remains runtime-controlled.

## 10. Performance

- Filter operations must not mutate data.
- Reference/list data should be read through runtime.
- Do not reload the complete application shell for filtering.
- Refresh the affected Work Front view after successful mutation.

## 11. Stage 10 Acceptance Gate

Stage 10 can become PASS only when:
- Work Front is reachable from the established desktop shell;
- A.1 Work Front fields are represented correctly;
- controlled vocabularies come from the runtime/schema contract;
- CREATE / UPDATE / DELETE route through RuntimeAdapter;
- validation errors are surfaced correctly;
- protected deletes are rejected correctly;
- successful mutations create AuditLog entries;
- persistence survives refresh/reload;
- offline operation works;
- Stage 8 Operations and Stage 9 Equipment baselines remain intact;
- regression tests are green.

Implementation boundary: Stage 10 is Work Front only. Maintenance, Issues, Plans, HSE, Reporting, Import, Backup/Restore, and Settings remain outside this stage.
