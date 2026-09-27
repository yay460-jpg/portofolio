# MG1 / LITHOSITE — V24.4 MAP LIFECYCLE COMPLETION

**Date:** 14 September 2026  
**Baseline:** V24.3 FINAL LOCKED / V24.2 runtime LOCKED-PROTECTED  
**Release candidate:** V24.4-s1  
**Status:** **FUNCTIONALLY COMPLETE — RELEASE CLOSURE**

## Technical Issue
V24.3 completed the Map Library / Management subsystem, but full map lifecycle behavior still required an explicit state contract, Duplicate/Copy, Update/Replace, failure/recovery boundary, and lifecycle regression validation.

## Root Cause / Context
Management actions previously depended on existing lifecycle/storage boundaries without one explicit V24.4 owner for lifecycle-completion semantics. V24.4 introduces a narrow lifecycle boundary without taking ownership of IndexedDB primitives, activation/delete, rendering, tiles, GeoReference, or Atomic Surface implementation.

## Feature / Requirement
- Duplicate creates a new identity with independent persisted payload.
- Replace keeps the target identity while replacing the payload.
- Durable persistence occurs before RAM replacement.
- Active identity is preserved across replacement.
- Post-commit surface failure does not lose the durable map.
- Active deletion falls back to the remaining map and persists through reload.
- Existing V24.2 runtime remains protected.

## Before Flow
```text
Map Library / Management
        ↓
existing lifecycle + storage paths
        ↓
no single V24.4 lifecycle-completion boundary
```

## Fix / Implementation
New owner: `scripts/map/map-lifecycle-completion.js`.

Responsibilities:
- `stateOf()` read-only state observation.
- `duplicate(id)` for copy lifecycle.
- `beginReplace(id)` and replacement commit boundary.
- durable-write-first recovery semantics.

`map-management-compat.js` only exposes Duplicate/Replace entry points. Existing V23 activation/delete and V22 Atomic Surface boundaries remain owners of their respective behavior.

## After Flow
```text
Management UI
    ↓
map-management-compat.js
    ↓
MG1MapLifecycleCompletion
    ├── Duplicate → dbPutMap_ → RAM cache
    └── Replace → build payload → dbPutMap_ → RAM sync
                                      ↓
                              active? → existing atomic surface swap
                                      ↓
                              failure → old visible surface retained
```

## Before Architecture
```text
V24.3 Map Library
   ↓
metadata / management
   ↓
existing V23 lifecycle + V24.1 storage behavior
```

## After Architecture
```text
V24.4 Lifecycle Completion
        ↓
State Contract
        ↓
Duplicate / Replace boundary
        ↓
existing persistence owner
        ↓
existing activation/delete owner
        ↓
existing Atomic Surface owner
```

## Files / Ownership
| File | Ownership | V24.4 impact |
|---|---|---|
| `map-lifecycle-completion.js` | lifecycle completion | **NEW owner** |
| `map-management-compat.js` | Management UI / bridge | action entry points only |
| `map-package.js` | IndexedDB / persisted map storage | preserved |
| `map-library.js` | Library facade / metadata writes | preserved |
| `map-library-contract.js` | validation / contract | preserved |
| `map-library-capability.js` | query/filter/summary | preserved |
| `map-background-lifecycle.js` | activate/deactivate/delete | preserved |
| `map-surface-lifecycle.js` | atomic surface/runtime swap | existing boundary called only |
| `map-upload-save-lifecycle.js` | existing upload/save modal path | reused for replacement input |
| `peta.js` | protected runtime/application compatibility | **NOT MODIFIED by V24.4 lifecycle scope** |

## Data / State Contract
`stateOf(entry)` states:
- `MISSING`
- `INVALID`
- `READY`
- `ACTIVE`

Duplicate:
```text
source.id != copy.id
copy.payload independent
copy.active = false
```

Replace:
```text
target.id == replacement.id
old durable map untouched until commit succeeds
active identity preserved
```

## Validation
### Runtime evidence
- Duplicate / Copy: **PASS**
- New identity: **PASS**
- Original preserved: **PASS**
- Replace / Update: **PASS**
- Replace same ID: **PASS**
- Replacement persistence: **PASS**
- Hard reload / restore: **PASS**
- Activate: **PASS**
- Active-state persistence: **PASS**
- Delete non-active: **PASS**
- Delete active: **PASS**
- Active fallback: **PASS**
- Reload after active delete: **PASS**

### Static validation
- `node --check` across all `member-app/scripts/*.js`: **PASS**
- V24.4 lifecycle module syntax: **PASS**
- ZIP integrity: **PASS**

### Console qualification
No new V24.4 lifecycle error was observed in the supplied runtime evidence. Existing/pre-existing warnings/errors remain, including CRS/Validasi `AbortError`, Tailwind CDN production warning, manifest warning, browser tracking-prevention messages, and the PDF.js warning `TT: undefined function: 32` emitted by `vendor/pdfjs/pdf.worker.min.js` when processing certain embedded TrueType font programs. The PDF.js warning is document/font-specific and is not a V24.4 lifecycle failure. Therefore **Console Clean = NOT CLAIMED** and these are retained as technical debt / environment issues, not lifecycle failures.

## Failure / Recovery
Storage failure before durable commit leaves the original map untouched.

Post-commit surface failure retains the durable replacement while the previous visible surface may remain temporarily. Runtime source registration is session-only and cannot roll back a successful durable map save.

## Technical Debt
Not included in V24.4 incidental scope:
- CRS/Validasi AbortError path.
- Tailwind CDN production warning.
- manifest warning.
- browser tracking-prevention messages.
- previously registered active-state multi-writer / contract housekeeping debt.

These must not trigger a lifecycle rewrite unless separately scoped and evidenced.

## Regression Boundary
Protected and not to be modified incidentally:
- Tile Engine
- C1 Viewport Planner
- C2 Adaptive Render
- GeoReference processing
- gesture / interaction
- marker / GPS
- tile identity / tile persistence algorithm
- Atomic Surface implementation
- V24.2 runtime behavior
- RAM-first save lifecycle
- `peta.js` rendering pipeline

## Baseline Decision
**V24.4 Map Lifecycle Completion is functionally complete.**

Release closure may proceed with documentation/lock. V24.4 must not be treated as a cleanup release for unrelated console/environment debt.

## Ringkasan
V24.4 establishes a dedicated lifecycle-completion boundary for Map State, Duplicate/Copy, Replace, and recovery while preserving the V24.2 runtime and V24.3 management boundaries. Runtime evidence confirms the complete lifecycle chain through persistence, activation, deletion, fallback, and reload.
