# Stage 20.8 — Fit Bounds

## Scope
Adds platform-neutral viewport fitting from world-coordinate bounds.

## Responsibilities
- validate world bounds
- validate viewport dimensions
- enforce CRS compatibility
- calculate map center
- calculate scale
- support viewport padding

## Engine boundary
No DOM, renderer, canvas, WebGL, Leaflet, MapLibre, or Android UI dependency is introduced.
