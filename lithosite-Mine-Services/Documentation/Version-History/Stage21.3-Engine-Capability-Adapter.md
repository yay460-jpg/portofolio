# Stage 21.3 — Engine Capability Adapter

## Scope
Provides one stable adapter boundary over the public Mine Services Map Engine capabilities.

## Capabilities
- viewport
- coordinate ↔ pixel transformation
- navigation
- fit bounds
- layer management
- geometry creation entry points
- clear

## Purpose
The adapter gives renderers and host applications a capability-oriented boundary without coupling them to the internal engine module layout.

## Platform boundary
No DOM, renderer implementation, canvas, WebGL, Leaflet, MapLibre, or Android UI dependency is introduced.
