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

Open the V38 Stage 27 HTML through the Desktop Host or development tooling as appropriate. The runtime health check is:

`GET http://127.0.0.1:8765/health`

and sends runtime requests to:

`POST http://127.0.0.1:8765/runtime`

No IndexedDB, localStorage, Google Sheets, Apps Script, CDN, cloud database,
or remote REST service is used by this integration.

## Status

V38 Desktop Host: implemented and validated against the canonical A3 database.
Android remains a later follower host and is not part of this desktop step.
