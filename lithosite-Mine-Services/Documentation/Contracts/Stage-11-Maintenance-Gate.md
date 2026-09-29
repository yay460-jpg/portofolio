# Stage 11 Gate — Maintenance

## Status
ACTIVE — Stage 11 workspace

## Baseline
- V22 — LOCKED / STABLE BASELINE
- V23 — ACTIVE DEVELOPMENT WORKSPACE
- V23 is a copy of V22 and is the only artifact allowed to change during Stage 11.

## Scope
Stage 11 introduces the Maintenance domain screen as a Desktop Master module.

## Schema authority
- Sheet: Maintenance
- PK: maintenance_id
- Required: maintenance_id, equipment_id
- Fields: maintenance_id, equipment_id, event_date, event_type, failure_code, start_time, end_time, downtime_hours, action, status, source

## Existing dependencies
- Maintenance.equipment_id -> Equipment.equipment_id (required FK)
- Equipment deletion is already protected when Maintenance references exist.
- Controlled fields: event_type -> maintenance_event_type; action -> maintenance_event_type; status -> maintenance_status

## Architecture requirement
UI -> Shell Navigation -> Maintenance JS module -> RuntimeAdapter -> Validation -> Transaction -> XLSX persistence -> AuditLog

Maintenance UI must not write directly to XLSX/database.

## Shell requirement
- ui/shared/shell-navigation-v23.js
- ui/modules/maintenance/maintenance.js
- V22 shell and V22 artifact remain untouched.

## UI requirements
- Desktop Master layout consistent with Equipment / Work Front / Operations.
- Offline-first.
- Runtime-authoritative CRUD.
- Filtered master table.
- Add / Edit / Delete actions.
- Controlled values sourced from runtime _Lists.
- Equipment reference sourced from runtime.
- RuntimeAdapter errors shown to the user.

## Test Gate
1. Maintenance screen is reachable through V23 shell.
2. Maintenance JS is loaded by the V23 workspace.
3. CRUD uses RuntimeAdapter.
4. Required FK validation is enforced.
5. Controlled-list validation is enforced.
6. Equipment reference protection is enforced.
7. AuditLog records CREATE / UPDATE / DELETE.
8. Existing regression suite remains green.
9. Final UI evidence is recorded.
10. Stage 11 is explicitly CLOSED / LOCKED before V24 is created.

## Out of scope
- Changes to V22.
- Changes to the XLSX schema unless testing proves the existing schema insufficient.
- New entities beyond Maintenance.
- Android-specific redesign.