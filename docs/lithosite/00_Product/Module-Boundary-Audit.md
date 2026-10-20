# Lithosite — Module Boundary Audit

## Status

**Module Boundary Audit = PASS**

This document defines the current ownership boundary between the existing Mine Geologist runtime and the future Lithosite modules.

The boundary is architectural. It does not relocate runtime files.

## Product Boundary

Lithosite is treated as the product layer:

```text
Lithosite
├── Mine Geologist
├── Mine Services
├── Mine Plan
└── Mine Pit Control
```

The current repository still contains the mature Mine Geologist runtime under:

`mine-geologist/`

The new:

`lithosite/`

directory is the product architecture/documentation layer and is not yet a runtime root.

---

## 1. Mine Geologist

### Ownership

Mine Geologist owns the existing geologist operational application and its current runtime.

Primary boundary:

```text
mine-geologist/
├── index.html
├── manifest.json
├── sw.js
├── scripts/
├── modules/
├── member-app/
├── shared/
├── assets/
└── style/
```

### Decision

**LOCKED**

No broad refactor is required merely to establish Lithosite as the product name.

---

## 2. Mine Geologist Dashboard

The root dashboard owns:

- dashboard UI
- authentication flow
- data loading
- KPI visualization
- validation
- reconciliation
- barging
- digging
- member management
- issue management
- settings
- dashboard PWA lifecycle

Current code boundary:

```text
mine-geologist/
├── index.html
├── scripts/
└── modules/
```

### Decision

**Mine Geologist internal runtime boundary remains unchanged.**

---

## 3. Mine Geologist Member App

The Member App is a distinct application surface under Mine Geologist:

```text
mine-geologist/member-app/
```

It has its own:

- application entry point
- manifest
- Service Worker
- configuration
- authentication
- KPI
- digging
- validation
- map runtime
- chat
- issue handling
- settings
- developer controls

### Decision

**LOCKED as a distinct runtime boundary.**

It is not a separate Lithosite product module.

It is currently a Mine Geologist application surface.

---

## 4. Map Engine

The map runtime belongs to the current Mine Geologist Member App.

Current boundary:

```text
mine-geologist/member-app/scripts/map/
```

Observed responsibilities include:

- map state
- device profile
- coordinates
- package handling
- recovery
- tile pyramid
- tile security
- tile storage
- tile queue
- runtime tile creation
- background lifecycle
- upload/save lifecycle
- surface lifecycle
- interaction
- UI
- topography
- library lifecycle
- storage capability
- package transfer
- cleanup and lifecycle completion

### Decision

**KEEP inside Mine Geologist Member App.**

Do not promote Engine V2 to Lithosite-global infrastructure at this stage.

Engine V2 is a specialized geospatial runtime with existing lifecycle and performance contracts.

---

## 5. Topo3D

Current boundary:

`mine-geologist/shared/topo3d/topo3d-engine.js`

The engine is UI-independent and currently reusable by the Member App and intended future Master usage.

### Decision

**Current ownership: Mine Geologist shared runtime.**

Future promotion to Lithosite Core requires:

1. at least one confirmed consumer outside Mine Geologist;
2. dependency audit;
3. API contract definition;
4. lifecycle/security review;
5. regression verification.

Until those conditions are met, the engine stays where it is.

---

## 6. Geo Engine

Current boundary:

`mine-geologist/shared/geo-engine.js`

Responsibilities include:

- inverse UTM
- grid convergence
- bearing
- distance

The current source deliberately removes Android-specific global dependencies and exposes explicit inputs.

### Decision

**Current ownership: Mine Geologist shared runtime.**

Future Lithosite Core promotion is possible, but not yet approved.

---

## 7. Assets

Current boundary:

`mine-geologist/assets/`

The directory is used by both the dashboard and Member App through relative paths.

It contains:

- Lithosite branding
- application icons
- PWA icons
- other runtime assets

### Decision

**KEEP as current runtime asset boundary.**

Do not duplicate the asset library into `lithosite/assets/` merely for naming consistency.

