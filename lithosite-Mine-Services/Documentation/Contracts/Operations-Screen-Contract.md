# Stage 8 — Operations Screen Contract

**Status:** DRAFT / IMPLEMENTATION CONTRACT  
**Module:** Lithosite Mine Services  
**Desktop Master:** V19 LOCKED  
**Database Contract:** Schema A.1  
**Runtime Boundary:** RuntimeAdapter  
**Offline Target:** Full offline runtime

---

## 1. Purpose

Stage 8 defines the first functional desktop screen after the V19 Dashboard Master.

The Operations screen is the primary transaction workspace for daily mining-service operational records. It must use the existing Schema A.1 `Operations` contract and must not create a parallel data model.

V19 Dashboard remains locked. Stage 8 must not modify the V19 artifact.

---

## 2. Screen Responsibility

The Operations screen is responsible for:

- viewing operational transactions;
- filtering operational transactions;
- creating an operational transaction;
- editing an existing operational transaction through the runtime boundary;
- deleting an operational transaction only through the approved delete flow;
- showing validation results;
- showing transaction/audit outcomes;
- operating without network access.

The screen is not responsible for:

- changing the Schema A.1 definition;
- directly editing the XLSX file;
- maintaining a second browser database;
- changing Equipment or Work Front master data directly;
- generating audit records itself;
- bypassing RuntimeAdapter validation.

---

## 3. A.1 Data Contract

Operations fields are fixed to:

`transaction_id, transaction_date, transaction_time, domain, work_front_id, equipment_id, activity, quantity, unit, actual_hours, target_hours, status, source, created_at, updated_at`

The UI may arrange these fields differently for usability, but the runtime payload must preserve the A.1 field names and semantics.

---

## 4. Screen Layout Contract

The Operations desktop screen shall contain:

### A. Screen Header

- Title: `Operations`
- concise operational description;
- primary `Add Operation` action;
- current offline/runtime readiness indicator.

### B. Filter / Query Bar

Filters shall support the operational fields that are useful for daily work, including:

- date/date range;
- domain;
- work front;
- equipment;
- activity;
- status;
- source.

Filtering is presentation/query behavior and must not mutate data.

### C. Operations Table

The primary table shall expose at minimum:

- Date
- Time
- Domain
- Work Front
- Equipment
- Activity
- Quantity
- Unit
- Actual Hours
- Target Hours
- Status
- Source

`transaction_id`, `created_at`, and `updated_at` remain available to the detail/edit layer even if they are not shown as primary table columns.

### D. Detail / Edit Layer

Create and edit shall use the same validated form model.

The UI must distinguish:

- new transaction;
- existing transaction;
- read-only detail state;
- validation failure;
- successful commit;
- runtime failure.

### E. Empty / Loading / Error States

The screen must explicitly render:

- Loading
- Ready with records
- Ready with zero records
- Validation Error
- Runtime Error
- Offline Ready

An error must never be presented as an empty dataset.

---

## 5. Runtime Contract

All Operations mutations follow:

`UI → RuntimeAdapter → ApplicationService → ValidationEngine → TransactionManager → Persistence/Audit`

Reads follow:

`UI → RuntimeAdapter → ApplicationService → Persistence`

The UI must not call lower runtime layers directly.

---

## 6. CREATE Contract

A new operation must use RuntimeAdapter `CREATE`.

Before commit, the runtime must enforce the existing application and validation rules.

Minimum UI behavior:

1. User opens Add Operation.
2. UI loads valid reference selections.
3. User enters the transaction.
4. UI performs user-facing field checks.
5. RuntimeAdapter receives the canonical payload.
6. Runtime validation executes.
7. Transaction commits atomically on success.
8. Audit is recorded after successful persistence.
9. UI refreshes from runtime data.
10. Success state is shown to the user.

A failed create must not produce a partial record.

---

## 7. UPDATE Contract

Update uses RuntimeAdapter `UPDATE`.

The UI must retain the existing `transaction_id` and must not create a new transaction ID during edit.

The runtime remains authoritative for protected/system fields and validation.

After successful update:

- persistence is committed;
- audit is recorded;
- the affected row is refreshed from runtime data;
- stale form state is cleared.

---

## 8. DELETE Contract

Delete uses RuntimeAdapter `DELETE`.

Delete requires explicit user confirmation.

The UI must show the target transaction clearly before confirmation.

A cancelled delete must not call the runtime mutation.

A successful delete must refresh the table from runtime data and show the result.

---

## 9. Reference Data

The Operations form may require reference data from:

- `WorkFront`
- `Equipment`
- applicable `_Lists` values

Reference data is read through the runtime boundary.

The Operations screen must not embed a duplicate hard-coded master database.

---

## 10. Validation Contract

Runtime validation remains authoritative.

The screen must surface runtime validation errors without rewriting their meaning.

Relevant existing validation categories include:

- required fields;
- valid enumerations;
- numeric values >= 0;
- valid references;
- date/time consistency;
- conditional field rules;
- protected system fields.

No new validation rule may be invented by the UI without first updating the governing contract.

---

## 11. Audit Contract

The Operations screen must not directly write `AuditLog`.

Audit creation remains a runtime responsibility after a successful mutation.

The UI may display audit outcome/status where useful.

---

## 12. Offline Contract

Operations must remain fully functional without internet access.

Required runtime dependencies must be local/embedded.

The screen must not require:

- cloud API;
- Google Sheets;
- Google Apps Script;
- remote database;
- external REST service;
- CDN assets.

---

## 13. Performance Rules

The first implementation should prioritize predictable desktop performance.

Rules:

- do not calculate unrelated storage metrics during table filtering;
- do not reload the complete application shell for a filter change;
- do not decode heavy thumbnails or images for operational rows;
- keep reference data cached within the active runtime/session where appropriate;
- refresh only the affected data view after a successful mutation;
- avoid duplicate persistence calls.

---

## 14. Security / Integrity Rules

- RuntimeAdapter is the integration boundary.
- UI is not trusted as the final validator.
- Protected/system fields cannot be freely edited.
- Delete requires confirmation.
- Audit remains runtime-controlled.
- Import is not part of the normal CRUD form path.
- No network dependency is introduced for normal operation.

---

## 15. Acceptance Criteria

Stage 8 implementation may be considered functionally complete when:

- Operations screen is reachable from the locked desktop shell;
- table displays A.1 Operations records;
- filters work without mutating data;
- CREATE works through RuntimeAdapter;
- UPDATE works through RuntimeAdapter;
- DELETE works through RuntimeAdapter with confirmation;
- validation errors are surfaced correctly;
- successful mutations are audited by runtime;
- empty/loading/error states are distinct;
- offline operation works without network access;
- no duplicate persistence layer is introduced;
- existing Stage 2–5 contracts remain intact;
- regression tests remain green.

Stage 8 is **not PASS** until implementation and tests are completed.

---

## 16. Next Step

Implement the Operations screen against this contract.

Do not modify the V19 LOCKED Dashboard artifact.
