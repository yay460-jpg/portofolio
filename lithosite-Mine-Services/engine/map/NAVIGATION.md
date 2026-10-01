# Stage 19.5 — Pan / Zoom Navigation

## Purpose

Stage 19.5 adds platform-neutral viewport navigation following the Lithosite
engine pattern: navigation owns viewport state but has no UI or renderer
dependency.

## Navigation state

The navigation state contains:

- center coordinate;
- viewport width;
- viewport height;
- scale in world units per pixel;
- zoom level.

Zoom is bounded by configurable minimum and maximum values.

## Pan

Pan receives screen-space movement:

```
pan(deltaX, deltaY)
```

The movement is converted into world-space center movement using the current
scale. Screen Y increases downward, therefore world Y is inverted.

## Zoom

```
zoom(delta)
```

Zoom uses a power-of-two scale relationship:

```
scale = baseScale × 2^zoom
```

A positive zoom value increases world units per pixel in this stage's current
navigation convention; this keeps the transform internally consistent and will
be reviewed with the renderer/interaction contract before UI integration.

## Zoom at point

```
zoomAtPoint(delta, anchor)
```

The world coordinate beneath the supplied screen anchor is preserved while
the scale changes. This allows later pointer/wheel interaction to zoom around
the user's selected map point.

## Bounds

```
getBounds()
```

Returns the current world-space viewport bounds with the active CRS.

## Scope

Implemented:

- viewport navigation state
- pan
- zoom
- zoom-at-point
- zoom limits
- world-space bounds

Not implemented:

- pointer/touch events
- UI controls
- renderer
- automatic fit-to-feature
