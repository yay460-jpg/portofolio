# Stage 11 — Maintenance Final Evidence

**Module:** Lithosite | Mine Services  
**Stage:** 11  
**Artifact:** Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v23-STAGE11.html  
**Baseline:** V22 — LOCKED / STABLE  
**Workspace:** V23 — ACTIVE Stage 11  
**Schema:** A.2

## Evidence summary

| Acceptance item | Evidence | Status |
|---|---|---|
| Maintenance reachable from V23 shell | V23 artifact + V23 shell navigation | PASS |
| Maintenance module loaded | `ui/modules/maintenance/maintenance.js` wired into V23 | PASS |
| A.2 Equipment unit reference | Equipment exposes `unit_no`; Maintenance resolves Equipment FK to unit/fleet label | PASS |
| Maintenance schema fields represented | maintenance_id, equipment_id, event_date, event_type, failure_code, start_time, end_time, downtime_hours, action, status, source | PASS |
| Runtime CRUD | Maintenance READ/CREATE/UPDATE/DELETE routed through RuntimeAdapter | PASS |
| Equipment FK validation | Maintenance requires a valid Equipment reference | PASS |
| Controlled vocabulary | Runtime `_Lists`: maintenance_event_type and maintenance_status | PASS |
| Equipment reference protection | Equipment deletion is rejected when Maintenance references exist | PASS |
| Audit | Runtime transaction path records Maintenance CREATE / UPDATE / DELETE | PASS |
| XLSX persistence | Runtime persistence uses the A.2 XLSX contract | PASS |
| Browser database isolation | No IndexedDB/localStorage in Maintenance UI | PASS |
| Runtime error handling | Runtime/validation failures are surfaced separately from empty-state rendering | PASS |
| Stage 11 shell contract | Dashboard, Operations, Equipment, Work Front, and Maintenance are required shell screens | PASS |
| Regression suite | Full pytest suite | **PASS — 77 passed in 2.46s** |
| Maintenance visual alignment | Current UI is functional, but its table-row/layout presentation is not yet aligned with the established Equipment/Work Front/Operations pattern | **DEFERRED — UI change intentionally not made** |

## Functional evidence

The V23 Maintenance screen was opened against the local desktop runtime and verified with an Equipment reference:

- Equipment unit/fleet number: `DT-001`
- Equipment type: Dump Truck
- Maintenance record created and displayed through RuntimeAdapter
- Event Type was exercised with `Inspection` and later `Breakdown`
- The Maintenance record was subsequently deleted successfully
- The Equipment record remained protected while it was referenced by Maintenance

The Maintenance Equipment selector displays the human-facing unit/fleet identifier while the stored relationship remains the immutable `equipment_id` foreign key.

## Runtime acceptance

Automated and manual acceptance currently covers:

1. Maintenance screen is reachable through the V23 shell.
2. Maintenance JS is wired to the V23 workspace.
3. RuntimeAdapter is the only UI CRUD path.
4. Required Maintenance fields are represented.
5. Equipment FK and controlled vocabulary are runtime-authoritative.
6. Maintenance CREATE / UPDATE / DELETE operations execute through the transaction path.
7. Equipment deletion protection is preserved when Maintenance references exist.
8. Browser UI does not directly use IndexedDB or localStorage.
9. Full regression suite is green: **77 passed in 2.46s**.

## Database / schema evidence

Schema A.2 introduces `Equipment.unit_no` as the human-facing unit/fleet identifier.

The system PK remains `equipment_id`. Maintenance continues to store only `equipment_id`; `unit_no` is resolved for display and selection and is not duplicated into Maintenance.

The local A.2 database copy is kept separate from the original database file. The original `Mine-Services-Database.xlsx` is not overwritten by the migration workflow.

## UI evidence / deferred item

The current Maintenance screen is operational and its CRUD/runtime behavior is verified. The Maintenance table presentation is visibly different from the established Equipment/Work Front/Operations layout, particularly in row positioning/spacing.

Per the current Stage 11 instruction, **no additional UI/layout change is being made at this checkpoint**. This is intentionally recorded as a deferred visual refinement, not silently treated as complete.

## Baseline protection

- V22 remains LOCKED / STABLE.
- V22 artifact and V22 shell are not modified by Stage 11 work.
- V23 is the active Stage 11 workspace.
- No V24 artifact is created at this checkpoint.

## Current gate state

**FUNCTIONAL GATE: PASS**

**VISUAL REFINEMENT: DEFERRED**

Stage 11 should remain **ACTIVE** until the Maintenance visual alignment is explicitly accepted or the deferred UI refinement is completed. No V24 creation is authorized from this evidence checkpoint.
