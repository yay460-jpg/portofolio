# Stage 20.4 — Route / Line Geometry

## Scope
Defines the Route / Line domain layer for the Mine Services Map Engine.

## Supported geometry
- LineString only

## Rules
- Route requires an explicit ID and LineString geometry.
- Route geometry carries an explicit CRS.
- LineString contains at least two coordinates.
- CRS can be checked against the map/reference CRS.
- Status, route type, direction, and metadata are retained.
- Bounds are derived from all route coordinates.
- The module is platform-neutral and has no renderer or UI dependency.

## Engine boundary
No renderer or UI integration is introduced in this stage.
