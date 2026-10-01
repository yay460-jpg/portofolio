# V31 — Stage 19 Baseline

## Status

**LOCKED BASELINE**

V31 Stage 19 is locked as the Mine Services baseline after successful local verification.

## Artifact

- `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v31-LOCKED.html`

## Scope Locked

- Shared Lithosite Topo3D Engine integrated without modification.
- Mine Services Topo3D host and shell.
- DTM/STR topography loading and 3D terrain rendering.
- 3D / Top / Fit / Shaded / Elevation / Wire controls.
- Automatic smooth 360° terrain rotation after topography load.
- Compact Topo3D guide trigger (`?`) with interaction/status guidance.
- Existing Mine Services dashboard shell preserved.

## Shared Engines

- `shared/topo3d/topo3d-engine.js` — reused from Lithosite Mine Geologist.
- `shared/geo-engine.js` — present as the shared Lithosite geospatial foundation for subsequent integration.

The shared Topo3D engine source is not modified by the Mine Services implementation.

## Verification

Local repository test result reported after the final V31 integration:

`103 passed in 2.52s`

## Rule

V31-LOCKED is the baseline. Future Mine Services development must continue from a copied workspace/version and must not modify this locked artifact or its baseline definition.
