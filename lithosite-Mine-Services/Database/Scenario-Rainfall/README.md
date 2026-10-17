# Scenario-Rainfall

Auxiliary file area for Rainfall Simulation documentation and deliberate exports. This directory is not a second database.

## Source of truth

Scenario inputs, run status, identifiers, and compact result summaries belong in the canonical `RainfallSimulation` entity stored in `../Mine-Services-Database-A3.xlsx`, written through RuntimeAdapter/A3. Do not store parallel JSON/CSV scenario records here, and do not create a separate Rainfall workbook.

## Directories

- `Exports/` — user-requested exported reports or artifacts only; no automatic export of every run.
- `Evidence/` — supporting files intentionally retained for audit or review.

Source topography remains in the existing topography storage workflow. Any future automated file write must define its format, naming, and retention contract before implementation.
