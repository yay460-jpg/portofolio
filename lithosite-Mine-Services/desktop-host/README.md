# Mine Services Desktop Host

Local loopback host for the Desktop Master UI.

## Purpose

The browser UI must not import Python directly and must not create a second
browser persistence layer. This host provides the integration boundary:

`Operations UI → localhost host → RuntimeAdapter → ApplicationService → XLSX/AuditLog`

The host binds only to `127.0.0.1` and has no external network dependency.

## Start

From the `lithosite-Mine-Services` directory:

```powershell
python desktop-host/server.py
```

Optional database override:

```powershell
$env:MINE_SERVICES_DB="D:\path\to\Mine-Services-Database-A3.xlsx"
python desktop-host/server.py
```

Default database:

`Database/Mine-Services-Database-A3.xlsx`

## Browser

The launcher opens the V40 Stage 29 workspace artifact through the Desktop Host. The V39 Stage 28 artifact is retained as the locked baseline reference. The runtime health check is:

`GET http://127.0.0.1:8765/health`

and sends runtime requests to:

`POST http://127.0.0.1:8765/runtime`

No IndexedDB, localStorage, Google Sheets, Apps Script, CDN, cloud database,
or remote REST service is used by this integration.

## Status

V40 workspace: derived from the locked V39 baseline; launcher and default entrypoint now target the V40 Stage 29 artifact. The V39 baseline's full suite passed 434 tests in 27.15s; the full suite should be rerun locally after workspace initialization.

The canonical A3 database and Python RuntimeAdapter architecture are carried forward. Android remains a later follower host and is not part of this desktop workspace.
