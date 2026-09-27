# Lithosite Module Map

## Module Overview

| Module | Current State | Primary Responsibility |
|---|---|---|
| Mine Geologist | Mature / existing runtime | Geological data, grade control, mapping, geological workflows |
| Mine Services | Stage 1 Data Model | Mine service operations, fleet, infrastructure, planning, KPI and HSE |
| Mine Plan | Planned | Mine planning and scheduling domain |
| Mine Pit Control | Planned | Pit-level operational control and reconciliation |

## Mine Geologist

Current runtime location:

`mine-geologist/`

Important runtime areas include:

- dashboard
- Member Android
- map runtime
- Engine V2
- Topo3D
- Map Library
- geological feature modules

Internal runtime structure is preserved during the current product-layer migration.

## Mine Services

Mine Services is developed independently from Mine Geologist.

Current development baseline:

```text
Stage 1
Data Model
  ↓
Stage 2
Operational Transactions
  ↓
Stage 3
Fleet & Maintenance Engine
  ↓
Stage 4
Planning & Budget
  ↓
Stage 5
K3 & Environment
  ↓
Stage 6
Reporting & Audit
  ↓
Stage 7
Security Evolution
  ↓
Stage 8
Final Baseline
```

## Mine Plan

Planned module.

No runtime dependency should be introduced before its domain boundary is defined.

## Mine Pit Control

Planned module.

Its boundary should be defined independently from Mine Services and Mine Geologist before implementation.

## Shared Capabilities

Potential shared capabilities may include:

- identity and authorization
- audit infrastructure
- common geospatial primitives
- common UI conventions
- shared file/package handling

These are candidates only. They become product-level shared infrastructure after dependency and ownership audits.

