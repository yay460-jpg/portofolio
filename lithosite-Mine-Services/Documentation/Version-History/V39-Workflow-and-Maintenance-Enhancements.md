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

## Target Plan Evidence viewer and central storage

- Added an `Evidence` column to the Target Plan register between Status and Actions. The cell is a `View` button only, not an upload control.
- Added the shared local store under `Database/Evidence/`, organized by module and record ID: `TargetPlan/<plan_id>/`, `HSE/<hse_id>/`, and `Maintenance/<maintenance_id>/`.
- The Target Plan button opens a modal that lists files in the selected plan's folder. PDF and JPG/JPEG/PNG files preview in the modal; DOC/DOCX files are listed and downloaded as originals.
- The Work Front column was narrowed and the Activity column given a little more room to reduce excess visual gap while preserving wrapping for long Work Front identifiers.
- Dedicated read-only Desktop Host endpoints restrict file access to allowlisted modules, record IDs, and approved extensions. Other content in `Database/` remains protected from static web access.
- There is no upload endpoint or upload control at this stage. Files are copied into the matching record folder manually, and **Refresh list** rescans that folder.
- A `.gitignore` under `Database/Evidence/` excludes operational evidence from Git to reduce the risk of accidentally committing sensitive PDFs and photographs.
- Endpoint regression tests exposed a query-parser name-shadowing bug in the Desktop Host's user-guide route: a local import made `parse_qs` local to `do_GET`, breaking Evidence requests before they could return a response. The local import was removed so the module-level parser is used consistently.
- The Target Plan register regression assertion now expects the read-only `View` button in the Evidence column instead of the obsolete placeholder cell.
- Removed the redundant footer `Close` button from the Target Plan Evidence modal, retaining the header Close control and the footer's read-only folder/status information. Bumped the Plans script cache key and added a regression assertion that the modal contains exactly one Close button.
- PDF and image previews now request `POST /evidence/preview` with the module, record ID, and filename in a small JSON body. The host validates the requested path and returns the file bytes as base64 inside a JSON response; the UI reconstructs a typed Blob and renders it from a temporary object URL in the prepared preview panel. Keeping the PDF bytes out of a navigable PDF-typed GET response avoids the download-manager interception observed during manual browser checks. The existing GET `/evidence/file` remains for original DOC/DOCX downloads. Object URLs are revoked when another file is selected, the list is refreshed, or the modal closes.

## Versioning and validation rule

- Global UI labels, shared shell navigation, and reusable contracts must use stable, version-neutral names.
- Version-specific feature decisions and implementation history belong in this Version-History area.
- The last confirmed full test result before the Evidence viewer implementation was `379 passed`; rerun the local suite after pulling these changes.
