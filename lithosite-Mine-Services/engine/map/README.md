# Mine Services Map Engine

## Stage 19.1 — Engine Contract

The Mine Services Map Engine is a standalone, platform-neutral map core.

It is intentionally separate from:
- Mine Geologist geo-engine.js
- Mine Services dashboard modules
- HTML / DOM
- Canvas / SVG renderer
- Leaflet / MapLibre or another map library
- Android UI

The same engine contract is intended to support Mine Services Web/Desktop and Mine Services Android.

## Core responsibilities

1. Coordinate system
2. Map viewport
3. Pan / Zoom
4. Grid
5. Coordinate ↔ Pixel transformation
6. Site / boundary geometry
7. WorkFront geometry
8. Equipment position
9. Operations location
10. Maintenance location
11. HSE / Issue location
12. Route / line geometry
13. Layer management
14. Map interaction

## Public API contract

- setViewport(viewport)
- getViewport()
- worldToScreen(coordinate)
- screenToWorld(pixel)
- pan(delta)
- zoom(factor)
- zoomAtPoint(factor, pixel)
- addLayer(layer)
- removeLayer(layerId)
- setLayerVisibility(layerId, visible)
- addPoint(feature)
- addLine(feature)
- addPolygon(feature)
- fitBounds(bounds)
- clear()

## Geometry contract

The initial geometry model is deliberately small:
- Point
- LineString
- Polygon

Complex domain objects such as WorkFront, Equipment, Operations, Maintenance, HSE and Issues are represented as map features/layers rather than separate map engines.

## Layer contract

Initial domain layer types:
- site
- boundary
- workfront
- equipment
- operations
- maintenance
- hse
- issue
- route
- stockpile
- infrastructure

## Platform boundary

The core engine must not assume a renderer.

Map Engine Core -> Web/Desktop Renderer
Map Engine Core -> Android Renderer

Renderer-specific code belongs outside the engine core.

## Stage sequence

- 19.1 Engine Contract
- 19.2 Coordinate System
- 19.3 Viewport
- 19.4 Coordinate ↔ Pixel
- 19.5 Pan / Zoom
- 19.6 Grid
- 19.7 Geometry
- 19.8 Layer Management
- 19.9 Interaction
- 19.10 Renderer Contract
- 19.11 Standalone Engine Test