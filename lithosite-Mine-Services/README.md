# Lithosite — Mine Services

Mine Services is a Lithosite module designed as a **full offline-first desktop runtime**.

## Current Runtime

- Schema: A.2
- Database: `Database/Mine-Services-Database-A2.xlsx`
- Runtime: Python Desktop Host
- Default local endpoint: `http://127.0.0.1:8765/`
- Runtime database path: local XLSX
- VS Code Live Server: development-only, not the official runtime

## Open Mine Services

### Normal use / offline runtime

Double-click:

`Start-Mine-Services.bat`

The launcher starts the local Desktop Host when needed, waits for `/health`, and opens Mine Services in the browser.

The same launcher is available under:

`desktop-host/start-mine-services.bat`

### Development / UI work

Use VS Code and Live Server for static UI development when required.

For CRUD, persistence, validation, transaction, audit, and offline acceptance testing, use the Desktop Host:

`http://127.0.0.1:8765/`

Do not use Live Server as the runtime acceptance path.

## Runtime Architecture

```
Start-Mine-Services.bat
        ↓
Python Desktop Host :8765
        ├── UI / HTML / JS / assets
        └── RuntimeAdapter
                ↓
        Mine-Services-Database-A2.xlsx
```

This architecture removes the dependency on Live Server and prevents XLSX persistence from causing development-server browser reloads.

## Project Structure

- `Database/` — offline XLSX database
- `Documentation/` — contracts, evidence and stage records
- `Artifacts/` — Desktop Master HTML artifacts
- `desktop-host/` — local runtime host and launcher
- `ui/` — shell and modules
- `src/` — validation, transaction and persistence services
- `tests/` — automated regression and contract tests

## Stage State

- V24 — Stage 12 — FINAL / LOCKED BASELINE
- V25 — Stage 13 — ACTIVE WORKSPACE
- Plans — functional gate in progress
- Offline Desktop Runtime — implemented
- Offline Desktop Launcher — implemented

## Database Protection

The original A.1 workbook remains a protected predecessor.

The active A.2 runtime database is:

`Database/Mine-Services-Database-A2.xlsx`

Local XLSX changes are expected during runtime testing. Do not use destructive Git commands to restore or delete local database changes.

## Important

The local port number `8765` is a fixed default, not a randomly allocated temporary port. The Python process is temporary and can be restarted; the launcher starts it again on the same endpoint.

For a Windows restart or when the host is stopped, simply run `Start-Mine-Services.bat` again.
