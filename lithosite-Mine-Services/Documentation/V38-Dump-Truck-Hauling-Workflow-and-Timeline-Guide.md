# Lithosite Mine Services — V38 Dump Truck Hauling Workflow & Work Timeline Guide

**Status:** V38 Design / Implementation Guide  
**Scope:** Dump Truck (DT) — Hauling  
**Primary flow:** Work Front / Console → Global Capacity → Equipment → Operation → Work Timeline → Accumulated Progress → Reporting

---

## 1. Purpose

This guide explains the V38 Dump Truck Hauling workflow from the upstream operational configuration through the downstream Work Timeline and reporting result.

The guide is intentionally written as a **workflow guide**, while the V38 contract remains the authoritative rule for the data relationship and calculation.

The central principle is:

> **Checker provides the actual Retase. Global Capacity provides the operational capacity used for the transaction. Equipment identifies the fleet unit. Operation records the work. The system calculates Quantity.**

The intended business flow is:

**Work Front / Console → Global Capacity → Equipment → Checker Retase → Operation → Quantity → Work Timeline → Accumulated Progress → Report**

---

## 2. Business Context

In actual mine operations, a company may not want production reports to distinguish payload/capacity by Dump Truck brand.

For example, the company may operate Hino, Shacman, Fuso, or other 10-wheel Dump Trucks while applying one operational capacity rule:

- 10-wheel DT = 25 ton
- or 25.5 ton
- or 27.5 ton
- or 29 ton
- or 32 ton
- or 35.5 ton

The important point is that the value is a **company/site operational configuration**, not necessarily a technical specification tied to a particular brand.

Therefore V38 introduces a dedicated **Global Capacity** configuration.

Equipment remains a fleet-support master. It is not the source of truth for the operational capacity used by a hauling transaction.

---

## 3. Core Design Principle

V38 separates three different responsibilities:

| Component | Responsibility |
|---|---|
| Global Capacity | Defines the operational capacity value that may be applied |
| Equipment | Identifies and supports the fleet unit used by Operation |
| Operation | Records the actual work transaction and calculates Quantity |

The relationship is:

**Global Capacity → Console / Work Front → Equipment → Operation**

For the transaction calculation:

**Retase × Applied Capacity = Quantity**

This separation prevents fleet identity and operational production policy from being mixed together.

---

## 4. Global Capacity

### 4.1 Purpose

Global Capacity is a dedicated configuration list for operational capacity.

It must support **manual/free-value capacity entry**.

The system must not restrict the user to predefined values such as only 25, 30, or 35 ton.

Valid examples include:

- 25 ton
- 25.5 ton
- 27.5 ton
- 29 ton
- 32 ton
- 35.5 ton

The capacity value is expressed in **ton**.

### 4.2 Example Global Capacity List

| Capacity Profile | Capacity | Status |
|---|---:|---|
| 10 Wheel Standard | 25 ton | Active |
| 10 Wheel Heavy | 27.5 ton | Active |
| 12 Wheel Standard | 35.5 ton | Active |

These are examples only. The actual list is controlled by the company/site configuration.

### 4.3 Capacity Validation

The manual capacity value should:

1. Be numeric.
2. Be greater than zero.
3. Allow decimal values.
4. Use ton as the unit.
5. Reject non-numeric input.

There is no requirement that capacity must be an integer.

---

## 5. Work Front / Console

The Work Front / Console provides the operational context in which a capacity profile is used.

The Console does not redefine the fleet identity.

Conceptually:

**Work Front / Console → selects or applies Global Capacity**

Example:

| Work Front / Console | Capacity Profile | Applied Capacity |
|---|---|---:|
| Pit A — Hauling | 10 Wheel Heavy | 27.5 ton |
| Pit B — Hauling | 10 Wheel Standard | 25 ton |

This allows the operational policy to be changed without editing every Equipment record.

---

## 6. Equipment

Equipment remains a supporting fleet master for Operation.

Typical information may include:

- Equipment ID
- Unit number
- Equipment type
- Brand
- Fleet identity
- Other fleet attributes required by the application

Examples:

| Equipment | Brand | Type |
|---|---|---|
| DT-001 | Hino | Dump Truck |
| DT-002 | Shacman | Dump Truck |
| DT-003 | Fuso | Dump Truck |

### Important rule

Equipment does **not** become the source of truth for the operational hauling capacity.

The system must not assume:

