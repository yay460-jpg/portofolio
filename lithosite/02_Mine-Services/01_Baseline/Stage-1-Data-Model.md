# Mine Services — Stage 1 Data Model

## Status

Stage 1 — Data Model foundation.

## Scope

Mine Services is an independent Lithosite product module focused on mine-service operational control.

## Source-of-Truth Contract

1. Master data
2. Operational transactions
3. Validation
4. KPI calculation
5. Reporting
6. Audit

The dashboard is a presentation layer and must not become the source of truth.

## Master Data

- Equipment Master
- Work Front Master

## Transaction Data

- Daily Operations

## Planned Next Stages

- Stage 2: operational domain transactions — road, drainage/dewatering, land clearing, disposal/stockpile, reclamation
- Stage 3: maintenance events and fleet KPI engine
- Stage 4: planning, budget, daily/weekly/monthly reporting
- Stage 5: K3 and environment
- Stage 6: reporting, audit, and validation hardening
- Stage 7: security evolution
- Stage 8: final baseline

## Current Storage

The Stage 1 prototype uses browser Local Storage for validation only.

This is not production persistence and makes no production security claim.

## Development Rule

Do not patch KPI numbers manually.

KPI values must eventually be derived from traceable source records.
