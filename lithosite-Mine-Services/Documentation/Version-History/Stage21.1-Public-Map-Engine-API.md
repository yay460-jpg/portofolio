# Stage 21.1 — Public Map Engine API

## Scope
Exposes the platform-neutral Mine Services Map Engine capabilities through one stable public API boundary.

## Public capabilities
- viewport
- pan and zoom
- coordinate ↔ pixel transformation
- fit bounds
- feature lifecycle and layer-scoped queries
- selection and hover interaction

## Boundary
Consumers call this API without depending on the internal module layout.

No DOM, renderer, canvas, WebGL, Leaflet, MapLibre, or Android UI dependency is introduced.
