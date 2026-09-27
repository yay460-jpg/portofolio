# Lithosite Product Architecture

## Product Identity

Lithosite is organized as a multi-module mining software product.

The product boundary is above individual runtime implementations.

```text
Lithosite
├── Mine Geologist
├── Mine Services
├── Mine Plan
└── Mine Pit Control
```

## Architectural Layers

```text
Product
  ↓
Module
  ↓
Runtime
  ↓
Domain Engine
  ↓
Persistence / External Services
```

A module owns its domain behavior. Shared infrastructure is introduced only when its ownership and contract are established.

## Existing Mine Geologist Runtime

The current Mine Geologist runtime remains under:

`mine-geologist/`

It is treated as an established runtime boundary.

Repository restructuring must not silently change its deployment path or runtime contracts.

## Mine Services

Mine Services is an independent module.

Its domain includes operational planning and control such as:

- daily operations
- equipment master
- work front master
- road and hauling
- drainage and dewatering
- land clearing
- disposal and stockpile
- reclamation
- planning and budget
- KPI and reporting
- K3 and environment

Its data flow follows:

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

## Dependency Rule

A module may consume another module's public contract, but should not depend on another module's private implementation.

## Structural Stability

Existing locked or production-sensitive runtime components are changed only through an explicit migration process.

