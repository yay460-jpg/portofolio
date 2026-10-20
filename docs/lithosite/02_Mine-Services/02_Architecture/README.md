# Mine Services — Architecture

## Architecture Position

Mine Services is an independent Lithosite module.

```text
Lithosite
    │
    ├── Mine Geologist
    │
    └── Mine Services
          │
          ├── Master Data
          ├── Operational Transactions
          ├── Validation
          ├── KPI Engine
          ├── Reporting
          └── Audit
```

## Domain Boundary

Mine Services owns mine-service operational data and workflows.

It does not own:

- geological interpretation
- grade-control internals
- Mine Geologist private modules
- Mine Geologist Member App internals
- Engine V2 implementation details

## Data Flow

```text
Master
  ↓
Transaction
  ↓
Validation
  ↓
Derived KPI
  ↓
Report
  ↓
Audit
```

Derived values must retain a traceable relationship to their source records.

## Future Shared Contracts

Potential cross-module contracts are candidates only.

No Mine Geologist internal object becomes a Mine Services dependency merely because it is convenient to reuse.

## Architecture Gate

Before Stage 2 implementation, the Stage 1 entities and ownership must be stable enough to support transactional design without repeated schema patching.
