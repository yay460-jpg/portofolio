# V39 — Workflow and Maintenance Enhancements

## Scope

This note records version-specific implementation work. It is not a global UI contract.

## Global sidebar workflow

The shared sidebar labels remain version-neutral. Do not add labels such as V39 or V40 to the global sidebar or shared navigation controls.

Current sidebar order:

1. Workbook — high-level operational overview.
2. Work Front — define work areas and operational context.
3. Target Plan — set production targets by period, domain, work front, and activity.
4. Equipment — maintain equipment identities, types, brands, and capacity profiles.
5. Operations — record and validate actual work, retase, quantities, and hours.
6. Maintenance — record maintenance events and downtime.
7. Issues — track operational issues and follow-up.
8. HSE — record health, safety, and environmental items.
9. Reports & KPI — review validated operational results and equipment performance.
10. Data Manage — separate data administration and backup/restore utilities.

The numbered labels communicate the navigation sequence; they do not impose a strict execution gate. Maintenance, Issues, and HSE can be recorded whenever relevant.

## Maintenance ↔ Operations traceability

- Maintenance displays Brand / Merk resolved from the Equipment record's capacity profile in Global Capacity.
- Maintenance displays Linked Operations when an operation matches the maintenance event's date and equipment ID.
- Selecting the linked count navigates to Operations, applies the matching date and equipment filter, and highlights the related timeline.
- The existing Operations-to-Maintenance link remains available.

## Operations and material movement

- Material Movement production tonnage is counted from Hauling activity only. Dumping is treated as a destination/drop-off activity, not a second movement to count.
- Entering Dumping in the Operations activity field shows a warning to write Hauling; the warning does not silently replace the entered value.

## Target Plan schema

- Target Plan no longer stores `target_hours`; the field remains available for Operations where it is used for operational hours.
- A3 persistence and A2-to-A3 migration remove the obsolete Plans column by header, preserving adjacent plan values.

## Target Plan Evidence column scaffold

- Added an `Evidence` column to the Target Plan register between Status and Actions.
- The Work Front column was narrowed and the Activity column given a little more room to reduce excess visual gap while preserving wrapping for long Work Front identifiers.
- The current cell intentionally displays `—` until its intended evidence workflow and behavior are defined.
- This is a layout scaffold only; no evidence attachment, validation, or storage behavior has been assumed.

## Versioning and validation rule

- Global UI labels, shared shell navigation, and reusable contracts must use stable, version-neutral names.
- Version-specific feature decisions and implementation history belong in this Version-History area.
- The latest full test result before the sidebar workflow reorder was `379 passed`; rerun the local suite after pulling the sidebar/documentation commits to validate the current branch.
