# Evidence Storage

This folder is the central local file store for operational evidence referenced by Mine Services records.

## Folder layout

Store files in a module and record-specific directory:

- `Evidence/TargetPlan/<plan_id>/` — mine-out evidence, jointly agreed PDFs, photos, and other Target Plan supporting records.
- `Evidence/HSE/<hse_id>/` — incident and HSE observation photos/documents.
- `Evidence/Maintenance/<maintenance_id>/` — equipment fault, component, troubleshooting, and repair evidence.

After a Target Plan, HSE event, or Maintenance event is successfully created through RuntimeAdapter, the Desktop Host creates its corresponding record directory automatically. Opening the list does not create orphan folders. Upload verifies the selected record through RuntimeAdapter before saving a file.

## Supported files

- PDF — preview in the Evidence modal.
- JPG / JPEG / PNG — image preview in the Evidence modal.
- DOC / DOCX — listed in the modal and downloaded as the original document because the browser does not provide a built-in Word preview.

Each uploaded file is limited to 100 MB. The viewer also refuses to open files larger than 100 MB.

## Current workflow

The Target Plan table and HSE register expose an **Evidence** action for an individual record. Maintenance exposes the same action on each event inside its Maintenance Timeline, ensuring files attach to a specific `maintenance_id` rather than to a grouped timeline. Each action opens the shared Evidence modal with the record's module and stable ID. The **Upload** button lets a user select one or more local files; the user cannot choose the destination or create a storage folder. The Desktop Host saves each accepted file to the selected record's application-managed directory. Selecting a PDF or image previews it in the modal; DOC/DOCX files are downloaded as originals. **Refresh list** rescans the folder.

Upload is enabled for verified Target Plan, HSE, and Maintenance records. Supported extensions are PDF, JPG/JPEG, PNG, DOC and DOCX, with a 100 MB per-file limit. Empty files, unsupported filenames/types, and duplicate filenames are rejected; existing files are never overwritten silently.

Deleting a Target Plan, HSE event, or Maintenance event first requires RuntimeAdapter to commit the record deletion. Only after that commit does the Desktop Host remove that record's Evidence folder and contents. Other record folders are not touched; the RuntimeAdapter audit entry is retained. If folder cleanup fails, the mutation result reports that cleanup remains incomplete.

The **View / Evidence** trigger in Target Plan, HSE, and each Maintenance timeline event turns green only when the Desktop Host confirms one or more supported Evidence files in that record's folder. Empty folders and unavailable status checks keep the default button style. The indicator is informational and does not change record approval or validation status.

## Safety and handling

- The local Desktop Host exposes dedicated Evidence endpoints rather than making the whole `Database/` tree web-accessible. Upload is enabled only for records verified through RuntimeAdapter, with allowlisted extensions, filename/path checks, a 100 MB per-file limit, and create-exclusive writes to prevent silent overwrite.
- Filenames must be direct children of their record folder. Nested paths, path traversal, symbolic links, unsafe/reserved names, and unsupported extensions are rejected/ignored.
- Evidence may contain sensitive site, contractor, incident, or equipment information. Do not commit real operational evidence files to Git. Keep only this README and empty directory placeholders in the repository.
- The local `.gitignore` preserves the directory placeholders while excluding operational files in record-specific folders from Git, so incident photos, mine-out evidence, and contractor documents are not accidentally committed.
- Evidence files are stored on the local machine next to the configured database workbook; an explicit `MINE_SERVICES_DB` override uses an `Evidence/` folder next to that workbook.
