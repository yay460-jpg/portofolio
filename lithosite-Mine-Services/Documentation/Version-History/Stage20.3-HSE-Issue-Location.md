# Stage 20.3 — HSE / Issue Location

## Scope
Defines the HSE and Issue location domain layer for the Mine Services Map Engine.

## Rules
- HSE and Issue require an explicit ID and location.
- Location carries an explicit CRS.
- CRS can be checked against the map/reference CRS.
- HSE retains severity and status.
- Issue retains priority and status.
- Metadata is retained for both domain objects.
- Bounds are derived from the location.
- The module is platform-neutral and has no renderer or UI dependency.

## Engine boundary
No renderer or UI integration is introduced in this stage.
