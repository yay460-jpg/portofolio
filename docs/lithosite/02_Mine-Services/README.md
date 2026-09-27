# Mine Services

Mine Services is an independent Lithosite product module for mine-service operational control.

## Current Stage

**Stage 1 — Data Model foundation**

The module is intentionally separated from the existing Mine Geologist runtime.

## Domain Scope

Initial domain areas:

- Daily Operations
- Equipment Master
- Work Front Master
- Road & Hauling
- Drainage & Dewatering
- Land Clearing
- Disposal & Stockpile
- Reclamation
- Planning & Budget
- KPI & Reporting
- K3 & Environment

## Source-of-Truth Contract

```text
Master Data
    ↓
Operational Transactions
    ↓
Validation
    ↓
KPI Calculation
    ↓
Reporting
    ↓
Audit
```

The UI/dashboard is a presentation layer and must not become the source of truth.

## Development Stages

1. Stage 1 — Data Model
2. Stage 2 — Operational Transactions
3. Stage 3 — Fleet & Maintenance Engine
4. Stage 4 — Planning & Budget
5. Stage 5 — K3 & Environment
6. Stage 6 — Reporting & Audit
7. Stage 7 — Security Evolution
8. Stage 8 — Final Baseline

## Boundary Rule

Mine Services does not depend directly on private Mine Geologist modules, Engine V2 internals, or Member App internals.

Any future cross-module dependency must use an approved Lithosite contract.
