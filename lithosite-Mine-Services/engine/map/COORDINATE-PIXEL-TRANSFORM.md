# Stage 19.4 — Coordinate ↔ Pixel Transform

## Purpose

Stage 19.4 defines the platform-neutral mathematical conversion between
Mine Services world coordinates and viewport pixel coordinates.

No DOM, canvas, renderer, WebGL, or UI dependency is introduced.

## Model

The viewport requires:

- `center`: world coordinate carrying its CRS;
- `width`: viewport width in pixels;
- `height`: viewport height in pixels;
- `scale`: world units per pixel.

The center is the origin of the viewport.

## World → Screen

```
screenX = width / 2 + (worldX - centerX) / scale
screenY = height / 2 - (worldY - centerY) / scale
```

The Y axis is inverted because screen pixels increase downward while the
world coordinate model uses increasing Y upward.

## Screen → World

```
worldX = centerX + (screenX - width / 2) * scale
worldY = centerY - (screenY - height / 2) * scale
```

The returned world coordinate uses the viewport center CRS.

## CRS safety

World-to-screen transformation requires the world coordinate CRS to match
the viewport center CRS.

No implicit CRS transformation is performed.

CRS transformation remains outside this stage and follows the Stage 19.2
coordinate-system contract.

## Scope

Implemented:

- worldToScreen
- screenToWorld
- viewport validation
- CRS compatibility validation
- platform-neutral coordinate/pixel mathematics

Not implemented:

- pan
- zoom
- fit bounds
- renderer
- pointer/touch interaction
