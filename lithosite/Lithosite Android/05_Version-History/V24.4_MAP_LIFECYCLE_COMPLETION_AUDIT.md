# MG1 / LITHOSITE — V24.4 MAP LIFECYCLE COMPLETION

**Date:** 14 September 2026  
**Baseline:** V24.3 FINAL HARDENED  
**Stage:** V24.4 implementation / runtime validation pending

## 1. Starting baseline

V24.3 is treated as the locked starting point. The baseline ZIP passed ZIP integrity and the V24.3 ownership contract identifies the Map Library boundaries. V24.4 scope is limited to lifecycle completion.

## 2. Ownership / dependency contract

| Responsibility | Owner | V24.4 treatment |
|---|---|---|
| IndexedDB primitives | `map-package.js` | preserved |
| Map Library facade / metadata | `map-library.js` | preserved |
| Map validation | `map-library-contract.js` | preserved |
| Query / summary | `map-library-capability.js` | preserved |
| Management UI | `map-management-compat.js` | adds lifecycle action entry points only |
| Activation | existing V23 path | preserved |
| Delete | existing V23 path | preserved |
| Surface construction / atomic swap | `map-surface-lifecycle.js` | called as existing boundary only |
| Upload modal | existing V19/V24.1 modal | reused for replacement input |
| Lifecycle completion | `map-lifecycle-completion.js` | **new V24.4 owner** |

## 3. Protected areas

No V24.4 implementation change is made to:

- Tile Engine
- C1 Viewport Planner
- C2 Adaptive Render
- renderer / `peta.js` rendering pipeline
- viewport / gestures
- marker / GPS
- GeoReference processing
- Atomic Surface implementation
- tile persistence algorithm
- V24.2 runtime behavior

## 4. V24.4 lifecycle contract

### State observation

`stateOf(entry)` exposes a read-only lifecycle state:

- `MISSING` — entry does not exist
- `INVALID` — entry exists but required identity is invalid
- `READY` — valid stored map, not active
- `ACTIVE` — valid stored map and active identity matches

### Duplicate / Copy

`duplicate(id)`:

1. Reads the canonical stored map.
2. Creates a new map identity.
3. Preserves map payload and metadata.
4. Updates `runtimeMapId` to the new identity.
5. Persists the copy to IndexedDB.
6. Updates the RAM compatibility cache.
7. Does **not** activate the copy.

### Update / Replace

`beginReplace(id)` reuses the existing isolated upload modal. The replacement operation:

1. Captures the target map identity.
2. Accepts GeoPDF / GeoTIFF / PNG-JPG through the existing modal.
3. Preserves the target map ID.
4. Rebuilds the persisted payload from the replacement file.
5. Commits to IndexedDB before replacing the RAM entry.
6. Preserves active identity.
7. If the target is active, invokes the existing atomic surface-swap boundary.
8. If surface handoff fails, the durable replacement remains authoritative and the old visible surface is retained as recovery state.
9. Runtime PDF-source registration remains session-only and cannot roll back a successful durable save.

## 5. Failure / recovery boundary

The old map remains untouched until `dbPutMap_()` succeeds. Therefore a storage failure leaves the original map intact.

A post-commit surface failure does not report the map as lost: IndexedDB remains authoritative and the previous visible surface may remain temporarily while the lifecycle can be retried.

## 6. Static validation

- All JavaScript files in `member-app/scripts/` → `node --check` **PASS**
- V24.3 baseline ZIP integrity → **PASS**
- New V24.4 lifecycle module syntax → **PASS**
- Management compatibility module syntax → **PASS**

## 7. Runtime gate

**PASS — USER RUNTIME SMOKE COMPLETED.**

Required sequence:

1. Open Map Library.
2. Duplicate an existing map; confirm new card appears and original remains unchanged.
3. Activate original; confirm runtime remains normal.
4. Replace active map with a test file; confirm same Map ID, new content, active state preserved.
5. Replace inactive map; confirm active map is unchanged.
6. Force/observe failed replacement input; confirm original persists.
7. Reload page; confirm duplicate and replacement persist.
8. Delete only the test duplicate after validation.
9. DevTools console was reviewed. No new V24.4 lifecycle error was observed. A PDF.js warning (`TT: undefined function: 32`) remains and is classified as document/font-specific technical debt, outside lifecycle scope.

## 8. Current decision

V24.4 runtime lifecycle sequence is **PASS**. Functional release closure is complete. Console Clean remains explicitly **NOT CLAIMED** because unrelated/pre-existing environment/PDF warnings remain.
