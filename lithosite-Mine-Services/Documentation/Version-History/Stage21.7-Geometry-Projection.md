# Stage 21.7 — Engine-to-Renderer Geometry Binding

## Scope
Projects engine-owned world geometry into renderer-ready screen geometry.

## Supported geometry
- Point
- LineString
- Polygon

## Flow
Engine feature geometry remains in world coordinates and CRS.
The projection boundary converts it to screen coordinates using the engine viewport and coordinate transform.

## Renderer boundary
The output is renderer-ready data only. It does not create DOM, canvas, WebGL, Leaflet, MapLibre, or Android UI objects.
