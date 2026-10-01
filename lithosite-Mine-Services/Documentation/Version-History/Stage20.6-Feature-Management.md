# Stage 20.6 — Feature Management

## Scope
Defines the platform-neutral feature registry for the Mine Services Map Engine.

## Feature model
A feature contains:
- unique ID
- layer ID
- domain type
- geometry
- properties
- metadata

## Rules
- Feature IDs are unique.
- A feature must reference a layer ID.
- Geometry and geometry CRS are required.
- Add, update, remove, get, list, and layer-scoped queries are supported.
- Updates are revalidated before being stored.
- Registry state is independent of DOM, renderer, and UI.

## Engine boundary
No renderer or UI integration is introduced in this stage.
