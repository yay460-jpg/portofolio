# Stage 19.3 — Map Engine Core

## Purpose

Stage 19.3 establishes the runtime core of the Mine Services Map Engine using the
same Lithosite engine principles used by Mine Geologist:

- one engine instance owns its runtime state;
- lifecycle is explicit;
- DOM/UI is outside the engine;
- renderer is an injected boundary;
- state is not global singleton state;
- Web/Desktop and Android can consume the same engine contract.

## Lifecycle

```
CREATED
   ↓
prepare()
   ↓
PREPARED
   ↓
ready()
   ↓
READY
   ↓
destroy()
   ↓
DESTROYED
```

## Engine-owned state

- CRS reference/configuration
- viewport state
- map layers
- renderer boundary

The engine does not create DOM elements, canvas elements, WebGL contexts, or
platform UI.

## Renderer boundary

A renderer may be supplied with `setRenderer()` or during `prepare()`.
The engine only owns the reference and calls its `destroy()` lifecycle hook
when the engine is destroyed.

This keeps rendering implementation separate from the map model.

## Layer ownership

Layers are owned by the engine instance and keyed by a required unique `id`.
Duplicate layer IDs are rejected.

## Viewport

Stage 19.3 establishes viewport ownership and validation. Coordinate-to-pixel
math and full viewport behavior remain later stages.

## CRS

The engine accepts an explicit CRS configuration but does not select or inherit
a CRS. The Stage 19.2 coordinate model remains authoritative.

## Scope

Implemented:

- engine instance
- lifecycle
- state ownership
- viewport storage/validation
- renderer boundary
- layer ownership
- clear/destroy

Not implemented yet:

- coordinate transformation
- pan/zoom mathematics
- world-to-screen conversion
- screen-to-world conversion
- geometry rendering
- interaction handling

Those remain subsequent Stage 19.x work.
