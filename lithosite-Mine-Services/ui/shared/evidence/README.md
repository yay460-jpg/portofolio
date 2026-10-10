# Lithosite Evidence Shared Module

## Purpose

`evidence.js` and `evidence.css` are the shared Evidence viewer component used by Lithosite Mine Services. They are loaded once from the application shell and are not owned by Target Plan, HSE, or Maintenance individually.

The shared component owns:
- listing Evidence files for one verified module/record context;
- uploading permitted files into the Desktop Host-managed folder;
- inline PDF and image previews using a POST JSON response and temporary Blob URLs;
- original DOC/DOCX download links;
- refresh, loading/error/upload feedback, and preview URL cleanup;
- opening and closing the single shell-level Evidence modal.

The component does not introduce browser-side persistence. All files remain managed by the Desktop Host under the central Evidence directory.

## Public API

The loaded script exposes the frozen global API `window.LithositeEvidence`:

```javascript
LithositeEvidence.open({
  module: "TargetPlan",
  recordId: planId,
  title: "Target Plan Evidence",
  recordLabel: "PLN-123 · 2026-10-01 to 2026-10-31 · Work Front",
  allowUpload: true
});
```

Required fields:
- `module`: one of `TargetPlan`, `HSE`, or `Maintenance`.
- `recordId`: the record's stable ID, not a folder path.

Optional fields:
- `title`: modal heading. Defaults to `<module> Evidence`.
- `recordLabel`: human-readable record context. Defaults to the record ID.
- `allowUpload`: requests an Upload control. In the current implementation it is only honored for `TargetPlan`; the Desktop Host separately enforces that upload restriction.

The API also exposes `close()`, `refresh()`, and `isOpen()`. `open()` returns whether the modal could be opened. The calling module remains responsible for choosing the correct record and deciding when Evidence should open.

## Adding a module in the future

1. Call `LithositeEvidence.open({ module, recordId, ... })` from the module using the entity's actual stable ID.
2. Add a validated module-to-record check to the Desktop Host before enabling upload for that module. Do not enable upload merely by setting `allowUpload: true`.
3. Keep the storage path derived by Desktop Host from the allowlisted module and validated record ID. The user must never supply a destination directory.
4. Add tests for record existence, invalid IDs, upload authorization, path isolation, duplicate filenames, and the record deletion lifecycle.
5. Keep the shared API and styles generic; module-specific delete/approval rules remain in the owning module.

## Shell contract

The application shell contains one modal with ID `evidenceModal`; it is registered in `modal-show-contract.js`. The shared component script must load after `runtime-client.js` and `modal-show-contract.js`, and before any module that calls `LithositeEvidence.open()`. Its stylesheet is loaded centrally by the shell.

## File safety

Desktop Host remains the authority for module and record validation, approved extensions, the 100 MB per-file limit, create-exclusive file writes, preview bytes, and path safety. Evidence content must not be committed to Git; only documented folder placeholders belong in the repository.
