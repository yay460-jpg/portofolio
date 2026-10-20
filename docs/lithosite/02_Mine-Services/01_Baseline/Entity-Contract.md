# Mine Services Entity Contract v1

## Status
- Stage: 1 — Data Model
- Contract: v1
- Purpose: canonical entity and reference contract before Stage 2 Operational Transactions
- Schema lock: pending audit
- Production persistence: not defined by this document

## 1. Contract Principles
1. Master data is the authoritative identity source.
2. Operational transactions reference master entities by immutable IDs; names or free text are not authoritative references.
3. Referenced master records must not be hard-deleted.
4. A transaction is historically valid against the master state applicable at its event date.
5. Every operational transaction has a unique transaction ID.
6. Validation state is explicit and separate from UI validation.
7. KPI values are derived from validated source transactions, not manually entered KPI totals.
8. Audit metadata is part of the production contract.
9. The contract defines data semantics; storage technology is intentionally deferred.

## 2. Equipment Master
### 2.1 Canonical fields
| Field | Required | Rule |
|---|---|---|
| equipment_id | Yes | Immutable canonical identifier; unique within Mine Services |
| equipment_type | Yes | Controlled equipment category/type |
| owner_type | Yes | Owner or Contractor |
| owner_id | Yes | Canonical owner/contractor identity |
| status | Yes | Active, Inactive, Retired |
| effective_from | Yes | Date/time the record becomes effective |
| effective_to | No | End of effectiveness; null while active |
| created_at | Yes | Audit timestamp |
| created_by | Yes | Audit actor |
| updated_at | Yes | Audit timestamp |
| updated_by | Yes | Audit actor |

### 2.2 Rules
- equipment_id is never reused for another physical asset.
- Status changes are lifecycle events; they do not change historical transaction references.
- Retired equipment remains queryable for historical reporting.
- An equipment record referenced by a transaction cannot be hard-deleted.
- Equipment type/category must use a controlled vocabulary in production.

## 3. Work Front Master
### 3.1 Canonical fields
| Field | Required | Rule |
|---|---|---|
| work_front_id | Yes | Immutable canonical identifier |
| domain | Yes | Controlled operational domain |
| location_area | Yes | Operational location/area |
| status | Yes | Active, Inactive, Closed |
| responsibility_id | Yes | Responsible organizational identity |
| effective_from | Yes | Date/time the record becomes effective |
| effective_to | No | End of effectiveness |
| created_at | Yes | Audit timestamp |
| created_by | Yes | Audit actor |
| updated_at | Yes | Audit timestamp |
| updated_by | Yes | Audit actor |

### 3.2 Rules
- work_front_id is the authoritative reference; location text alone is not.
- Domain must use a controlled vocabulary.
- Closed/inactive work fronts remain available for historical transactions.
- A referenced work front cannot be hard-deleted.
- Optional parent/child hierarchy may be added only after the operational domain model requires it.

## 4. Daily Operations Transaction
Daily Operations is treated as an operational transaction envelope, not a universal KPI record.

### 4.1 Canonical fields
| Field | Required | Rule |
|---|---|---|
| transaction_id | Yes | Globally unique within Mine Services |
| event_date | Yes | Operational date |
| event_time | Conditional | Required when transaction granularity needs time |
| domain | Yes | Controlled operational domain |
| transaction_type | Yes | Controlled transaction subtype |
| work_front_id | Conditional | Required when transaction is work-front based |
| equipment_id | Conditional | Required for equipment-specific transactions |
| measurement_type | Conditional | Controlled quantity/metric type |
| measurement_value | Conditional | Numeric value |
| measurement_unit | Conditional | Unit tied to measurement type |
| target_reference | Conditional | Reference to approved target/plan where applicable |
| validation_status | Yes | Draft, Validated, Rejected, Voided |
| source | Yes | Origin of transaction |
| created_at | Yes | Audit timestamp |
| created_by | Yes | Audit actor |
| updated_at | Yes | Audit timestamp |
| updated_by | Yes | Audit actor |

### 4.2 Rules
- transaction_id is immutable and unique.
- domain and transaction_type determine which fields are mandatory.
- actual_hours and target_hours are not universal fields; they belong only to transaction types where hours are the correct measurement.
- issue_count is not authoritative issue tracking. Detailed issues, if required, are separate transactions/entities linked by ID.
- A transaction referencing equipment or a work front must use the canonical ID.
- References must resolve against a valid master state for the event date.
- Rejected/voided transactions are retained for audit and are excluded from KPI calculation unless a later contract explicitly defines otherwise.

## 5. Operational Domains
Initial controlled domain set:
- Fleet
- Road & Hauling
- Drainage & Dewatering
- Land Clearing
- Disposal & Stockpile
- Reclamation

New domains require contract review; they must not be introduced as arbitrary UI text.

## 6. Transaction Identity and References
Minimum relationship model:

Equipment Master (1) → Operational Transactions (0..N)

Work Front Master (1) → Operational Transactions (0..N)

A transaction may reference both equipment and work front when the transaction represents equipment activity at a work front.

Historical integrity rule:
> Deactivating or retiring a master record must never invalidate historical transactions.

## 7. Validation Lifecycle
Proposed production validation states:
1. Draft — entered but not accepted as authoritative.
2. Validated — passed contract and reference checks; eligible for KPI/reporting according to transaction type.
3. Rejected — failed validation; retained with reason.
4. Voided — previously recorded transaction invalidated through an auditable action.

Validation is a domain/service responsibility, not a UI-only check.

## 8. Audit Metadata
Production transactions and master records require:
- who created the record
- when it was created
- who last changed it
- when it was last changed
- source/origin where applicable
- reason/reference for rejection, voiding, or material status changes

Additional immutable audit-event history will be defined in the Audit stage.

## 9. KPI Dependency Contract
KPI engines must consume traceable validated source records.

Initial dependency direction:
Equipment Master
→ Operating Time / Fleet Transactions
→ Maintenance Events
→ Validated Operational Transactions
→ KPI Engine
→ PA / UA / EU / MTBF / MTTR / FR

The KPI layer must not become an independent manual data-entry source.

## 10. Stage 2 Entry Gate
Before Stage 2 implementation begins, the following must be audited and accepted:
- Equipment Master contract
- Work Front Master contract
- Daily Operations transaction envelope
- Domain and transaction-type vocabulary
- Reference and historical-validity rules
- Validation states
- Audit metadata
- Measurement/unit semantics
- Equipment and work-front relationship rules

Only after this gate passes should the HTML prototype be adapted into Stage 2 transaction flows.

## 11. Deferred Items
The following are intentionally not locked by v1:
- physical database schema
- API endpoints
- authentication/authorization implementation
- maintenance-event detailed schema
- fleet operating-time event schema
- budget/planning schema
- HSE event schema
- reporting warehouse/schema
- parent/child work-front hierarchy
- exact controlled vocabularies and code lists

These belong to their respective architecture/transaction stages and must not be improvised inside the Stage 1 prototype.

## 12. Lock Statement
This document is the proposed canonical Entity Contract v1.

It is **not yet the final schema lock**. A dedicated audit must verify consistency with the existing Stage 1 prototype and the Stage 1 Audit findings before the contract is marked locked.
