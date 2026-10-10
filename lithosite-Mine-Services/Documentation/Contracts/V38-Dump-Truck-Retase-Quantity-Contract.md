# Lithosite Mine Services — V38 Dump Truck Retase & Auto Quantity Contract

**Status:** Design baseline — V38  
**Scope:** Dump Truck (DT) — Hauling  
**Primary screen:** Operations → Work Timeline / Add Operation

## 1. Purpose

This contract defines how Dump Truck hauling production is recorded in V38.

The system must use the **actual retase recorded by the field checker** as the operational observation, obtain the **Applied Capacity from the applicable Global Capacity / Work Front / Console configuration**, and calculate **Quantity automatically**. Equipment remains supporting fleet data and does not automatically define operational capacity.

The intended flow is:

**Global Capacity / Console → Equipment → Checker → Retase → Applied Capacity → Quantity**

This avoids making Quantity a second, manually entered source of truth.

## 2. V38 Scope

### Included

- Dump Truck (DT).
- Activity: **Hauling**.
- Retase recorded from field/checker notes.
- Global Capacity manually configured as an operational capacity profile.
- Quantity calculated automatically.
- Retase and Quantity displayed together in the Work Timeline.

### Not included yet

- Excavator calculation.
- Hauling distance.
- Cycle time.
- Loading/dumping time.
- Road/transport factors.
- Distance-based productivity calculations.
- Automatic inference of retase from Actual Hours.
- Variance/exception workflow beyond the data principle defined here.

## 3. Source of Truth

| Data | Source |
|---|---|
| Retase | Actual field observation / checker hauling record |
| Applied Capacity | Global Capacity / Work Front / Console configuration |
| Quantity | System calculation |
| Actual Hours | Operational time record |
| Work Timeline | Transaction context and calculated result |

**Important:** Actual Hours does not determine Retase.

For example, Actual Hours = 4 does not mean the system should guess the number of ritase. The retase must come from the checker record.

## 4. Equipment and Applied Capacity

Equipment is supporting fleet data for Operation. It identifies the selected Dump Truck but does not automatically define the operational hauling capacity.

Operational capacity is maintained separately through **Global Capacity** and the applicable Work Front / Console configuration.

Global Capacity supports manual/free-value decimal entries, for example:

- 25 ton
- 25.5 ton
- 27.5 ton
- 29 ton
- 32 ton
- 35.5 ton

The configured value used by a transaction becomes its **Applied Capacity**.

## 5. Add Operation — Hauling

For Dump Truck + Hauling, the relevant transaction fields are conceptually:

| Field | Behaviour | Rule |
|---|---|---|
| Equipment | Input | Select Dump Truck |
| Activity | Input | Hauling |
| Retase | Manual input | Enter actual checker result |
| Applied Capacity | Auto / read-only | Resolve from Global Capacity / Work Front / Console configuration |
| Quantity | Auto-calculated | Retase × Applied Capacity |
| Unit | Auto / context | ton |
| Actual Hours | Input | Actual operating duration |
| Target Hours | Input | Target duration |
| Status | Input / system | Transaction status |
| Source | Input / system | Transaction source |

**Quantity must not be manually re-entered for this DT hauling flow.**

## 6. Quantity Formula

### Formula

**Quantity = Retase × Applied Capacity**

### Example

Selected equipment:

- Equipment: DT-TEST-001
- Type: Hino
- Applied Capacity: 27.5 ton/rit

Checker record:

- Retase: 4 rit

System result:

**4 rit × 27.5 ton = 110 ton**

The operator enters **Retase = 4**. The system produces **Quantity = 110 ton**.

## 7. Work Timeline Example

| Time | Activity | Retase | Applied Capacity | Quantity | Actual Hrs |
|---|---|---:|---:|---:|---:|
| 06:00 | Hauling | 4 | 27.5 ton | 110 ton | 4 |

The Work Timeline must preserve the relationship between the observed Retase and the calculated Quantity.

For non-hauling activities such as **Standby / Waiting**, the hauling retase calculation is not forced onto the activity.

## 8. Checker Synchronization

The checker remains the field evidence source for retase.

Example:

> Checker: DT-TEST-001 recorded 4 rit at the relevant period.

The system then resolves:

> Retase = 4  
> Applied Capacity = 27.5 ton  
> Quantity = 110 ton

This means the system does **not** ask the checker to produce a Quantity value and does not require the operator to enter Quantity separately.

If a future field record differs from the calculated result, the difference should be treated as an **exception/variance requiring explanation**, rather than allowing an uncontrolled overwrite of the calculated Quantity.

