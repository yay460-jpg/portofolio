# Stage 21.6 — Map Engine Runtime Bootstrap & Data Binding

## Scope
Creates one runtime bootstrap boundary that assembles the existing platform-neutral map components and seeds the Site Map with engine-owned layers and features.

## Engine-owned data
- site
- work front
- route
- equipment
- operations
- maintenance
- HSE
- issue

The initial V31 map uses representative offline geometry for the engine bootstrap. This is a binding fixture, not a replacement for authoritative runtime/database data.

## Lifecycle
The bootstrap:
1. creates layers
2. registers initial features
3. configures the viewport
4. prepares the engine
5. transitions the engine to ready
6. exposes an immutable snapshot

## Boundary
No DOM, renderer, canvas, WebGL, Leaflet, MapLibre, or Android UI dependency is introduced.
