# V40 Desktop Runtime Acceptance — Operational A3

> **Historical procedure — gate deferred at V40 lock.** This checklist was retained for traceability. The V40 lock explicitly records operational A3 runtime acceptance as deferred/not evidenced by CI, not as PASS. Use it only if the owner later requests a runtime acceptance session; it is not an open V40 release blocker.

**Status: OPEN — local evidence required.** This checklist is intentionally separate from CI pytest results. CI creates an isolated temporary A3 workbook fixture; it does not prove that the developer's operational workbook opens correctly or that the installed Desktop Host uses it.

## Safety boundary

- Do not replace, regenerate, migrate, or reset `Database/Mine-Services-Database-A3.xlsx` as part of this acceptance.
- Before any write test, make a separate verified backup of the operational workbook and use an explicitly disposable record. The read-only checks below do not require a write test.
- Keep Target vs Actual business semantics on HOLD according to the global reminder in `Documentation/README.md`.
- Do not edit or use the locked V39 artifact for V40 acceptance.

## Gate A — confirm branch and automated test evidence

1. Confirm the checked-out branch is `v40-workspace`.
2. Confirm the local full suite passes on the current pulled HEAD:
   ```powershell
   git status --short --branch
   git rev-parse HEAD
   python -m pytest -q
   ```
3. Confirm the GitHub Actions Full Pytest run for that exact HEAD is successful. Record the run URL and commit SHA in the acceptance record.

## Gate B — validate the configured operational workbook without modifying it

From `lithosite-Mine-Services`, run:

```powershell
$env:MINE_SERVICES_DB = (Resolve-Path .\Database\Mine-Services-Database-A3.xlsx).Path
python -c "import os,zipfile; p=os.environ['MINE_SERVICES_DB']; z=zipfile.ZipFile(p); bad=z.testzip(); print('Workbook ZIP integrity:', 'PASS' if bad is None else 'FAIL: '+bad); z.close()"
```

Expected: the path resolves to the intended local operational A3 workbook and ZIP integrity reports PASS. This command only reads the file. If it fails, stop and investigate the local file/backup; do not regenerate it from the CI fixture.

## Gate C — health and read-only runtime smoke test

1. Start the application using the normal Desktop Host launcher.
2. Confirm the browser opens the V40 Stage 29 artifact through `http://127.0.0.1:8765/`.
3. In PowerShell, verify health:
   ```powershell
   Invoke-RestMethod http://127.0.0.1:8765/health | ConvertTo-Json -Depth 5
   ```
   Expected: `status = READY`, `offline = true`, `schema = A.3`.
4. Confirm the UI status reports Database + Runtime Ready and the map cache status is expected for the current offline state.
5. Open representative modules without saving changes: Work Control/dashboard, Equipment, Work Front, Operations, Target Plan, and Reports. Confirm no blocking load errors, blank-page failure, or unexpected console errors.
6. Open and close the Add Operation and Add Work Front dialogs. Verify date/time picker icons remain visible in Deep Navy.
7. Check that existing records render and refresh consistently. Do not infer business approval from Plan vs Actual sample values.

## Gate D — persistence test (only after a verified backup)

This gate is optional for read-only runtime acceptance and must not be run against the operational workbook without owner authorization and a verified backup. If approved, use a clearly disposable record, verify CREATE/READ/DELETE through the UI, confirm the audit trail and Evidence lifecycle where applicable, then verify the disposable record is removed. Never use a real production record as a test fixture.

## Evidence to record

- Local branch and exact HEAD SHA
- Full pytest result and matching GitHub Actions run URL
- Operational workbook path confirmation and ZIP integrity result (do not publish workbook contents)
- Health response fields: status, offline, schema
- Modules opened and result; any console errors
- Whether a write test was skipped or approved; if approved, backup confirmation and disposable record result
- Screenshot(s) of the app status and any failure

## Exit criteria

- Gates A–C pass with evidence; Gate D is either approved and passed or explicitly marked not run.
- No operational workbook mutation occurred during read-only checks.
- Any failure is recorded as OPEN with a reproducible cause; do not declare runtime acceptance based on CI alone.

**Decision rule:** This checklist does not lock V40 by itself. Overall V40 release/baseline lock requires all other applicable gates to be resolved or explicitly deferred with an owner-approved rationale.
