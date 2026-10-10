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
- Dedicated Desktop Host Evidence endpoints restrict file access to allowlisted modules, record IDs, and approved extensions. The upload endpoint is enabled for Target Plan only and verifies the plan through RuntimeAdapter. Other content in `Database/` remains protected from static web access.
- Added an **Upload** button in the Evidence files panel. It accepts multiple local files without exposing a destination picker; the Desktop Host determines the destination from the active `plan_id`. Supported extensions are PDF, JPG/JPEG, PNG, DOC, and DOCX, up to 100 MB per file. Empty files, unsafe filenames, unsupported extensions, and duplicate names are rejected; upload never silently overwrites an existing file. **Refresh list** rescans the folder.
- A `.gitignore` under `Database/Evidence/` excludes operational evidence from Git to reduce the risk of accidentally committing sensitive PDFs and photographs.
- Endpoint regression tests exposed a query-parser name-shadowing bug in the Desktop Host's user-guide route: a local import made `parse_qs` local to `do_GET`, breaking Evidence requests before they could return a response. The local import was removed so the module-level parser is used consistently.
- The Target Plan register regression assertion now expects the read-only `View` button in the Evidence column instead of the obsolete placeholder cell.
- Removed the redundant footer `Close` button from the Target Plan Evidence modal, retaining the header Close control and the footer's read-only folder/status information. Bumped the Plans script cache key and added a regression assertion that the modal contains exactly one Close button.
- PDF and image previews now request `POST /evidence/preview` with the module, record ID, and filename in a small JSON body. The host validates the requested path and returns the file bytes as base64 inside a JSON response; the UI reconstructs a typed Blob and renders it from a temporary object URL in the prepared preview panel. Keeping the PDF bytes out of a navigable PDF-typed GET response avoids the download-manager interception observed during manual browser checks. The existing GET `/evidence/file` remains for original DOC/DOCX downloads. Object URLs are revoked when another file is selected, the list is refreshed, or the modal closes.
- Target Plan folder lifecycle is now tied to RuntimeAdapter mutations: a folder is created only after a Plan CREATE commits; after a Plan DELETE commits, the Desktop Host removes only that plan's Evidence folder and files. A failed/rejected deletion leaves evidence untouched. AuditLog entries for the Plan deletion are retained, and cleanup failure is surfaced to the user rather than reported as full success.
- Moved the selected file's preview type and filename (for example, `Image preview: <filename>`) from the standalone status line into the right side of the Preview panel header. The in-content duplicate filename toolbar was removed to reduce repetition; list/loading/error states continue to use the status line when appropriate.
- Extracted the Evidence viewer's listing, upload, PDF/image preview, Word download, refresh, status, and temporary Blob URL management into the reusable `ui/shared/evidence/evidence.js` module; moved its layout styles into `ui/shared/evidence/evidence.css`. The application shell now loads the shared assets once, uses the neutral `evidenceModal` ID, and registers that modal through the shared modal contract. Target Plan passes its module and record context via `LithositeEvidence.open(...)`; upload remains enabled only for Target Plan until HSE/Maintenance host-side record authorization and lifecycle tests are added. The shared API and future integration rules are documented in `ui/shared/evidence/README.md`.
- Replaced the browser-native `window.confirm` used by Target Plan deletion with a Lithosite-styled confirmation modal registered in the shared modal shell contract. The dialog shows the Target Plan ID, exact managed Evidence folder, permanent-deletion warning, and retained RuntimeAdapter audit log, with explicit Cancel and Delete Plan & Evidence actions. Escape, backdrop click, Close, and Cancel dismiss without deleting; only the destructive action proceeds to RuntimeAdapter.
- Evidence listing no longer creates folders for arbitrary IDs. Existing/legacy Plan folders can be prepared when a verified Plan uploads its first file.

## Versioning and validation rule

- Global UI labels, shared shell navigation, and reusable contracts must use stable, version-neutral names.
- Version-specific feature decisions and implementation history belong in this Version-History area.
- The last confirmed full test result before the Lithosite-native Delete confirmation and shared Evidence module extraction was `416 passed`. Rerun the local suite after pulling these refactoring changes before treating the shared component as validated.
