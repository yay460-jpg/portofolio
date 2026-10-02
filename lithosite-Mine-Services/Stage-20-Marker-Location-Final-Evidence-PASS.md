# Stage 20 — Marker Location Final Evidence

## Baseline
- Artifact: `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v32-STAGE20.html`
- Scope: centralized spatial Marker Location overlay and domain-link workflow.

## Automated verification
- Full pytest regression checkpoint: **226 passed**.
- Stage 20 tests cover:
  - centralized marker model and type definitions
  - explicit E/N/Elevation spatial coordinates
  - domain source links
  - visibility and selection
  - spatial overlay rendering
  - Measurement layer preservation
  - per-type ACTIVE spatial-marker limits
  - duplicate ACTIVE source protection
  - runtime source-record selector for Equipment, WorkFront, and HSE
  - automatic label population from selected source record

## Operational spatial limits
| Marker type | ACTIVE spatial-marker limit |
|---|---:|
| HSE | 5 |
| Asset / Equipment | 5 |
| WorkFront | 5 |
| Facility | 1 |
| Workshop | 1 |
| Stockpile | 3 |
| Disposal | 5 |
| Drainage | 3 |
| Other | 3 |

Limits apply to spatial markers only. Domain records are not limited. INACTIVE and REMOVED spatial markers do not consume capacity.

## Domain source workflow
For Equipment, WorkFront, and HSE, Marker Location reads the corresponding runtime domain records and provides a source-record selector. The selected record populates Source ID and Label, reducing manual re-entry and duplicate-ID risk.

## Browser validation reported during Stage 20
- Location marker uses a slim pin shape with the pin tip as the spatial anchor.
- Equipment markers are blue, WorkFront markers green, and HSE markers red.
- Marker Location and Measurement A/B coexist on the same topographic view.
- 3D, Top, 360°, Fit, Shaded, Elevation, Wire, and measurement interactions remained operational during validation.
- Marker capacity feedback is visible in the Marker Location panel.

## Persistence boundary
Marker Location remains an in-memory spatial marker model at this stage. A.2 domain schemas remain unchanged; persistent MapMarker/A.3 migration remains an explicit opt-in boundary and is not part of this Stage 20 visual/domain-link checkpoint.

## Final status
**Stage 20 Marker Location: FUNCTIONALLY VALIDATED / READY FOR BASELINE REVIEW**

The next action should be baseline lock/checkpoint handling before starting unrelated Stage 21 work.
