# Lithosite — Repository Migration Map

## Purpose

This document defines the controlled migration path from the current repository layout to a product-level Lithosite structure.

The migration is designed to preserve the existing Mine Geologist runtime, production paths, Service Worker behavior, Member Android application, Map Engine, Topo3D runtime, and established documentation baseline.

This is a structural migration document. It does not redefine current runtime contracts.

## Current Repository Position

The current repository is:

`yay460-jpg/portofolio`

The existing application runtime is located under:

`mine-geologist/`

Although the directory name is Mine Geologist, the directory already contains Lithosite-branded runtime components, Member Android, Map Engine, Topo3D, assets, and Lithosite Android documentation.

Therefore, `mine-geologist/` is treated as an existing runtime container, not as a directory that should be renamed immediately.

## Locked Migration Principles

1. Do not rename `mine-geologist/` during this migration phase.
2. Do not move the current Mine Geologist runtime files merely for naming consistency.
3. Do not change production URLs unless a separate migration plan explicitly covers redirects, PWA identity, Service Worker scope, cache migration, and deployment verification.
4. Do not modify Engine V2 contracts as part of repository restructuring.
5. Do not modify Member Android runtime behavior as part of repository restructuring.
6. Do not move `shared/` components into a global location until their actual dependency ownership is verified.
7. Do not rewrite historical documentation.
8. Global product documentation must not use version numbers in filenames.
9. Version-specific documentation remains under the appropriate version-history/baseline structure.
10. Structural changes must be introduced through a dedicated branch and reviewed before merging to `main`.

## Current Runtime Classification

| Path | Classification | Migration Action |
|---|---|---|
| `mine-geologist/index.html` | Mine Geologist runtime entry | Keep in place |
| `mine-geologist/scripts/` | Mine Geologist runtime | Keep in place |
| `mine-geologist/modules/` | Mine Geologist feature modules | Keep in place |
| `mine-geologist/member-app/` | Member Android runtime | Keep in place |
| `mine-geologist/shared/geo-engine.js` | Geospatial runtime dependency | Keep in place; ownership review later |
| `mine-geologist/shared/topo3d/` | Topo3D runtime dependency | Keep in place; ownership review later |
| `mine-geologist/assets/` | Existing application assets | Keep in place |
| `mine-geologist/style/` | Existing runtime styles | Keep in place |
| `mine-geologist/Lithosite Android/` | Existing technical documentation | Keep in place |
| `portfolio.html` | Portfolio presentation layer | Keep separate from Lithosite runtime |

## Product Layer Target

A product-level Lithosite documentation layer may be introduced without moving the existing runtime:

```text
portofolio/
├── portfolio.html
├── mine-geologist/                 # Existing runtime; initially preserved
│   ├── index.html
│   ├── scripts/
│   ├── modules/
│   ├── member-app/
│   ├── shared/
│   ├── assets/
│   ├── style/
│   └── Lithosite Android/
│
└── lithosite/                      # Product-level architecture
    ├── README.md
    ├── 00_Product/
    │   ├── Product-Architecture.md
    │   ├── Module-Map.md
    │   ├── Product-Roadmap.md
    │   └── Security-Evolution.md
    ├── 01_Mine-Geologist/
    │   └── README.md
    ├── 02_Mine-Services/
    │   └── README.md
    ├── 03_Mine-Plan/
    │   └── README.md
    └── 04_Mine-Pit-Control/
        └── README.md
```

The target structure above is a product/documentation layer. It does not imply that the current runtime must immediately be relocated.

## Migration Phases

### Phase 0 — Freeze and Audit

Status: Active

- Preserve `main` as the current runtime baseline.
- Audit directory structure and runtime entry points.
- Identify production paths and PWA dependencies.
- Identify shared runtime dependencies.
- Do not change runtime files.

### Phase 1 — Product Architecture Layer

Status: Planned

Create the Lithosite product-level documentation structure.

Expected documents:

