# Stage 21.2 — Renderer Boundary

## Scope
Defines the renderer boundary between the platform-neutral Mine Services Map Engine and platform-specific rendering implementations.

## Renderer contract
A renderer must expose:
- `prepare(context)`
- `render(snapshot)`
- `resize(width, height)`
- `destroy()`

## Lifecycle
The boundary enforces:
1. renderer validation
2. prepare before render
3. valid resize dimensions
4. safe destroy

## Architecture
The engine owns map state and data. The renderer consumes engine snapshots and produces platform-specific visuals.

Possible consumers:
- Web/Desktop renderer
- Android renderer

No rendering library or UI implementation is introduced in this stage.
