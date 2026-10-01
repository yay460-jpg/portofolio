# Stage 19.7 — Map Engine Geometry

## Scope
Stage 19.7 defines the platform-neutral geometry layer for the Mine Services Map Engine.

Supported geometry:
- Point
- LineString
- Polygon

## Rules
- Geometry is independent of DOM, canvas, WebGL, Leaflet, MapLibre, and Android UI.
- Coordinates must contain an explicit CRS.
- All coordinates within one geometry must use the same CRS.
- LineString requires at least two coordinates.
- Polygon requires at least one ring, with each ring containing at least four coordinates and being closed.
- Geometry output is normalized and immutable.
- Rendering remains outside the geometry engine.

## Domain use
The geometry layer provides the base representation for later Mine Services map features such as:
- Site and boundary
- WorkFront
- Equipment position
- Operations location
- Maintenance location
- HSE / Issue location
- Route / line
- Stockpile
- Infrastructure

No renderer or UI integration is introduced in this stage.
