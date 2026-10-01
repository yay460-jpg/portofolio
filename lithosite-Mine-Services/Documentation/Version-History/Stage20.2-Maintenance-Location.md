# Stage 20.2 — Maintenance Location

## Scope
Defines the Maintenance location domain layer for the Mine Services Map Engine.

## Rules
- Maintenance requires an explicit ID and location.
- Location carries an explicit CRS.
- CRS can be checked against the map/reference CRS.
- Status, maintenance type, and metadata are retained as domain attributes.
- Bounds are derived from the maintenance location.
- The module is platform-neutral and has no renderer or UI dependency.

## Engine boundary
No renderer or UI integration is introduced in this stage.
