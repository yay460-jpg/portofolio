# Evidence Storage

This folder is the central local file store for operational evidence referenced by Mine Services records.

## Folder layout

Store files in a module and record-specific directory:

- `Evidence/TargetPlan/<plan_id>/` — mine-out evidence, jointly agreed PDFs, photos, and other Target Plan supporting records.
- `Evidence/HSE/<hse_id>/` — incident and HSE observation photos/documents.
- `Evidence/Maintenance/<maintenance_id>/` — equipment fault, component, troubleshooting, and repair evidence.

The Desktop Host creates a record directory when its Evidence list is first opened. The module and record ID are taken from the application, not supplied as a filesystem path.

## Supported files

- PDF — preview in the Evidence modal.
- JPG / JPEG / PNG — image preview in the Evidence modal.
- DOC / DOCX — listed in the modal and downloaded as the original document because the browser does not provide a built-in Word preview.

Files larger than 100 MB are not opened by the Evidence viewer.

## Current workflow

The Target Plan table's **Evidence → View** button opens a read-only Evidence modal. It lists files already present in that plan's folder; selecting a PDF or image previews it in the modal. The modal's **Refresh list** button rescans the folder after files are copied into it.

There is no upload control in the table or modal at this stage. Until an upload workflow is implemented, place files into the corresponding record folder manually and keep the record ID in the folder name unchanged.

## Safety and handling

- The local Desktop Host exposes only files with the approved extensions through dedicated read-only Evidence endpoints. It does not make the whole `Database/` tree web-accessible.
- The filename must be a direct child of its record folder. Nested paths, path traversal, symbolic links, and unsupported extensions are rejected/ignored.
- Evidence may contain sensitive site, contractor, incident, or equipment information. Do not commit real operational evidence files to Git. Keep only this README and empty directory placeholders in the repository.
- Evidence files are stored on the local machine next to the configured database workbook; an explicit `MINE_SERVICES_DB` override uses an `Evidence/` folder next to that workbook.
