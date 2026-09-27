# Lithosite Layer and Boundary Map

## Purpose

Dokumen ini menetapkan boundary konseptual Lithosite sebelum dilakukan reorganisasi fisik repository.

Dokumen ini tidak memindahkan file dan tidak mengubah runtime contract.

## Product Boundary

Lithosite adalah product container:

```text
Lithosite
├── Mine Geologist
├── Mine Services
├── Mine Plan
└── Mine Pit Control
```

Setiap module memiliki domain ownership sendiri.

## Layer Model

Target konseptual:

```text
┌──────────────────────────────────────┐
│ Product / Governance                 │
│ Architecture · Security · Baseline   │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ Module Layer                         │
│ Mine Geologist · Mine Services       │
│ Mine Plan · Mine Pit Control         │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ Application / Runtime                │
│ Dashboard · Member App · UI          │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ Runtime Core / Engine                │
│ Map · Geo · Topo3D · Engine V2       │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ Persistence / External Services       │
│ Backend · Storage · External APIs    │
└──────────────────────────────────────┘
```

The diagram is a dependency-direction model, not a proposed immediate folder move.

## Module Ownership

### Mine Geologist

Current mature runtime and established contracts.

Ownership includes the existing:

- dashboard;
- Member App;
- map runtime;
- Engine V2;
- Topo3D;
- Map Library;
- geological feature modules;
- associated Service Workers and PWA contracts.

Its locked/pass components remain protected from structural refactoring.

### Mine Services

Independent module.

Current baseline is Stage 1 Data Model.

Its future domain chain is:

```text
Master Data
  ↓
Operational Transactions
  ↓
Validation
  ↓
KPI
  ↓
Reporting
  ↓
Audit
  ↓
Security Evolution
```

Mine Services must not depend on private Mine Geologist implementation.

### Mine Plan

Planned independent module.

No implementation dependency is approved before its domain boundary is defined.

### Mine Pit Control

Planned independent module.

Its boundary must be defined independently from Mine Services and Mine Geologist.

## Runtime Ownership

The canonical runtime currently resides under:

```text
lithosite/
├── index.html
├── manifest.json
├── sw.js
├── assets/
├── scripts/
├── modules/
├── member-app/
├── shared/
└── style/
```

This runtime tree is currently protected from structural movement.

## Documentation Ownership

Current documentation exists in more than one established area:

```text
lithosite/00_Product/
lithosite/02_Mine-Services/
lithosite/Lithosite Android/
```

These are not yet equivalent documentation layers.

### Product documentation

Owns:

- product identity;
- module map;
- architecture;
- repository governance;
- security evolution at product level;
- migration gates.

### Mine Services documentation

Owns the Mine Services lifecycle and its module-specific baseline.

### Lithosite Android documentation

Owns the established Android / MG1 technical baseline, Engine V2 contracts, issues, guides, and version history.

It must remain authoritative for its locked technical domain until an explicit documentation consolidation is approved.

## Shared Runtime Promotion Rule

A runtime component may become Lithosite-global only when all are true:

1. at least two product modules actually consume it;
2. the public contract is defined independently;
3. ownership is explicit;
4. lifecycle behavior is documented;
5. security impact is audited;
6. migration can be performed without breaking an existing runtime.

Directory names alone are never sufficient evidence.

## Dependency Direction

Allowed conceptual direction:

```text
Product governance
        ↓
Module contract
        ↓
Application / Runtime
        ↓
Approved shared runtime
        ↓
Persistence / External service
```

Forbidden direction:

```text
Mine Services
      ↓
Mine Geologist private implementation
```

Also forbidden:

```text
Runtime code
      ↓
Product documentation
```

## Structural Reorganization Rule

Physical movement may occur only after:

```text
Audit
 ↓
Boundary Map
 ↓
Ownership Map
 ↓
Dependency Map
 ↓
Target Tree
 ↓
Migration Matrix
 ↓
Rehearsal
 ↓
Runtime Verification
 ↓
Review
 ↓
Merge
```

## Current Decision

The architecture is intentionally in a **hybrid transition state**:

- `lithosite/` is the canonical runtime;
- `mine-geologist/` is retained as compatibility / rollback runtime;
- product documentation is present but not yet physically separated from runtime;
- Mine Services is independent at the product/documentation level;
- existing technical documentation remains authoritative for the locked Mine Geologist/Android domain.

This transition state is allowed until the normalization gate is completed.

## Current Gate

**Layer and Boundary Definition: PASS**

**Target physical tree: DESIGN ONLY**

**Physical move: NOT YET APPROVED**
