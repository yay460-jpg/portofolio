# MG1 / Lithosite — V24.3 Lifecycle & Map Management Audit

## Scope
Cross-file audit against the locked V24.3 Map Library baseline. No runtime/tile/GeoReference/interaction code was changed.

## Ownership map
- `map-package.js` — IndexedDB persistence owner (`maps`, `kmlOverlays`), dbPut/dbDelete/load.
- `map-background-lifecycle.js` — legacy background activate/deactivate/delete lifecycle.
- `map-surface-lifecycle.js` — atomic surface construction/preload/swap and related V22 save path.
- `map-upload-save-lifecycle.js` — legacy upload/save lifecycle.
- `map-library.js` — canonical V24.3 Map Library facade; metadata write boundary; delegates activate/remove to V23 lifecycle helpers.
- `map-library-contract.js` — metadata contract/validation.
- `map-library-capability.js` — read/query/summary capability.
- `map-management-compat.js` — canonical V24.3 management UI plus legacy compatibility bridge.
- `map-ui.js` / `peta.js` — retained legacy UI/runtime compatibility; not canonical V24.3 management ownership.

## Findings
### F1 — Canonical management modal still sets legacy `mapManagePanelOpen = true`
`map-management-compat.js` line 1175 sets the legacy render flag to true after opening the isolated V24.3 modal. This is a latent coupling to `map-ui.js::renderMapManagePanel_()` / `peta.js::render()`.

Current observed user behavior is PASS (old UI does not appear), but the flag remains an architectural escape hatch that can resurrect legacy UI after a future global render. Recommended V24.3 hardening: canonical open should keep the legacy flag false; canonical close should also clear it.

### F2 — Active state remains multi-writer (known technical debt)
`activeBackgroundMapId` and `mg1_active_bg_map_id` are written by multiple paths: V24.3 management compatibility, V23 activation, upload/save, V22 surface lifecycle, background lifecycle, and DB restore. This is known and must not be refactored incidentally.

### F3 — Atomic failure-path active-state mismatch (known technical debt)
V23 activation writes active state/localStorage before `executeAtomicSurfaceSwap_()`. If the swap fails, the old surface may remain while active state points to the new map. Existing behavior; dedicated transaction refactor only.

### F4 — Direct `dbPutMap_` still exists in legacy compatibility fallbacks and upload/save/tile persistence
This is correct for full payload/runtime writes and must remain separate from `updateMetadata()`. The V24.3 metadata boundary is correctly limited to name/labels/collectionNames.

### F5 — Contract version marker housekeeping mismatch
`map-library-contract.js` reports `24.3-s13`; capability reports `24.3-s14-labels`; facade logs Slice 14. Non-blocking housekeeping only.

### F6 — Duplicate Map / Update / Import/Export / Storage lifecycle contracts are not yet implemented
These are the remaining capabilities needed before Map Lifecycle + Management can be considered a complete subsystem.

## Protected areas
No changes permitted in this audit:
- Tile Engine / C1 / C2
- renderer
- viewport / gestures
- marker/GPS
- GeoReference processing
- atomic surface implementation
- tile persistence algorithm
- V24.2 runtime behavior

## Decision
V24.3 remains the current locked baseline. Do NOT label the project V24.4 yet.

Next safe action inside V24.3: harden the latent canonical/legacy management flag coupling (F1), then freeze the resulting V24.3 baseline again. After that, begin the V24.4 Lifecycle Completion design/audit in a new chat as previously agreed.