---

## 8. Mine Services

Mine Services is a separate Lithosite product module.

It must not be inserted into:

```text
mine-geologist/modules/
mine-geologist/member-app/
mine-geologist/scripts/
```

### Target product boundary

```text
lithosite/
└── 02_Mine-Services/
```

Mine Services will eventually contain its own:

```text
01_Baseline/
02_Architecture/
03_Operations/
04_KPI/
05_Planning/
06_HSE/
07_Reporting/
08_Audit/
09_Security-Evolution/
```

The existing Stage 1 Data Model work belongs to this module.

### Decision

**SEPARATE MODULE**

Do not implement Mine Services as a Mine Geologist feature.

---

## 9. Mine Plan

Mine Plan is a future Lithosite module.

Target boundary:

`lithosite/03_Mine-Plan/`

No runtime implementation is approved yet.

### Decision

**PLANNED**

---

## 10. Mine Pit Control

Mine Pit Control is a future Lithosite module.

Target boundary:

`lithosite/04_Mine-Pit-Control/`

No runtime implementation is approved yet.

### Decision

**PLANNED**

---

## 11. Product-Global Candidates

A component may become Lithosite-global only after dependency evidence proves that it serves multiple product modules.

Candidate categories:

- security contracts
- audit contracts
- common data contracts
- identity/authentication abstractions
- shared UI/icon standards
- common file/package contracts
- common geospatial services

Current decision:

**No existing Mine Geologist runtime component is automatically promoted to global status.**

This prevents premature extraction and dependency inversion.

---

## 12. Ownership Matrix

| Component | Owner | Status | Can Move Now? |
|---|---|---|---|
| Dashboard | Mine Geologist | Locked | No |
| Dashboard scripts | Mine Geologist | Locked | No |
| Dashboard modules | Mine Geologist | Locked | No |
| Member App | Mine Geologist | Locked | No |
| Member App Map Engine | Mine Geologist | Locked | No |
| Engine V2 | Mine Geologist | Locked | No |
| Geo Engine | MG shared runtime | Stable | No |
| Topo3D Engine | MG shared runtime | Stable | No |
| Assets | MG runtime | Stable | No |
| Mine Services | Lithosite | Stage 1 | Yes, as separate module |
| Mine Plan | Lithosite | Planned | Not yet |
| Mine Pit Control | Lithosite | Planned | Not yet |
| Product documentation | Lithosite | Active | Yes |

---

## 13. Boundary Rule

The following rule is now adopted:

> A component belongs to a Lithosite-global layer only when more than one product module actually depends on it and the shared contract has been audited.

Therefore:

```text
Existing + proven
        ↓
Keep stable

Multiple confirmed consumers
        ↓
Audit shared contract

Audit PASS
        ↓
Promote to Lithosite Core
```

This avoids speculative extraction.

---

## 14. Mine Services Integration Rule

Mine Services must consume product-global contracts through explicit interfaces.

It must not directly reach into Mine Geologist internals.

Forbidden architectural direction:

```text
Mine Services
     ↓
Mine Geologist internal module
     ↓
internal global state
```

Preferred direction:

```text
Mine Services
     ↓
Lithosite contract
     ↓
approved shared service
```

At the current stage, even these shared services are not implemented unless required by an approved Mine Services contract.

---

## 15. Migration Rule

No runtime directory migration is allowed until:

- dependency map is complete;
- path audit is complete;
- module boundary is approved;
- PWA migration plan exists;
- Service Worker migration plan exists;
- rollback plan exists;
- GitHub Pages deployment is verified;
- runtime regression tests pass.

---

## Final Decision

```text
Mine Geologist  → Existing stable runtime
Mine Services   → Independent Lithosite module
Mine Plan       → Future independent module
Mine Pit Control→ Future independent module

Lithosite       → Product architecture layer
```

**Module Boundary Gate = PASS**

**Runtime relocation = NOT APPROVED**

**Mine Services remains independent from Mine Geologist.**