Variance handling is outside the current V38 scope.

## 9. Activity Rule

The Retase × Applied Capacity rule applies specifically to:

**Dump Truck + Hauling**

It is not a global rule for every Operation activity.

| Condition | Retase | Quantity |
|---|---|---|
| Dump Truck + Hauling | From checker | Auto = Retase × Applied Capacity |
| Dump Truck + non-Hauling | Not forced | Follows activity rule |
| Excavator | Not implemented yet | Not implemented yet |

## 10. Future Excavator Extension

Excavator will be handled later as a separate design decision.

The V38 Dump Truck contract must not assume that Excavator production uses the same measurement model.

## 11. Acceptance Criteria

1. Selecting a Dump Truck resolves the fleet identity; it does not automatically define operational capacity.
2. Hauling resolves the applicable Global Capacity / Work Front / Console value.
3. Global Capacity supports manual decimal values and is not restricted to fixed tonnage options.
4. Hauling allows Retase to be entered from the checker record.
5. Applied Capacity is not manually re-entered for each hauling transaction.
6. Quantity is calculated automatically as **Retase × Applied Capacity**.
7. Quantity does not require duplicate manual input.
8. Work Timeline displays Retase and Quantity together.
9. The Applied Capacity used by the transaction is preserved for historical integrity.
10. Actual Hours remains an independent operational field.
11. The rule does not change Excavator logic or introduce distance/cycle-time calculations.
12. The design preserves checker evidence as the source of actual Retase.

## 12. Design Decision

**V38 decision:**

> For Dump Truck Hauling, **Retase is the actual field observation, Global Capacity is the configurable operational capacity, Equipment is the fleet-support master, Applied Capacity is the capacity snapshot used by the transaction, and Quantity is the system-calculated result of Retase × Applied Capacity.**

This contract is the baseline for the next implementation step in V38.


## 13. Finalized Checker & Retase Operating Model

The V38 design is finalized with a single Checker component. Retase remains part of the Checker domain; a separate Retase sheet/entity and separate retase.js component are not required for this V38 implementation.

### 13.1 Period-based Checker records

One Checker record represents one observed operating condition for one equipment + activity + time period. It is not one record for an entire shift and not one record for each individual trip.

The same Dump Truck may therefore have multiple records in one shift/day when its operating condition changes.

Example:

| Period | Equipment | Area | Activity | Material | Retase |
|---|---|---|---|---|---:|
| 06:00–09:00 | DT-01 | Pit A | Hauling | Ore | 4 |
| 09:00–12:00 | DT-01 | Pit A | Hauling | OB | 3 |
| 12:00–15:00 | DT-01 | Road Hauling | Hauling | Quarry | 2 |
| 15:00–17:00 | DT-01 | Workshop | Maintenance | — | — |

This supports operational reassignment without locking an equipment unit to one Work Front or material for the whole shift.

### 13.2 Checker data responsibility

The conceptual Checker record contains:

- Checker identity
- Date
- Observation period / time
- Shift
- Equipment ID
- Equipment type resolved from Equipment master
- Work Front / Area
- Activity
- Material: Ore, OB, or Quarry
- Retase for applicable hauling records
- Source = Checker / field observation

Material is one controlled field per record, not three simultaneous columns.

### 13.3 Activity rule

For Dump Truck + Hauling, Material and Retase are recorded and Quantity may be calculated.

For Standby / Waiting and Maintenance / Workshop, Retase is not forced and the hauling calculation is not applied.

### 13.4 Checker → Operations

V38 uses Model B as the initial integration pattern:

**Checker → Field Observation → Operations**

Saving a Checker record does not silently create or rewrite an Operations transaction. Operations can use the Checker record as its source so the user does not need to retype the observed data.

If a Checker record is corrected while the related Operations transaction is still open/not final, the operational data may follow the corrected observation.

If the related Operations transaction is already validated/final, the historical transaction must not be silently rewritten. A correction/reconciliation flow may be added later if required.

Direct Checker → Operations creation remains a future option if operational use proves it preferable.

### 13.5 Aggregation

Checker records remain period-level detail.

Day and Night can be aggregated for summary display while retaining the underlying period records.

Example:

- Day Retase = 4 rit
- Night Retase = 5 rit
- Total Retase = 9 rit

The main Operations layout may show the total, while Work Timeline/detail views retain the period-level records.

### 13.6 Final design boundary

The V38 implementation uses:

**checker.js = Checker + Retase handling**

and does not create a separate retase.js or Retase database sheet.

The remaining implementation work is limited to the A3 Checker sheet structure and the corresponding UI/runtime integration.