> Hino = 25 ton  
> Shacman = 25 ton  
> Fuso = 25 ton

unless the company explicitly configures such a rule elsewhere.

The operational capacity comes from the Global Capacity / Console configuration.

Equipment answers:

> **Which fleet unit performed the work?**

Global Capacity answers:

> **What operational capacity is used for this production calculation?**

---

## 7. Checker and Retase

The field checker remains the source of actual Retase.

For a Dump Truck hauling transaction, the checker records the observed number of trips/ritase.

Example:

> DT-001 performed 4 rit during the relevant operational period.

Therefore:

**Retase = 4 rit**

The system must not infer Retase from Actual Hours.

For example:

> Actual Hours = 4 hours

does not mean:

> Retase = 4

Actual Hours and Retase are independent operational facts.

---

## 8. Add Operation — Step by Step

### Step 1 — Select Equipment

The operator selects the Dump Truck used for the operation.

Example:

> DT-001 — Hino

The Equipment record identifies the fleet unit.

### Step 2 — Select Activity

Select:

> **Hauling**

The Retase × Capacity rule applies specifically to Dump Truck + Hauling.

### Step 3 — Resolve Global Capacity

The system uses the applicable Work Front / Console configuration.

Example:

> Console Capacity = 27.5 ton

The operator should not have to retype the capacity in every transaction.

### Step 4 — Enter Checker Retase

The actual checker result is entered:

> Retase = 4 rit

### Step 5 — System Calculates Quantity

The system automatically calculates:

**Quantity = Retase × Applied Capacity**

Therefore:

**4 × 27.5 = 110 ton**

### Step 6 — Save Operation

The transaction stores the operational result, including the capacity applied to that transaction.

The transaction should preserve the capacity value used at creation so later configuration changes do not rewrite historical production.

---

## 9. Complete Example

### Configuration

Global Capacity:

> 10 Wheel Heavy = **27.5 ton**

Work Front / Console:

> Pit A — Hauling → 10 Wheel Heavy

Equipment:

> DT-001 — Hino

### Checker

> Retase = 4 rit

### Operation

| Field | Value |
|---|---|
| Equipment | DT-001 |
| Activity | Hauling |
| Retase | 4 rit |
| Applied Capacity | 27.5 ton |
| Quantity | Auto |
| Actual Hours | 4 |
| Unit | ton |

### Calculation

**Quantity = 4 × 27.5**

**Quantity = 110 ton**

The operator does not manually enter 110 ton.

---

## 10. Work Timeline

After the Operation is recorded, the Work Timeline should show the relationship between observed Retase, applied capacity, and calculated Quantity.

Example:

| Time | Equipment | Activity | Retase | Capacity | Quantity | Actual Hrs |
|---|---|---|---:|---:|---:|---:|
| 06:00 | DT-001 | Hauling | 4 | 27.5 ton | 110 ton | 4 |

The Timeline is therefore not merely a list of hours. It is the operational transaction context containing the observed and calculated production values.

The key relationship remains visible:

**4 rit × 27.5 ton = 110 ton**

---

## 11. Multiple Operations and Accumulated Progress

The same calculation is performed for each hauling transaction.

Example:

| Equipment | Retase | Capacity | Quantity |
|---|---:|---:|---:|
| DT-001 | 4 | 27.5 ton | 110 ton |
| DT-002 | 3 | 27.5 ton | 82.5 ton |
| DT-003 | 5 | 27.5 ton | 137.5 ton |

Accumulated quantity:

**110 + 82.5 + 137.5 = 330 ton**

Therefore the operational progress for these transactions is:

> **330 ton**

The accumulation is based on the calculated transaction Quantity, not on manually entered duplicate production values.

---

## 12. Capacity Change and Historical Integrity

Global Capacity may change over time.

Example:

### Previous configuration

> 10 Wheel Heavy = 27.5 ton

Transaction:

> 4 rit × 27.5 ton = **110 ton**

Later the company changes the configuration:

> 10 Wheel Heavy = 30 ton

A new transaction with 4 rit becomes:

> 4 rit × 30 ton = **120 ton**

The previous transaction must remain:

> **110 ton**

It must not be recalculated to 120 ton merely because the current Global Capacity has changed.

Therefore the transaction should preserve the **Applied Capacity snapshot** used when the Operation was recorded.

This principle is required for historical Work Timeline and reporting integrity.

---

