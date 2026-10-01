# Stage 20.5 — Layer Management

## Scope
Defines the platform-neutral layer registry for the Mine Services Map Engine.

## Layer types
- site
- boundary
- workfront
- equipment
- operations
- maintenance
- hse
- issue
- route
- stockpile
- infrastructure

## Rules
- Layer IDs are unique.
- Layer type is validated against the Mine Services map domain.
- Visibility is explicit and mutable through the manager.
- Rendering order is explicit through a numeric order.
- Layers are listed in order for renderer consumption.
- The registry is independent of DOM, renderer, and UI.

## Engine boundary
No renderer or UI integration is introduced in this stage.
