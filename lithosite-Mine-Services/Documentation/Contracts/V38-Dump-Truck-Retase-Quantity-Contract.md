# Lithosite Mine Services — V38 Dump Truck Retase & Auto Quantity Contract

**Status:** Design baseline — V38  
**Scope:** Dump Truck (DT) — Hauling  
**Primary screen:** Operations → Work Timeline / Add Operation

## 1. Purpose

This contract defines how Dump Truck hauling production is recorded in V38.

The system must use the **actual retase recorded by the field checker** as the operational observation, obtain the **Payload from the selected equipment configuration**, and calculate **Quantity automatically**.

The intended flow is:

**Checker → Retase → Payload → Quantity**

This avoids making Quantity a second, manually entered source of truth.

## 2. V38 Scope

### Included

- Dump Truck (DT).
- Activity: **Hauling**.
- Retase recorded from field/checker notes.
- Payload read from equipment configuration.
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
| Payload | Equipment configuration |
| Quantity | System calculation |
| Actual Hours | Operational time record |
| Work Timeline | Transaction context and calculated result |

**Important:** Actual Hours does not determine Retase.

For example, Actual Hours = 4 does not mean the system should guess the number of ritase. The retase must come from the checker record.

## 4. Equipment Payload

Payload is an attribute of the selected Dump Truck and is not retyped for every transaction.

| Equipment | Type / Brand | Payload |
|---|---|---:|
| DT-TEST-001 | Hino | 25 ton |
| DT-TEST-002 | Fuso | According to unit configuration |
| DT-TEST-003 | Shacman | According to unit configuration |

The value **25 ton** is an example for the configured Hino unit, not a global payload rule for every Dump Truck.

## 5. Add Operation — Hauling

For Dump Truck + Hauling, the relevant transaction fields are conceptually:

| Field | Behaviour | Rule |
|---|---|---|
| Equipment | Input | Select Dump Truck |
| Activity | Input | Hauling |
| Retase | Manual input | Enter actual checker result |
| Payload | Auto / read-only | Read from equipment configuration |
| Quantity | Auto-calculated | Retase × Payload |
| Unit | Auto / context | ton |
| Actual Hours | Input | Actual operating duration |
| Target Hours | Input | Target duration |
| Status | Input / system | Transaction status |
| Source | Input / system | Transaction source |

**Quantity must not be manually re-entered for this DT hauling flow.**

## 6. Quantity Formula

### Formula

**Quantity = Retase × Payload**

### Example

Selected equipment:

- Equipment: DT-TEST-001
- Type: Hino
- Payload: 25 ton/rit

Checker record:

- Retase: 4 rit

System result:

**4 rit × 25 ton = 100 ton**

The operator enters **Retase = 4**. The system produces **Quantity = 100 ton**.

## 7. Work Timeline Example

| Time | Activity | Retase | Payload | Quantity | Actual Hrs |
|---|---|---:|---:|---:|---:|
| 06:00 | Hauling | 4 | 25 ton | 100 ton | 4 |

The Work Timeline must preserve the relationship between the observed Retase and the calculated Quantity.

For non-hauling activities such as **Standby / Waiting**, the hauling retase calculation is not forced onto the activity.

## 8. Checker Synchronization

The checker remains the field evidence source for retase.

Example:

> Checker: DT-TEST-001 recorded 4 rit at the relevant period.

The system then resolves:

> Retase = 4  
> Payload = 25 ton  
> Quantity = 100 ton

This means the system does **not** ask the checker to produce a Quantity value and does not require the operator to enter Quantity separately.

If a future field record differs from the calculated result, the difference should be treated as an **exception/variance requiring explanation**, rather than allowing an uncontrolled overwrite of the calculated Quantity.

Variance handling is outside the current V38 scope.

## 9. Activity Rule

The Retase × Payload rule applies specifically to:

**Dump Truck + Hauling**

It is not a global rule for every Operation activity.

| Condition | Retase | Quantity |
|---|---|---|
| Dump Truck + Hauling | From checker | Auto = Retase × Payload |
| Dump Truck + non-Hauling | Not forced | Follows activity rule |
| Excavator | Not implemented yet | Not implemented yet |

## 10. Future Excavator Extension

Excavator will be handled later as a separate design decision.

The V38 Dump Truck contract must not assume that Excavator production uses the same measurement model.

## 11. Acceptance Criteria

1. Selecting a Dump Truck resolves its configured Payload.
2. Hauling allows Retase to be entered from the checker record.
3. Payload is not manually re-entered for each hauling transaction.
4. Quantity is calculated automatically as **Retase × Payload**.
5. Quantity does not require duplicate manual input.
6. Work Timeline displays Retase and Quantity together.
7. Actual Hours remains an independent operational field.
8. The rule does not change Excavator logic or introduce distance/cycle-time calculations.
9. The design preserves checker evidence as the source of actual Retase.

## 12. Design Decision

**V38 decision:**

> For Dump Truck Hauling, **Retase is the actual field observation, Payload is the equipment configuration, and Quantity is the system-calculated result of Retase × Payload.**

This contract is the baseline for the next implementation step in V38.