## 13. Why Equipment Remains Separate

The separation provides operational flexibility.

A company can use:

| Equipment | Brand | Console Capacity |
|---|---|---:|
| DT-001 | Hino | 27.5 ton |
| DT-002 | Shacman | 27.5 ton |
| DT-003 | Fuso | 27.5 ton |

The system does not need to maintain three independent payload rules simply because the brands differ.

If company policy changes:

> Console Capacity = 30 ton

new transactions use 30 ton without changing the identity or master record of DT-001, DT-002, or DT-003.

---

## 14. Non-Hauling Activities

The Retase × Capacity calculation is not a global rule for every activity.

For example:

- Hauling
- Standby
- Waiting
- Maintenance
- Other operational activities

must follow their own activity rules.

For:

**Dump Truck + Hauling**

the V38 rule is:

> Retase from checker → Applied Capacity → Quantity calculation

For:

**Dump Truck + non-Hauling**

the hauling calculation is not forced.

---

## 15. Actual Hours

Actual Hours remains an independent operational field.

Example:

| Field | Value |
|---|---:|
| Retase | 4 rit |
| Applied Capacity | 27.5 ton |
| Quantity | 110 ton |
| Actual Hours | 4 hr |

Actual Hours does not calculate Retase.

V38 does not introduce:

- automatic retase inference from hours
- cycle-time calculation
- distance-based production
- road factor calculation
- loading/dumping time calculation

Those are separate future design topics.

---

## 16. Checker Evidence and System Calculation

The source chain is:

**Checker Evidence → Retase**

then:

**Global Capacity / Console → Applied Capacity**

then:

**Retase × Applied Capacity → Quantity**

This creates a clear distinction between:

- observed field information
- operational configuration
- system-derived result

The system should not ask the checker to manually provide Quantity if Quantity can be calculated from the authoritative Retase and Applied Capacity.

If a future field record conflicts with a calculated result, it should be treated as an exception/variance requiring explanation rather than an uncontrolled overwrite.

Variance workflow is outside this V38 implementation scope.

---

## 17. Downstream Reporting

The Work Timeline is the transaction-level operational layer.

The calculated Quantity can then contribute to accumulated operational progress and the formal reporting flow.

Conceptually:

**Operation**

→ **Work Timeline**

→ **Accumulated Quantity / Progress**

→ **Daily Reporting**

→ **Weekly Reporting**

→ **Monthly Reporting**

The report layer consumes the operational result; it should not create a second independent Quantity calculation.

This preserves one calculation source and avoids conflicting production totals.

---

## 18. End-to-End Timeline Guide

### Phase A — Configuration

1. Open the relevant Work Front / Console configuration.
2. Identify the applicable Global Capacity profile.
3. Set the capacity manually, for example **27.5 ton**.
4. Ensure the capacity is active and valid.

### Phase B — Fleet Support

5. Ensure the required Dump Truck exists in Equipment.
6. Confirm the Equipment identity and fleet information.
7. Do not re-enter operational payload into the Equipment transaction.

### Phase C — Field Observation

8. Checker observes the actual hauling activity.
9. Checker records the actual Retase.
10. The checker record remains the evidence source.

### Phase D — Operation

11. Create Add Operation.
12. Select the Dump Truck.
13. Select **Hauling**.
14. Resolve the applicable Console / Global Capacity.
15. Enter the actual Retase from the checker.
16. Record Actual Hours and other operational fields as applicable.
17. System calculates Quantity automatically.

### Phase E — Timeline

18. Save the Operation.
19. Work Timeline displays Equipment, Activity, Retase, Applied Capacity, Quantity, and relevant time information.
20. The transaction becomes part of accumulated progress.

### Phase F — Reporting

21. Accumulate valid transaction Quantity.
22. Feed the operational result into the existing reporting flow.
23. Daily, Weekly, and Monthly reporting use the operational result without creating a second Quantity calculation.

---

## 19. Worked Example — Full Day

Assume:

**Global Capacity = 27.5 ton**

Three hauling transactions are recorded:

| Time | Equipment | Retase | Capacity | Quantity |
|---|---|---:|---:|---:|
| 06:00 | DT-001 Hino | 4 | 27.5 | 110 |
| 10:00 | DT-002 Shacman | 3 | 27.5 | 82.5 |
| 14:00 | DT-003 Fuso | 5 | 27.5 | 137.5 |

