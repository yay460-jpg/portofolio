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
$env:MINE_SERVICES_DB="D:\path\to\Mine-Services-Database.xlsx"
python desktop-host/server.py
```

Default database:

`Database/Mine-Services-Database.xlsx`

## Browser

Open the Operations v1 HTML through Live Server on the normal local port
(`127.0.0.1:5500`). The UI checks:

`GET http://127.0.0.1:8765/health`

and sends runtime requests to:

`POST http://127.0.0.1:8765/runtime`

No IndexedDB, localStorage, Google Sheets, Apps Script, CDN, cloud database,
or remote REST service is used by this integration.

## Status

Stage 8 desktop integration host: implementation in progress.
Android remains a later follower host and is not part of this desktop step.
