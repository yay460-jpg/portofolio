# Stage 21.4 — Engine Session Lifecycle

## Scope
Connects one Map Engine instance to one renderer boundary through an explicit lifecycle session.

## Responsibilities
- prepare renderer before use
- prevent render before preparation
- delegate render and resize
- destroy renderer and engine safely
- expose session started state

## Architecture
One engine instance is paired with one renderer boundary for the session lifetime.

The engine remains the source of map state. The renderer remains a consumer of engine output.

## Platform boundary
No DOM, canvas, WebGL, Leaflet, MapLibre, or Android UI dependency is introduced.