Daily accumulated quantity:

**110 + 82.5 + 137.5 = 330 ton**

Daily operational result:

> **330 ton**

The calculation does not depend on whether the unit is Hino, Shacman, or Fuso. The fleet identity remains visible, while the configured operational capacity controls the production calculation.

---

## 20. Worked Example — Decimal Capacity Change

### Day 1

Global Capacity:

> 25.5 ton

Retase:

> 4 rit

Quantity:

**4 × 25.5 = 102 ton**

### Day 2

Global Capacity is changed to:

> 29 ton

Retase:

> 4 rit

Quantity:

**4 × 29 = 116 ton**

Day 1 remains:

> **102 ton**

Day 2 becomes:

> **116 ton**

The historical Day 1 transaction is not recalculated.

---

## 21. Data Responsibility Matrix

| Data | Owner / Source | Role |
|---|---|---|
| Global Capacity | Work Front / Console configuration | Operational capacity policy |
| Equipment | Equipment master | Fleet identity/support |
| Retase | Checker / field observation | Actual operational observation |
| Applied Capacity | Operation snapshot | Capacity used by transaction |
| Quantity | System calculation | Derived production result |
| Actual Hours | Operation | Operational duration |
| Work Timeline | Operation layer | Transaction context |
| Daily/Weekly/Monthly Report | Reporting layer | Formal reporting output |

---

## 22. Rules That Must Not Be Violated

1. Equipment must remain a supporting fleet master.
2. Equipment brand must not automatically determine operational capacity.
3. Global Capacity must support manually entered decimal values.
4. Retase must come from actual checker observation.
5. Actual Hours must not be used to infer Retase.
6. Quantity must be calculated automatically for DT + Hauling.
7. Quantity must not be duplicated as a manual input.
8. Applied Capacity must be preserved with the transaction for historical integrity.
9. A change to current Global Capacity must not rewrite historical transactions.
10. The hauling rule must not be forced onto non-hauling activities.
11. Excavator logic is outside this V38 design.
12. Distance, cycle time, loading/dumping time, and road/transport factors remain outside this V38 scope.

---

## 23. Acceptance Criteria

### Global Capacity

- [ ] A dedicated Global Capacity configuration exists.
- [ ] Capacity can be entered manually.
- [ ] Decimal values are accepted.
- [ ] Capacity must be greater than zero.
- [ ] Unit is ton.
- [ ] The configuration can be activated/deactivated according to the application rule.

### Work Front / Console

- [ ] Console can use an applicable Global Capacity profile.
- [ ] Capacity is resolved from the operational context.
- [ ] User does not need to retype capacity for every transaction.

### Equipment

- [ ] Equipment remains available as fleet master/support data.
- [ ] Equipment identity is independent of Global Capacity.
- [ ] Brand does not automatically define payload.

### Operation

- [ ] DT + Hauling accepts checker Retase.
- [ ] Applied Capacity is resolved automatically.
- [ ] Quantity is calculated as Retase × Applied Capacity.
- [ ] Quantity is not manually duplicated.
- [ ] Actual Hours remains independent.
- [ ] Applied Capacity is preserved in the transaction.

### Work Timeline

- [ ] Equipment is visible.
- [ ] Activity is visible.
- [ ] Retase is visible.
- [ ] Applied Capacity is visible.
- [ ] Quantity is visible.
- [ ] Time/Actual Hours remain available as applicable.

### Reporting

- [ ] Transaction Quantity can accumulate into operational progress.
- [ ] Existing reporting flow consumes the operational result.
- [ ] Historical results do not change when current capacity configuration changes.

---

## 24. V38 Final Design Decision

For Dump Truck Hauling:

> **Global Capacity is the configurable operational capacity. Equipment is the fleet-support master. Retase is the actual field observation from the checker. Applied Capacity is captured in the Operation transaction. Quantity is calculated automatically as Retase × Applied Capacity. Work Timeline displays the observed and calculated values together, and the resulting Quantity can flow into accumulated progress and formal reporting without creating a second independent calculation source.**

This guide defines the intended V38 workflow from configuration through reporting and should be used together with:

- [V38 Dump Truck Retase & Quantity Contract](../Contracts/V38-Dump-Truck-Retase-Quantity-Contract.md)
- the existing V38 Report System and Output contracts

The implementation phase follows this guide; UI/runtime changes must remain contract-compliant with the workflow defined above.
