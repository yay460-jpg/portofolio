# Stage 8 — Final Evidence & PASS Record

**Module:** Lithosite | Mine Services  
**Stage:** 8 — Operations UI + Desktop Runtime Host  
**Status:** PASS / BASELINED  
**Baseline:** Operations v20.1 LOCKED  
**Schema:** A.1  
**Runtime Boundary:** RuntimeAdapter  
**Persistence:** Local XLSX  
**Host:** desktop-host/server.py  
**Baseline commit:** a3ed5e603c6173601ab8b0c6ba004a816cc3e7b2

## 1. Scope Closed

Stage 8 closes the first functional desktop transaction screen against the locked Desktop Master navigation contract.

Implemented path:

`Operations UI → Desktop Host → RuntimeAdapter → ApplicationService → Validation / Transaction → XLSX Persistence → AuditLog`

The UI does not maintain a second browser database and does not write XLSX directly.

## 2. Evidence

### UI contract
- Operations screen is present in the locked V20.1 artifact.
- Runtime client and Operations module are wired.
- READ is routed through runtime for Operations, WorkFront, and Equipment.
- CREATE / UPDATE / DELETE are routed through RuntimeAdapter.
- Edit and delete actions are present.
- Runtime connection state is exposed.
- No IndexedDB/localStorage persistence is introduced.
- A.1 lifecycle values are used: `DRAFT`, `VALIDATED`, `REJECTED`, `VOIDED`.

### Desktop host
- `GET /health` reports offline-ready state and Schema A.1.
- `POST /runtime` routes requests to the RuntimeAdapter path.
- Disallowed browser origins are rejected.
- Host binds to loopback and is not a network service.

### Functional runtime acceptance
The completed local acceptance cycle covered:
1. Runtime Ready.
2. Records loaded from local XLSX.
3. Valid CREATE.
4. Persistence after refresh.
5. CREATE audit event.
6. UPDATE and corresponding audit.
7. DELETE and corresponding audit.
8. Invalid reference / numeric input rejected by runtime.
9. Runtime Error distinguished from zero-record state.

### Regression
The existing Stage 2–5 runtime, validation, transaction, XLSX persistence, snapshot, and audit boundaries were retained during Stage 8. The Stage 8 UI contract test was corrected to target the locked V20.1 artifact in commit `8c733f8809fba78d7c03c9b936e4553ac8490bb9`.

## 3. Integrity Decision

**PASS**

Stage 8 is now treated as a closed baseline. No open Stage 8 implementation item is carried into Stage 9.

The V20.1 Operations artifact remains locked. Future changes require a new revision and must not silently modify the baseline.

## 4. Stage 9 Gate

Stage 9 begins with the next screen in the Stage 7 implementation order:

**Equipment**

Scope starts with contract alignment and UI implementation against the existing A.1 `Equipment` entity. It must use the same RuntimeAdapter boundary and the same offline XLSX persistence path established by Stage 8.