# V34 — KPI Learning Scope & Engine Plan (V12)

## Scope

V34 KPI learning is currently focused on three layers:

1. PA — Physical Availability
2. UA — Utilization of Availability
3. EU — Effective Utilization

MTBF and MTTR remain **HOLD** and are not implemented at this stage.

## Learning Order

```
PA → UA → EU
```

The learning follows the conceptual time cascade:

```
Scheduled Time
      ↓
Available Time
      ↓
Used Time
      ↓
Effective Time
```

The priority is to understand the meaning and relationship of each KPI layer before implementing code or locking formulas.

## KPI Cascade

### PA

Conceptual learning formula:

```
PA = Available Time / Scheduled Time × 100%
```

PA asks how much of the scheduled time the equipment was Available.

### UA

Conceptual learning formula:

```
UA = Used Time / Available Time × 100%
```

UA asks how much of the Available Time the equipment was actually Used.

### EU

EU remains in conceptual learning.

The official denominator/formula is **not locked yet** and must follow the applicable company/site SOP before implementation.

Conceptually:

```
Used Time
    ↓
Effective Time
    ↓
EU
```

## Planned KPI Engine Structure

When implementation begins, each KPI will have its own JavaScript engine:

```
PA   → pa-engine.js
UA   → ua-engine.js
EU   → eu-engine.js

MTBF → HOLD
MTTR → HOLD
```

The exact repository location of these files will be decided when implementation starts.

## Modular Principles

- One engine is responsible for one KPI.
- KPI engines do not store raw operational data.
- KPI engines receive the required validated inputs and return KPI results.
- PA, UA, and EU remain separate modules even though they form a cascade.
- MTBF and MTTR engines must not be created until explicitly released from HOLD.

## Current V34 Status

- PA Concept — DONE
- UA Concept — DONE
- EU Concept — DONE / official formula still HOLD
- PA → UA → EU cascade — DONE
- Reports & KPI workspace — DONE
- Validated Timeline concept — DONE
- Event Schema implementation — HOLD
- PA Engine implementation — HOLD
- UA Engine implementation — HOLD
- EU Engine implementation — HOLD
- MTBF — HOLD
- MTTR — HOLD

## Important Boundary

The existence of separate JS engine files is an **implementation architecture decision**, not a request to create those files now.

For the current learning stage, continue with:

```
PA → UA → EU
```

and keep:

```
MTBF → HOLD
MTTR → HOLD
```
