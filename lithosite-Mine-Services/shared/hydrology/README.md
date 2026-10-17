# Hydrology Engine — Mine Services

**Status:** Reserved source folder; no simulation implementation has been added yet.  
**Branch scope:** `v41-workspace`. Do not modify `main` without explicit approval.

## Ownership rule

All new Hydrology implementation source files must live in this directory, regardless of source type:

- JavaScript modules (`.js`) for terrain analysis, flow routing, simulation orchestration, and overlay integration.
- Stylesheets (`.css`) for Hydrology-specific controls, legend, and visual states.
- Python modules (`.py`) only if a justified backend/offline-processing requirement is identified; such implementation files also belong here.

Do not scatter Hydrology implementation across `ui/modules/map-engine/`, `shared/topo3d/`, or unrelated backend modules. Existing modules may expose a small, reviewed integration seam when needed, but Hydrology-owned logic stays here.

## Proposed source layout

The exact files should be created after the calculation model and first-release scope are agreed:

- `hydrology-engine.js` — elevation-grid preparation, slope/flow direction, flow accumulation, and version-appropriate runoff estimates.
- `hydrology-overlay.js` — draw/update simulation results over the existing Site Map terrain without modifying the source DTM.
- `hydrology-panel.js` — Rainfall parameters, run/pause/reset controls, validation, status, and result summary.
- `hydrology.css` — isolated Hydrology panel, legend, and simulation UI styles.
- Optional `hydrology-core.py` — only if a server-side or batch-computation path is selected. The initial browser/offline approach does not inherently require Python.

Names above are a proposal, not files that currently exist.

## Architecture boundaries

- **Topo3D Engine** remains responsible for reading the supported topography package and rendering the terrain.
- **Geo Engine** remains responsible for spatial coordinate calculations and CRS behavior.
- **Hydrology Engine** owns terrain-derived hydrology calculations and simulation outputs.
- **Map Controller** owns UI wiring and life-cycle coordination, not the hydrology algorithms.
- Hydrology must not edit or overwrite the original `.ltdtm`/DTM/STR data.
- Keep all calculations local/offline for the first release unless an explicit design decision requires otherwise.
- Any access to Topo3D mesh/elevation data must use an explicit, bounded read-only interface; do not depend on private engine internals.
- Define units, resolution limits, depression/flat handling, model assumptions, and the distinction between indicative flow paths and validated flood-depth results before implementation.

## Tests and documentation

Follow repository conventions for cross-cutting assets:

- Regression tests remain under `lithosite-Mine-Services/tests/`.
- The approved calculation, input/output, unit, and limitations contract belongs under `lithosite-Mine-Services/Documentation/Contracts/`.
- Link this folder from the relevant architecture documentation once the design contract is approved.

No Hydrology JavaScript, CSS, or Python runtime files are created by adding this reservation folder alone.
