# Stage 19.9 — WorkFront Geometry

## Scope
Defines the WorkFront geometry domain layer for the Mine Services Map Engine.

## Supported geometry
- Point — WorkFront location / representative position
- LineString — WorkFront linear geometry
- Polygon — WorkFront area geometry

## Rules
- WorkFront requires an explicit ID and geometry.
- Geometry must carry an explicit CRS.
- CRS can be checked against the map/reference CRS.
- Status and metadata are retained as domain attributes.
- Bounds are derived from the geometry.
- The module is platform-neutral and has no renderer or UI dependency.

## Engine boundary
This stage does not introduce rendering or UI integration. Existing V31 Site Map visuals remain unchanged until a later renderer/data integration stage.
