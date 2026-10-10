# Lithosite Mine Services — V38 Checker & Retase Observation Contract

**Status:** Design baseline — V38  
**Scope:** Checker field observation for operational activity  
**Primary integration:** Checker → Field Observation → Operations

## 1. Purpose

This contract defines the V38 Checker data model used to record field observations that support operational transactions.

The Checker component is the source of the **actual Retase** observed in the field for applicable Dump Truck hauling activity.

Retase remains part of the Checker domain. V38 does not create a separate Retase sheet, Retase entity, or `retase.js` component.

The intended relationship is:

**Checker → Field Observation → Operations**

Operations remains responsible for the operational transaction and for calculating Quantity from Retase × Applied Capacity for Dump Truck + Hauling.

## 2. V38 Scope

### Included

- One Checker component.
- Period-based field observation records.
- Equipment identification.
- Observation date and time period.
- Shift.
- Work Front / Area.
- Activity.
- Material.
- Actual Retase for applicable hauling observations.
- Source identifying the record as a Checker / field observation.
- Equipment type resolved from Equipment master.
- Checker observation can be referenced by Operations.

### Not included

- Separate Retase domain or sheet.
- Separate `retase.js`.
- Automatic creation of Operations when a Checker record is saved.
- Quantity calculation inside Checker.
- Applied Capacity configuration inside Checker.
- Silent rewriting of finalized Operations.
- Variance / exception workflow beyond the source-of-truth principle.

## 3. Record Principle

One Checker record represents:

**one equipment + one activity + one observation period + one operating context + one observed condition**

It is not:

- one record for an entire shift, or
- one record for every individual trip.

The same Dump Truck may therefore have multiple Checker records during one shift when its operating condition changes.

Example:

| Observation Period | Equipment | Area | Activity | Material | Retase |
|---|---|---|---|---|---:|
| 06:00–09:00 | DT-01 | Pit A | Hauling | Ore | 4 |
| 09:00–12:00 | DT-01 | Pit A | Hauling | OB | 3 |
| 12:00–15:00 | DT-01 | Road Hauling | Hauling | Quarry | 2 |
| 15:00–17:00 | DT-01 | Workshop | Maintenance | — | — |

This allows an equipment unit to change operational context during the same day.

## 4. A3 Checker Sheet

The V38 A3 runtime schema uses a dedicated **Checker** sheet.

The conceptual columns are:

| Column | Purpose | Rule |
|---|---|---|
| `checker_id` | Record identifier | Primary key |
| `checker_name` | Field checker identity | Required |
| `observation_date` | Observation date | Required |
| `start_time` | Observation period start | Required |
| `end_time` | Observation period end | Required |
| `shift` | Operational shift | Day / Night |
| `equipment_id` | Observed equipment | FK to Equipment |
| `work_front_id` | Work Front / Area context | FK to WorkFront |
| `activity` | Observed activity | Operational activity |
| `material` | Observed material | Ore / OB / Quarry where applicable |
| `retase` | Actual observed retase | Required only for Dump Truck + Hauling |
| `source` | Evidence source | Checker / field observation |

Equipment type is resolved from the selected Equipment master record and is not treated as an independent capacity source.

## 5. Required Relationships

### Equipment

`equipment_id` references:

**Equipment.equipment_id**

The Equipment master provides the equipment identity and type.

For the V38 hauling rule, the system checks the resolved Equipment type to determine whether the observation is a Dump Truck.

### Work Front

`work_front_id` references:

**WorkFront.work_front_id**

Work Front provides the operational context. Its capacity configuration remains outside Checker.

## 6. Activity and Retase Rule

Retase is applicable specifically to:

**Dump Truck + Hauling**

For this condition:

- Checker records the observed Retase.
- Operations may use that Retase as the field observation source.
- Applied Capacity is resolved from Global Capacity / Work Front / Console configuration.
- Quantity is calculated in Operations.

Formula:

**Quantity = Retase × Applied Capacity**

