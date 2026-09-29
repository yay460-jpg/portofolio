# Stage 11 — Maintenance Final Evidence

**Module:** Lithosite | Mine Services  
**Stage:** 11  
**Artifact:** Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v23-STAGE11.html  
**Baseline:** V22 — LOCKED / STABLE  
**Workspace:** V23 — CLOSED / LOCKED  
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
| Maintenance visual alignment | Final V23 UI verified against Equipment/Work Front/Operations pattern; row starts directly below header and actions remain inline | **PASS** |

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

## UI evidence

Final desktop visual verification was completed on V23 after the Maintenance table-row alignment refinement. The Maintenance table now follows the established Equipment / Work Front / Operations presentation:

- table header remains fixed at the top of the table panel;
- data rows begin directly below the header;
- columns remain horizontally aligned with the header;
- Edit/Delete actions remain inline on the same row;
- empty-state centering remains scoped to the empty-state message rather than the data-row container.

Final visual refinement commit: **478fd2c — fix(stage11): align Maintenance rows with master table layout**.

## Baseline protection

- V22 remains LOCKED / STABLE.
- V22 artifact and V22 shell are not modified by Stage 11 work.
- V23 is the active Stage 11 workspace.
- No V24 artifact is created at this checkpoint.

## Final gate state

**FUNCTIONAL GATE: PASS**  
**VISUAL GATE: PASS**  
**REGRESSION GATE: PASS**  
**STAGE 11: CLOSED / LOCKED**

V23 is the final Stage 11 artifact. No V24 is created as part of this closure. Any future change to Maintenance must begin under a new explicitly opened stage/workspace and must not modify the locked Stage 11 evidence retrospectively.


## Post-Lock Cosmetic Verification
- Native date/time picker indicators are now explicitly rendered under the dark form color scheme (`color-scheme: dark`).
- This is a visibility-only fix; no layout, data contract, runtime behavior, or schema was changed.
- Chromium/Edge native picker indicators now receive a targeted light-contrast filter; no icon pack or layout change was introduced.
- Regression contract test added and passed.


## Final V23 Baseline Lock
- V23 is the final Stage 11 baseline and is now locked against further feature or UI changes.
- Work Front action buttons are aligned with the common CRUD mini-button contract, including Delete color treatment.
- Final regression target after the final cosmetic alignment is 79 passed.
- V22 remains the protected predecessor baseline. The next workspace must branch from V23 rather than modify V23 in place.
