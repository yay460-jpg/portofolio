# Lithosite — Repository Migration Map

## Purpose

Dokumen ini mendefinisikan migrasi repository Lithosite secara bertahap setelah canonical runtime berhasil diperkenalkan.

Migrasi ini menjaga:

- runtime Mine Geologist;
- canonical Lithosite runtime;
- PWA identity dan scope;
- Service Worker boundary;
- Member App;
- Map Engine;
- Topo3D;
- Engine V2;
- established technical documentation;
- rollback compatibility.

Dokumen ini tidak mengubah runtime contract.

## Current Repository Position

Repository saat ini:

```text
portofolio/
├── lithosite/          # canonical production runtime
├── docs/
│   └── lithosite/      # canonical product documentation
├── mine-geologist/     # compatibility / rollback runtime
└── portfolio.html
```

Canonical production runtime sekarang berada di:

`lithosite/`

Runtime lama:

`mine-geologist/`

tetap dipertahankan sebagai compatibility / rollback runtime.

Canonical Product documentation Group A sekarang berada di:

`docs/lithosite/00_Product/`

## Migration Status

| Phase | Status |
|---|---|
| Runtime rename rehearsal | PASS |
| Canonical `lithosite/` creation | PASS |
| PWA identity migration | PASS in migration branch |
| Service Worker coexistence rehearsal | PASS locally |
| Promotion to `main` | PASS |
| Old runtime preservation | PASS |
| Documentation normalization design | PASS |
| Documentation Link & Reference Audit | PASS |
| **Group A Product Documentation migration** | **PASS** |
| Group B Mine Services documentation | PASS |
| Group C Mine Geologist / Android documentation | NOT YET |
| Old runtime retirement | NOT YET |

## Locked Runtime Principles

1. `lithosite/` is the canonical runtime path.
2. `mine-geologist/` remains available for compatibility and rollback.
3. No runtime folder is moved merely for visual cleanup.
4. No Engine V2 contract is changed by documentation normalization.
5. No Member App runtime behavior is changed by documentation normalization.
6. `shared/` remains inside the runtime until actual cross-module ownership is proven.
7. Historical documentation is preserved.
8. Current global/product documentation must not depend on runtime documentation paths.
9. Version-specific history remains historical.
10. Every physical documentation move requires link verification and rollback.

## Canonical Runtime Boundary

The protected runtime tree is:

```text
lithosite/
├── assets/
├── member-app/
├── modules/
├── scripts/
├── shared/
├── style/
├── index.html
├── manifest.json
└── sw.js
```

These paths are treated as runtime contracts.

## Compatibility Runtime

`mine-geologist/` remains a complete compatibility runtime.

It is not the canonical location for new feature development.

It must remain intact until the production deployment and rollback retirement gates are explicitly passed.

The compatibility runtime is therefore a deliberate transition mechanism, not an accidental duplicate.

## Documentation Normalization

The canonical documentation boundary is:

```text
docs/
└── lithosite/
    ├── 00_Product/
    ├── 01_Mine-Geologist/
    ├── 02_Mine-Services/
    ├── 03_Mine-Plan/
    └── 04_Mine-Pit-Control/
```

Group A is now physically implemented at `docs/lithosite/00_Product/`.

Remaining documentation under `lithosite/` is transition-state documentation awaiting its own controlled migration gate.

## Mine Geologist Documentation

Established Android/MG1 documentation currently contains:

- baseline contracts;
- Engine V2;
- architecture;
- security evolution;
- performance;
- UI/Topography;
- issue/fix records;
- version history;
- guides;
- archive.

Its technical authority remains unchanged.

A future move to:

`docs/lithosite/01_Mine-Geologist/Android/`

is a documentation relocation only.

It must not alter technical content or runtime behavior.

## Mine Services

Mine Services remains an independent Lithosite module.

Current baseline:

```text
Stage 1 — Data Model
        ↓
Stage 2 — Operational Transactions
        ↓
Stage 3 — Fleet & Maintenance
        ↓
Stage 4 — Planning & Budget
        ↓
Stage 5 — K3 & Environment
        ↓
Stage 6 — Reporting & Audit
        ↓
Stage 7 — Security Evolution
        ↓
Stage 8 — Final Baseline
```

Mine Services must not depend on private Mine Geologist implementation.

## Shared Runtime Rule

A component becomes Lithosite-global only when:

- multiple product modules actually consume it;
- the public contract is independently defined;
- ownership is clear;
- lifecycle is documented;
- security implications are audited;
- migration can be verified independently.

Until then, existing runtime shared components remain where they are.

## Documentation Migration Sequence

### Group A — Product

```text
lithosite/00_Product/
        ↓
docs/lithosite/00_Product/
```

**PASS / COMPLETE**

### Group B — Mine Services

```text
lithosite/02_Mine-Services/
        ↓
docs/lithosite/02_Mine-Services/
```

**PASS / COMPLETE**

### Group C — Mine Geologist / Android

```text
lithosite/Lithosite Android/
        ↓
docs/lithosite/01_Mine-Geologist/Android/
```

### Group D — Compatibility Cleanup

Only after Groups A-C pass:

- remove duplicate documentation;
- reconcile old README links;
- verify no runtime references documentation;
- retain exactly one authoritative copy.

## Runtime Safety Gate

Any future runtime relocation must verify:

1. GitHub Pages path;
2. manifest identity;
3. PWA scope;
4. Service Worker scope;
5. Service Worker cache namespace;
6. relative assets;
7. Member App paths;
8. external links;
9. installed PWA behavior;
10. offline shell;
11. Engine V2 regression;
12. rollback.

## Current Decision

The repository is intentionally in a controlled transition state:

```text
Canonical Lithosite Runtime
        +
Compatibility Mine Geologist Runtime
        +
Canonical Product Documentation
        +
Independent Mine Services
        +
Controlled Documentation Migration
```

The canonical runtime migration is complete at repository level.

Group A Product Documentation migration is complete.

The remaining structural work is Mine Services documentation migration, Mine Geologist Android documentation migration, and later controlled retirement of the compatibility runtime.

## Gate

**Runtime Migration: PASS**

**Canonical Runtime: PASS**

**Documentation Normalization Design: PASS**

**Group A Product Documentation Migration: PASS**

**Group B Physical Documentation Move: PASS**

**Group C Physical Documentation Move: NOT YET**

**Compatibility Runtime Retirement: NOT YET**
