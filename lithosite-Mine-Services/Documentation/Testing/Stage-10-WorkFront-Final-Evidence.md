# Stage 10 — Work Front Final Evidence

**Module:** Lithosite | Mine Services  
**Stage:** 10  
**Artifact:** Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v22-STAGE10.html  
**Scope:** Work Front master data  
**Baseline protection:** V20.1 Operations + V21 Equipment  
**Schema:** A.1

## Evidence summary

| Acceptance item | Evidence | Status |
|---|---|---|
| Work Front reachable from desktop shell | V22 artifact + V22 shell navigation | PASS |
| A.1 fields represented | work_front_id, domain, location, responsible, status, effective_from, effective_to | PASS |
| Controlled vocabulary | Runtime _Lists: service_domain, work_front_status | PASS |
| Runtime CRUD | WorkFront READ/CREATE/UPDATE/DELETE routed through RuntimeAdapter | PASS |
| Validation | Invalid Work Front domain rejected by runtime validation test | PASS |
| Reference protection | Work Front delete rejected when referenced by Operations | PASS |
| Audit | CREATE / UPDATE / DELETE audit assertions | PASS |
| XLSX persistence | Work Front survives PersistenceStore XLSX reload | PASS |
| Browser database isolation | No IndexedDB/localStorage in Work Front UI | PASS |
| Runtime error handling | Runtime error is distinct from zero-record state | PASS |
| Regression | Full pytest suite remains green | **PASS — 69 passed in 2.34s** |

## Functional evidence

The V22 Work Front screen was opened against the local desktop host and displayed:

- WF-CLOSE-001
- Domain: Road & Hauling
- Location: Test Pit
- Responsible: Test Supervisor
- Status: ACTIVE
- Runtime state: Runtime Ready

The runtime _Lists diagnostic returned authoritative values for service_domain and work_front_status.

## Runtime acceptance

Automated acceptance covers:

1. CREATE a valid WorkFront.
2. UPDATE the existing WorkFront without changing its primary key.
3. Verify the updated persisted row.
4. Verify CREATE / UPDATE / DELETE audit actions.
5. DELETE an unreferenced WorkFront.
6. Reject deletion when Operations references the WorkFront.
7. Reject an invalid controlled vocabulary value.
8. Reload from XLSX and verify WorkFront persistence.

## Baseline protection

Stage 8 and Stage 9 remain protected by their existing regression tests. The V20.1 file is retained as the locked Operations regression anchor; V21 remains the Equipment baseline; V22 is the active Stage 10 Work Front artifact.

## Final gate

Stage 10 is **PASS / BASELINED**. The local full regression run is green: **69 passed in 2.34s**.
