# Hydrology Engine — Mine Services

**Status:** Hydrology core v1.0.0 and initial Rainfall analysis/A3 record workflow added. Flow overlay remains pending.  
**Branch scope:** `v41-workspace`. Do not modify `main` without explicit approval.

## Ownership rule

All new Hydrology implementation source files must live in this directory, regardless of source type:

- JavaScript modules (`.js`) for terrain analysis, flow routing, simulation orchestration, and overlay integration.
- Stylesheets (`.css`) for Hydrology-specific controls, legend, and visual states.
- Python modules (`.py`) only if a justified backend/offline-processing requirement is identified; such implementation files also belong here.

Do not scatter Hydrology implementation across `ui/modules/map-engine/`, `shared/topo3d/`, or unrelated backend modules. Existing modules may expose a small, reviewed integration seam when needed, but Hydrology-owned logic stays here.

## Proposed source layout

### Implemented

- `hydrology-engine.js` — UI-independent D8 flow-direction and flow-accumulation analysis, bounded TIN-to-grid interpolation, optional constant-rainfall/runoff-volume estimate, and validation/resource guards.
- `hydrology-panel.js` — opens Rainfall controls, runs the core against a bounded Topo3D mesh copy, displays summary metrics, and saves one run via RuntimeAdapter to `RainfallSimulation`.

### Planned

- `hydrology-overlay.js` — draw/update simulation results over the existing Site Map terrain without modifying the source DTM.
- `hydrology.css` — isolated Hydrology panel, legend, and simulation UI styles (implemented).
- Optional `hydrology-core.py` — only if a justified server-side or batch-computation requirement is identified. The current computation core runs in the browser and does not require Python.

## Architecture boundaries

- **Topo3D Engine** remains responsible for reading the supported topography package and rendering the terrain.
- **Geo Engine** remains responsible for spatial coordinate calculations and CRS behavior.
- **Hydrology Engine** owns terrain-derived hydrology calculations and simulation outputs.
- **Map Controller** owns UI wiring and life-cycle coordination, not the hydrology algorithms.
- Hydrology must not edit or overwrite the original `.ltdtm`/DTM/STR data.
- Keep all calculations local/offline for the first release unless an explicit design decision requires otherwise.
- Topo3D exposes a bounded `getAnalysisMesh()` copy-out API; Hydrology consumes copied arrays through the `MineServicesTopo3D` facade, not the renderer's private model object.
- Current engine limits are 300,000 grid cells / TIN vertices, 600,000 triangles, and 5,000,000 default raster sampling candidates. The engine v1 supports `FILL` and `PRESERVE`; `BREACH` is explicitly not implemented yet.
- D8 reports indicative one-direction-per-cell flow paths and accumulation. It does not compute water depth, velocity, flood extents, or an engineering-grade drainage design.
- The engine consumes an explicit grid or packed triangle mesh. Active Topo3D integration must wait for a reviewed, bounded, read-only mesh access contract; never reach into private engine state.

## A3 simulation record

Rainfall run records use the canonical `RainfallSimulation` worksheet in the active A3 workbook. Its header and validation contract are documented in [`Documentation/Contracts/Rainfall-Hydrology-Simulation-Contract.md`](../../Documentation/Contracts/Rainfall-Hydrology-Simulation-Contract.md). The first record model stores scenario inputs and compact summary metrics only; it does not store per-cell flow grids or animation frames in Excel.

## Tests and documentation

Follow repository conventions for cross-cutting assets:

- Regression tests remain under `lithosite-Mine-Services/tests/`.
- The approved calculation, input/output, unit, and limitations contract belongs under `lithosite-Mine-Services/Documentation/Contracts/`.
- Link this folder from the relevant architecture documentation once the design contract is approved.

Automated runtime coverage lives in `tests/test_hydrology_engine.py`; integration contracts live in `tests/test_release_readiness.py`. The current panel computes and saves aggregate metrics but does not yet draw flow paths on the 3D terrain.
