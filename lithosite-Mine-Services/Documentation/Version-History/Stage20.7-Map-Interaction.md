# Stage 20.7 — Map Interaction

## Scope
Defines platform-neutral interaction state for the Mine Services Map Engine.

## Supported interaction state
- selected feature
- hovered feature
- selection clear
- hover clear
- event subscriptions

## Rules
- Interaction state is independent of DOM, renderer, and UI.
- Feature IDs are the interaction references.
- Selection and hover emit explicit engine events.
- Subscribers can be removed through an unsubscribe function.
- Interaction state can be cleared.

## Engine boundary
No renderer or UI integration is introduced in this stage.
