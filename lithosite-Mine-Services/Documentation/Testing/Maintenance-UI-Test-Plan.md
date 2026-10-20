# Stage 11 — Maintenance UI Test Plan

**Module:** Lithosite | Mine Services  
**Stage:** 11  
**Artifact:** `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v23-STAGE11.html`  
**Shell:** `ui/shared/shell-navigation-v23.js`  
**Module JS:** `ui/modules/maintenance/maintenance.js`  
**Schema:** A.2

## Objective

Verify that Maintenance is a complete Desktop Master operational screen and that its UI remains contract-aligned with the RuntimeAdapter, authoritative schema, Equipment FK, controlled vocabulary, audit path, XLSX persistence, and established Operations / Equipment / Work Front layout.

## Test cases

| ID | Test | Expected result |
|---|---|---|
| S11-UI-01 | Open V23 and select Maintenance | Maintenance screen is reachable and active |
| S11-UI-02 | Verify Maintenance JS wiring | V23 loads `maintenance.js?v=20261005` |
| S11-UI-03 | Verify Runtime health | Runtime Ready is displayed |
| S11-UI-04 | READ Maintenance | Existing Maintenance rows render from RuntimeAdapter |
| S11-UI-05 | Equipment selector | Equipment references come from runtime Equipment data and display human-facing `unit_no` |
| S11-UI-06 | Controlled lists | Event Type, Action, and Status values come from runtime `_Lists` |
| S11-UI-07 | CREATE | Valid Maintenance record commits through RuntimeAdapter |
| S11-UI-08 | UPDATE | Existing Maintenance record updates without changing PK |
| S11-UI-09 | DELETE | Valid unreferenced Maintenance record deletes through RuntimeAdapter |
| S11-UI-10 | FK validation | Invalid / missing Equipment reference is rejected by runtime validation |
| S11-UI-11 | Controlled-value validation | Invalid controlled values are rejected |
| S11-UI-12 | Equipment reference protection | Equipment deletion is rejected while Maintenance references it |
| S11-UI-13 | Audit | Maintenance CREATE / UPDATE / DELETE are recorded through the transactional audit path |
| S11-UI-14 | Persistence | Committed Maintenance data survives XLSX reload |
| S11-UI-15 | Browser isolation | Maintenance UI contains no IndexedDB/localStorage database path |
| S11-UI-16 | Error state | Runtime/validation failures are shown distinctly from zero-record state |
| S11-UI-17 | Visual alignment | Maintenance table header, rows, spacing, and inline actions follow Equipment / Work Front / Operations pattern |
| S11-UI-18 | Regression | Full pytest suite remains green |

## Final result

Manual desktop verification completed on V23. The Maintenance row-layout issue was corrected so data rows start directly below the table header and remain horizontally aligned with the header.

Automated regression result:

**77 passed in 2.46s**

## Closure

All Stage 11 acceptance items are PASS. Stage 11 is CLOSED / LOCKED. V23 remains the final Stage 11 artifact; no V24 is created by this test plan.
