# Stage 20.1 — Operations Location

## Scope
Defines the Operations location domain layer for the Mine Services Map Engine.

## Rules
- Operation requires an explicit ID and location.
- Location carries an explicit CRS.
- CRS can be checked against the map/reference CRS.
- Status and metadata are retained as domain attributes.
- Bounds are derived from the operation location.
- The module is platform-neutral and has no renderer or UI dependency.

## Engine boundary
No renderer or UI integration is introduced in this stage.
