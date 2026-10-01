# Stage 21.0 — Map Engine Core Integration

## Scope
Integrates the Map Engine Core with the platform-neutral Map Model, Navigation, and Interaction components.

## Integrated boundaries
- Map Model
- Navigation
- Interaction
- Renderer boundary

## Rules
- The core engine remains the owner of lifecycle and component references.
- Viewport operations delegate to Navigation when configured.
- Renderer remains an external boundary.
- No DOM or renderer implementation is introduced.

## Result
The previously separate engine components now have a single lifecycle owner: `MineServicesMapEngine`.