- `lithosite/README.md`
- `lithosite/00_Product/Product-Architecture.md`
- `lithosite/00_Product/Module-Map.md`
- `lithosite/00_Product/Product-Roadmap.md`
- `lithosite/00_Product/Security-Evolution.md`
- Module-level README files for Mine Geologist, Mine Services, Mine Plan, and Mine Pit Control.

This phase should not alter the existing Mine Geologist runtime.

### Phase 2 — Module Boundary Definition

Status: Planned

Define ownership boundaries:

- Mine Geologist
- Mine Services
- Mine Plan
- Mine Pit Control
- Product-level shared services

Dependency ownership must be based on source references, not directory names.

### Phase 3 — Mine Services Introduction

Status: Planned

Mine Services becomes an independent product module.

Its documentation and runtime must not be placed under Mine Geologist.

Mine Services Stage 1 Data Model remains the starting baseline.

### Phase 4 — Runtime Consolidation

Status: Future / Conditional

Only after dependency mapping and deployment verification may runtime directories be reconsidered.

Any future movement of `mine-geologist/` must explicitly verify:

- GitHub Pages URL
- `manifest.json`
- PWA `scope`
- PWA `id`
- Service Worker registration scope
- Service Worker cache names
- relative asset paths
- Member Android paths
- external links
- documentation links
- browser-installed PWA behavior
- offline behavior

No runtime relocation is approved by this map alone.

## Mine Geologist Boundary

Mine Geologist is treated as an existing mature module.

Its internal architecture is preserved.

The following remain inside the current runtime until a separately approved migration:

- Web dashboard
- Member Android
- Map Engine
- Engine V2
- Topo3D
- Map Library
- existing feature modules
- existing Service Workers
- existing assets required by runtime

The product layer references Mine Geologist without requiring an immediate internal rewrite.

## Mine Services Boundary

Mine Services is a separate product module.

Initial structure:

```text
02_Mine-Services/
├── README.md
├── 01_Baseline/
├── 02_Architecture/
├── 03_Operations/
├── 04_KPI/
├── 05_Planning/
├── 06_HSE/
├── 07_Reporting/
├── 08_Audit/
└── 09_Security-Evolution/
```

Its Stage 1 Data Model is the current starting point.

Mine Services must not modify Mine Geologist contracts simply to reuse existing naming or folders.

## Shared Runtime Rule

A component may be promoted to product-level shared infrastructure only when all of the following are established:

- more than one product module requires it;
- its API/contract can be defined independently;
- ownership is clear;
- lifecycle behavior is documented;
- security implications are documented;
- moving it does not break an existing runtime;
- migration can be verified independently.

Until those conditions are met, existing shared runtime files remain in their current location.

## Production Safety Gate

No structural change may be merged to `main` until these checks pass:

1. Main application loads.
2. Mine Geologist runtime loads.
3. Member Android loads.
4. Map runtime loads.
5. Map Library loads.
6. Topo3D loads where applicable.
7. Service Worker registers correctly.
8. Offline shell remains valid.
9. Manifest remains valid.
10. Relative assets resolve.
11. No broken script imports.
12. No broken documentation links caused by the migration.
13. Existing locked Engine V2 behavior remains unchanged.

## Change Ownership

Repository restructuring and product architecture are separate from feature development.

The following rule applies:

```text
Structure change
    ↓
Audit
    ↓
Migration Map
    ↓
Dedicated branch
    ↓
Path/dependency verification
    ↓
Runtime verification
    ↓
Review
    ↓
Merge to main
```

Feature development resumes only after the structural baseline is stable.

## Current Decision

The current approved structural position is:

```text
Existing Mine Geologist runtime
        +
Lithosite product architecture layer
        +
Independent Mine Services module
        +
Future Mine Plan module
        +
Future Mine Pit Control module
```

The current `mine-geologist/` runtime is therefore preserved while the product architecture grows above it.

## Next Step

Before moving or renaming any runtime directory, complete the Product Architecture Layer and Module Map.

After that, continue Mine Services from its Stage 1 Data Model toward Stage 2 Transactions without coupling it to the Mine Geologist runtime structure.
