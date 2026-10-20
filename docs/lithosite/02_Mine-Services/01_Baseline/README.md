# Mine Services — Baseline

## Current Baseline

**Stage 1 — Data Model**

The current baseline establishes the domain entities and source-of-truth flow before operational transaction features are implemented.

## Master Data

- Equipment Master
- Work Front Master

## Transaction Foundation

- Daily Operations

## Baseline Contract

```text
Master Data
    ↓
Operational Transactions
    ↓
Validation
    ↓
KPI Calculation
    ↓
Reporting
    ↓
Audit
```

## Prototype Storage

The Stage 1 prototype uses browser Local Storage for validation only.

This is not production persistence and does not constitute a production security contract.

## KPI Rule

KPI values must eventually be derived from traceable source records.

Manual KPI number patching is not part of the production contract.

## Baseline Lock Rule

A section that has passed audit is not rewritten casually. Changes must be introduced through an explicit revision and documented in the appropriate version-history/baseline record.
