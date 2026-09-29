# Stage 13 — Offline Desktop Runtime

## Purpose

Mine Services is designed as a full offline-first desktop runtime. The browser UI must not depend on VS Code Live Server or any network service.

## Runtime Architecture

```
Windows
  ↓
start-mine-services.bat
  ↓
Python Desktop Host :8765
  ├── UI / HTML / JavaScript / assets
  └── RuntimeAdapter
        ↓
      XLSX A.2
```

The browser communicates only with the local loopback host:

`http://127.0.0.1:8765/`

No internet connection is required for the application runtime.

## Official Startup

Use:

`desktop-host/start-mine-services.bat`

The launcher:

1. Sets `MINE_SERVICES_DB` to `Database/Mine-Services-Database-A2.xlsx`.
2. Checks whether the local host is already running.
3. Starts `desktop-host/server.py` when required.
4. Waits for `/health` to report READY.
5. Opens `http://127.0.0.1:8765/` in the default browser.

## Port Contract

The default port is fixed at **8765**.

`MINE_SERVICES_PORT` may override it for a deliberate deployment configuration, but the official launcher uses the default:

`127.0.0.1:8765`

The port is not temporary or randomly allocated. The process listening on the port is temporary: it exists while the Desktop Host is running.

## Live Server Policy

VS Code Live Server is **not part of the Mine Services runtime architecture**.

Live Server may be used for development-only static inspection, but the official CRUD/runtime validation path is:

`Browser → Desktop Host → RuntimeAdapter → XLSX`

This separation prevents XLSX persistence from triggering browser reloads.

## Database Protection

The original Schema A.1 workbook remains untouched.

The runtime database is:

`Database/Mine-Services-Database-A2.xlsx`

Local runtime changes to XLSX are expected and must not be reverted or committed accidentally.

## Recovery

If Windows or Python is restarted, run `start-mine-services.bat` again. The launcher recreates the local runtime process on the same default port and opens the application.

## Stage 13 Gate

The offline desktop host and launcher are contract-tested by:

`tests/test_stage13_desktop_host.py`

The launcher is a deployment/startup layer, not a module-specific workaround.
