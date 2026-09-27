# Mine Services — Stage 2 Operational Transaction Contract v1

## Status
- Stage: 2 — Operational Transactions
- Contract: v1
- Entry condition: Stage 1 Data Model FINAL / LOCK
- Implementation status: contract preparation
- Runtime/UI migration: not started

## 1. Purpose

This contract defines how Mine Services operational activity becomes traceable transactions on top of the locked Stage 1 master data model.

Stage 2 does not redesign Stage 1 entities. It consumes:
- Equipment Master
- Work Front Master
- controlled vocabularies
- transaction matrix
- validation lifecycle
- audit requirements

## 2. Transaction Lifecycle

Every transaction follows this logical lifecycle:

CREATE → DRAFT → VALIDATE → VALIDATED

Alternative terminal paths:
- DRAFT → REJECTED
- VALIDATED → VOIDED

Rejected and voided records are retained and remain queryable for audit.

## 3. Transaction Identity

Every transaction requires an immutable `transaction_id`.

Minimum identity attributes:
- transaction_id
- event_date
- event_time when required by transaction type
- domain
- transaction_type
- source

Transaction IDs must not be reused after rejection or voiding.

## 4. Master References

### Work Front

`work_front_id` is required for transaction types marked Required in the locked transaction matrix.

Validation must confirm that the referenced Work Front existed and was valid for the transaction event date.

### Equipment

`equipment_id` is required for transaction types marked Required in the locked transaction matrix.

Validation must confirm that the referenced Equipment existed and was valid for the transaction event date.

Inactive or retired status does not invalidate historical transactions.

## 5. Measurement Contract

Each measurable transaction must contain:
- measurement_type
- measurement_value
- measurement_unit

The measurement type must be valid for the transaction type.

The unit must be the canonical unit defined by the measurement vocabulary.

Example:

`FLEET_OPERATING → OPERATING_TIME → h`

A raw numeric value without measurement semantics is not a valid production transaction.

## 6. Target Reference

`target_reference` is optional at the generic transaction level.

When a transaction is evaluated against an approved operational target, the transaction must reference that target rather than duplicating an uncontrolled target number.

Planning and target master contracts are Stage 4 scope.

## 7. Validation Rules

### Structural validation
- transaction_id exists and is unique
- event_date exists
- domain is controlled
- transaction_type is controlled
- source is controlled
- validation status is valid

### Reference validation
- required Work Front reference exists
- required Equipment reference exists
- master reference was valid on event date

### Measurement validation
- required measurement exists
- measurement type is allowed for transaction type
- measurement value is numeric and within permitted domain rules
- unit matches measurement type

### Business validation
- transaction type matches domain
- required references are present
- prohibited references are absent where contract requires
- event_time is present when required

## 8. Validation Outcome

### Validated

The transaction becomes eligible for downstream KPI/reporting according to its transaction type.

### Rejected

The transaction remains stored but is excluded from authoritative KPI/reporting calculations.

Required rejection data:
- rejection reason code
- explanatory note when required
- actor
- timestamp

### Voided

A previously accepted transaction is invalidated through an auditable action.

Required void data:
- void reason code
- explanatory note when required
- actor
- timestamp

## 9. Transaction Types — Stage 2 Scope

Stage 2 initially implements:

1. `FLEET_OPERATING`
2. `ROAD_ACTIVITY`
3. `DRAINAGE_ACTIVITY`
4. `LAND_CLEARING_ACTIVITY`
5. `DISPOSAL_ACTIVITY`
6. `RECLAMATION_ACTIVITY`

Maintenance events remain Stage 3.

## 10. Transaction Type Rules

### FLEET_OPERATING
- Equipment: Required
- Work Front: Optional
- Measurement: OPERATING_TIME
- Unit: h
- Event time: Required

Purpose: establish traceable equipment operating-time records for later fleet KPI calculations.

### ROAD_ACTIVITY
- Work Front: Required
- Equipment: Optional
- Measurement: DISTANCE / VOLUME / WORK_TIME / COUNT
- Event time: Conditional

Purpose: record road and hauling service activity.

### DRAINAGE_ACTIVITY
- Work Front: Required
- Equipment: Optional
- Measurement: FLOW_VOLUME / WORK_TIME / COUNT
- Event time: Conditional

Purpose: record drainage/dewatering service activity.

### LAND_CLEARING_ACTIVITY
- Work Front: Required
- Equipment: Optional
- Measurement: AREA / VOLUME / WORK_TIME / COUNT
- Event time: Conditional

Purpose: record land-clearing activity.

### DISPOSAL_ACTIVITY
- Work Front: Required
- Equipment: Optional
- Measurement: VOLUME / COUNT / WORK_TIME
- Event time: Conditional

Purpose: record disposal/stockpile activity.

### RECLAMATION_ACTIVITY
- Work Front: Required
- Equipment: Optional
- Measurement: AREA / VOLUME / WORK_TIME / COUNT
- Event time: Conditional

Purpose: record reclamation activity.

## 11. Transaction Immutability

After validation, core event facts must not be silently overwritten.

Material correction must use an auditable correction/void mechanism rather than destructive editing.

Draft transactions may be edited subject to authorization and audit rules.

## 12. KPI Boundary

Stage 2 records operational facts.

Stage 2 must not calculate or manually store final PA, UA, EU, MTBF, MTTR, or FR values as authoritative transaction fields.

Those KPIs remain downstream derived outputs.

## 13. Stage 2 Implementation Boundary

Before changing the prototype UI, implementation must define:
- transaction storage model
- transaction validation service
- master-reference resolver
- transaction lifecycle service
- audit hooks
- transaction-type form contract
- migration mapping from Stage 1 prototype fields

Only then should transaction forms be implemented.

## 14. Stage 2 Entry Gate

Stage 2 implementation can proceed after this contract is audited against the locked Stage 1 baseline.

Required audit checks:
1. No Stage 1 contract is weakened.
2. Every transaction type maps to the locked matrix.
3. Every required reference has a canonical ID.
4. Measurement semantics are explicit.
5. Validation lifecycle is implementable.
6. Rejected/voided transactions remain auditable.
7. KPI calculation remains downstream.

## 15. Current Decision

Stage 2 transaction contract is proposed as v1.

UI and production persistence remain unchanged until the Stage 2 contract audit passes.