# Stage 9 — Equipment Master Contract

**Status:** ACTIVE WORKSPACE CONTRACT  
**Module:** Lithosite | Mine Services  
**Active Schema:** A.3  
**Runtime Boundary:** RuntimeAdapter  
**Persistence:** Canonical local XLSX workbook / offline-first

## 1. Purpose

Define the canonical Equipment master-data entity and the obligations of the Equipment screen. This contract applies to the active A.3 workspace; it does not change or promote the locked `main` baseline.

Equipment is the canonical source for fleet/unit identity used by Operations, Maintenance, Checker, Issues, and map traceability. The Unit List is a projection/workflow over this entity, not a second database.

## 2. Canonical A.3 Entity

Entity: `Equipment`  
Worksheet: `Equipment`  
Primary key: `equipment_id`

The active A.3 field order is:

`equipment_id, unit_no, category, type, owner_type, owner_name, status, effective_from, effective_to, capacity_profile_id`

Required fields:
- `equipment_id`
- `unit_no`

Controlled vocabulary:
- `category` → `equipment_category`
- `type` → `equipment_type`
- `owner_type` → `owner_type`
- `status` → `equipment_status`

Reference:
- `capacity_profile_id` optionally references `GlobalCapacity.capacity_profile_id`.
- A selected Global Capacity profile supplies the displayed `unit_brand` and capacity information; the UI must not persist duplicated brand/capacity values on Equipment.

## 3. Runtime Boundary

Reads:
`Equipment UI → RuntimeAdapter → ApplicationService → Persistence`

Mutations:
`Equipment UI → RuntimeAdapter → ApplicationService → Validation → Transaction → Persistence / Audit`

Every read and mutation uses the canonical `Equipment` entity. UI code must not write to XLSX directly, maintain browser-side business storage, or write AuditLog records itself.

## 4. Screen Responsibilities

The Equipment screen must support:
- reading and filtering canonical Equipment records;
- creating records with required-field and controlled-list validation;
- editing records while keeping `equipment_id` immutable;
- correcting `unit_no` through the normal UPDATE path;
- deleting only after explicit confirmation and only when RuntimeAdapter reference rules permit;
- displaying runtime, validation, and reference-integrity failures;
- refreshing the affected view after a committed mutation.

Filters are presentation-only and must not mutate persisted data.

## 5. State and Error Contract

The screen must distinguish:
- Loading;
- Ready with records;
- Ready with zero records;
- Validation Error;
- Runtime Error / Refresh Failure;
- Offline Ready when the runtime reports that state.

A failed runtime read must never be presented as a successful empty dataset. A rejected mutation must leave persisted data unchanged and show the runtime outcome.

## 6. Reference Integrity and Audit

Equipment is referenced by operational entities, including Operations and Maintenance. Deletes must use RuntimeAdapter and honour canonical foreign-key/reference protection. The UI must not bypass a rejected delete or locally remove a row as if deletion succeeded.

Successful CREATE, UPDATE, and DELETE operations must use the existing transaction and audit pipeline. The UI may report success only after a committed RuntimeAdapter result.

## 7. Security and Persistence Rules

- No new `Units` worksheet/entity in Schema A.3.
- No IndexedDB/localStorage business database.
- No browser-side XLSX writes.
- No cloud or external REST dependency for normal offline CRUD.
- RuntimeAdapter remains authoritative for validation, transaction, persistence, and audit.
- Do not alter operational workbook A.3 or the locked `main` baseline as part of this contract-only change.

## 8. Acceptance Gate

The Equipment contract is satisfied when:
- the screen uses the exact A.3 field contract above;
- controlled lists come from RuntimeAdapter / authoritative `_Lists`;
- CREATE / UPDATE / DELETE use RuntimeAdapter;
- `equipment_id` is immutable while `unit_no` remains correctable;
- validation and protected-delete failures are surfaced;
- committed changes persist and create the expected audit event;
- records survive refresh/reload;
- runtime failure is not confused with an empty result;
- the existing Stage 8/runtime boundary and A.3 source of truth remain intact;
- regression tests pass.

## 9. Related Contract

The compact Unit List projection and its Add/Edit/Delete workflow are specified separately in [Stage 9 — Unit List Contract](./Stage-9-Unit-List-Contract.md).
