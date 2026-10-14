# Stage 9 — Unit List Contract

**Status:** ACTIVE WORKSPACE CONTRACT  
**Parent Contract:** [Stage 9 — Equipment Master Contract](./Stage-9-Equipment-Screen-Contract.md)  
**Active Schema:** A.3  
**Runtime Boundary:** RuntimeAdapter  
**Data Source:** Canonical `Equipment` and `GlobalCapacity` entities

## 1. Purpose

Define the Unit List modal as the compact unit/fleet master-data workflow exposed from the Equipment screen. It must help users list, add, correct, and manage unit records without creating a duplicate persistence model.

**Unit List is a UI view over `Equipment`, not a new entity or worksheet.**

## 2. Entry Point and Layout

The Equipment toolbar exposes **Unit List** between **Refresh** and **Global Capacity**. Opening it presents a compact modal with these columns:

| Column | Source / behavior |
|---|---|
| Date Record | `Equipment.effective_from`; do not invent a creation timestamp |
| Unique ID | `Equipment.equipment_id`; immutable primary key |
| Type | `Equipment.type` |
| Brand | Resolve `GlobalCapacity.unit_brand` using `Equipment.capacity_profile_id` |
| Category | `Equipment.category` |
| Status | `Equipment.status` |
| Action | Existing Edit and Delete actions, subject to RuntimeAdapter rules |

The modal must provide clear loading, ready, empty, and refresh-failure states. A failed read must not be represented as an empty list.

## 3. Add Unit

The modal must expose an **Add Unit** action.

1. Add Unit opens the existing Equipment form in Unit mode.
2. The form collects the fields required by the canonical A.3 Equipment contract, including `unit_no`.
3. Client-side checks may improve feedback, but RuntimeAdapter validation remains authoritative.
4. Creation uses `CREATE` with entity `Equipment` and the row payload.
5. The UI closes the form and returns to Unit List only after the expected interaction; it reports success only when the runtime returns a committed result.
6. After a committed create, refresh the list from RuntimeAdapter so the new unit appears from persisted data.

Do not create a new Unit ID namespace or a separate `Units` record store. `equipment_id` remains the canonical primary key; `unit_no` is the human-facing fleet/unit number.

## 4. Edit and Unit Number Correction

- Edit opens the existing Equipment form populated from the selected canonical record.
- `equipment_id` must remain immutable.
- `unit_no` may be corrected through the normal `UPDATE Equipment` operation.
- The UI must not modify the in-memory row as a substitute for a committed update.
- After a committed update, refresh the list and show the updated values.
- On cancel, return to Unit List without persisting changes.

## 5. Delete and Reference Protection

- Delete requires explicit confirmation.
- The request uses `DELETE` against entity `Equipment` through RuntimeAdapter.
- RuntimeAdapter owns foreign-key/reference protection, transaction behavior, persistence, and audit.
- If deletion is rejected because the unit is referenced or for any other validation/runtime error, keep the record visible after refresh and show the rejection; never simulate a successful delete.
- After a committed delete, refresh the list from the canonical entity.

## 6. Runtime and Persistence Rules

Reads:
`Unit List → RuntimeAdapter → ApplicationService → Persistence`

Mutations:
`Unit List → Equipment form → RuntimeAdapter → Validation → Transaction → Persistence / Audit`

The Unit List must:
- read `Equipment` and `GlobalCapacity` through RuntimeAdapter;
- resolve brand from the linked GlobalCapacity profile;
- reuse the shared modal-show contract and existing Equipment CRUD behavior;
- avoid direct workbook writes and direct AuditLog writes;
- avoid IndexedDB/localStorage, parallel browser persistence, and external REST dependencies;
- preserve the A.3 schema and existing operational references.

Creating a separate `Units` entity requires a separate approved schema migration and reference plan; it is explicitly outside this A.3 contract.

## 7. Acceptance Gate

The Unit List contract is satisfied when:
- the modal uses the specified columns and canonical data sources;
- Add Unit creates a persisted Equipment record through RuntimeAdapter;
- Edit can correct `unit_no` without changing `equipment_id`;
- Delete requires confirmation and honours runtime reference protection;
- committed mutations refresh the modal from persisted records;
- validation/runtime failures are visible and do not masquerade as success;
- loading, empty, ready, and refresh-failure states are distinct;
- audit and transaction behavior remain owned by RuntimeAdapter;
- no parallel worksheet/entity or browser-side business persistence is introduced;
- regression tests pass.

## 8. Related Contract

Field definitions, controlled vocabularies, primary-key rules, and the Equipment CRUD contract are specified in [Stage 9 — Equipment Master Contract](./Stage-9-Equipment-Screen-Contract.md).
