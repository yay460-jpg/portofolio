# Stage 19.8 — Site / Boundary

## Scope
Defines the Mine Services site and boundary domain layer on top of the geometry engine.

## Supported domain objects
- Site
- Boundary

## Rules
- Site geometry is Point or Polygon.
- Boundary geometry is Polygon.
- Geometry must carry an explicit CRS.
- Site and boundary CRS can be compared explicitly.
- Bounds are derived from geometry.
- The module is platform-neutral and has no renderer or UI dependency.

## Engine boundary
This stage does not introduce map rendering or UI integration. Site and boundary objects are domain data consumed later by the map engine and renderer.
