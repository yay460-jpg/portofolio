# Stage 8 — Desktop Runtime Host

**Status:** DRAFT / IMPLEMENTATION  
**Desktop Master:** Operations UI  
**Runtime Boundary:** RuntimeAdapter  
**Persistence:** Local XLSX Schema A.1  
**Network:** Loopback only

## Flow

`Operations UI → 127.0.0.1:8765 → RuntimeAdapter → RuntimeInterface → ApplicationService → PersistenceStore / AuditRepository`

The browser never imports Python directly and does not create IndexedDB/localStorage persistence.

## Host

`desktop-host/server.py`

- binds to `127.0.0.1`;
- exposes `GET /health`;
- exposes `POST /runtime`;
- allows the local Live Server origins `127.0.0.1:5500` and `localhost:5500`;
- rejects other browser origins;
- uses the Schema A.1 workbook configured by `MINE_SERVICES_DB`;
- defaults to `Database/Mine-Services-Database.xlsx`.

## Security / Integrity

The host is a local integration transport only. It does not implement business validation, persistence rules, or audit logic. Those remain inside RuntimeAdapter/ApplicationService.

## Current Boundary

This is the Desktop Master integration path. Android/Chaquopy remains a later follower host and is not modified by this Stage 8 implementation.