Checker does not calculate or manually store the operational Quantity.

For non-hauling activities such as Standby / Waiting or Maintenance / Workshop, Retase is not forced.

## 7. Material

Material is one controlled field per Checker record.

V38 controlled values are:

- Ore
- OB
- Quarry

The model does not use three simultaneous material columns.

This allows the same equipment to have different observations across different materials during the same shift.

## 8. Shift

The Checker record identifies the operational shift.

V38 uses:

- Day
- Night

Day and Night records remain period-level detail and may be aggregated for operational summaries.

Example:

- Day Retase = 4 rit
- Night Retase = 5 rit
- Total Retase = 9 rit

The underlying period records remain available.

## 9. Observation Period

The observation period is represented by:

- `observation_date`
- `start_time`
- `end_time`

The period describes when the Checker observed the operating condition.

A new Checker record is appropriate when the operating context changes, such as:

- Work Front changes.
- Material changes.
- Activity changes.
- Observed Retase condition changes.

## 10. Source of Truth

| Data | Source |
|---|---|
| Checker identity | Checker record |
| Observation period | Checker record |
| Equipment identity | Equipment master |
| Equipment type | Equipment master |
| Work Front / Area | Checker record referencing WorkFront |
| Activity | Checker observation |
| Material | Checker observation |
| Retase | Actual field observation |
| Applied Capacity | Global Capacity / Work Front / Console |
| Quantity | Operations calculation |

**Actual Hours does not determine Retase.**

The system must not infer Retase from elapsed or Actual Hours.

## 11. Checker → Operations Integration

V38 uses **Model B** as the initial integration pattern:

**Checker → Field Observation → Operations**

Saving a Checker record does not silently create or rewrite an Operations transaction.

Operations can reference the Checker observation as its source so the operator does not need to retype the observed Retase.

If a Checker record is corrected while the related Operations transaction is still open/not final, the operational data may follow the corrected observation.

If the related Operations transaction is already validated/final, historical data must not be silently rewritten. A correction/reconciliation flow may be introduced later if operational requirements justify it.

## 12. Historical Integrity

Checker records are field observations and remain period-level evidence.

Operations may snapshot the values required for historical reporting, including Retase and Applied Capacity.

Changing Global Capacity later must not rewrite an already finalized Operations result.

Likewise, a finalized Operations transaction must not be silently changed merely because a Checker observation is later corrected.

## 13. Component Boundary

V38 uses one implementation component:

**`checker.js = Checker + Retase handling`**

There is no:

- `retase.js`
- Retase database sheet
- Retase standalone domain

This boundary is intentionally closed for V38.

Future boundaries should only be introduced when a real operational requirement emerges.

## 14. Acceptance Criteria

1. A dedicated A3 Checker sheet exists.
2. `checker_id` is the primary key.
3. Checker identity is recorded.
4. Observation date and period are recorded.
5. Shift is recorded using the V38 Day / Night vocabulary.
6. Equipment is referenced through Equipment ID.
7. Equipment type is resolved from Equipment master.
8. Work Front is referenced through WorkFront.
9. Activity is recorded.
10. Material uses one controlled field with Ore / OB / Quarry values.
11. Dump Truck + Hauling requires observed Retase.
12. Non-hauling activities are not forced through Retase handling.
13. Checker does not calculate Quantity.
14. Checker does not own Applied Capacity.
15. Saving Checker does not silently create or rewrite Operations.
16. Period-level records remain available for Day/Night aggregation.
17. No separate Retase sheet or `retase.js` is introduced.

## 15. Design Decision

**V38 decision:**

> Checker is the single field-observation component. Retase is part of Checker and represents the actual observed hauling condition. Equipment provides fleet identity and type. Work Front provides operational context. Global Capacity provides Applied Capacity outside Checker. Operations consumes the observation and calculates Quantity for Dump Truck + Hauling.

This contract is the baseline for the V38 A3 Checker implementation.
