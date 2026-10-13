# V34 Stage 23 — KPI Foundation E2E

Stage 23 completes one end-to-end equipment KPI path:

Existing RuntimeAdapter data → canonical event timeline → Time Baseline → Scheduled / Available / Used → PA / UA → equipment result → fleet result → lineage envelope → historical snapshot.

## Data and timeline

The implementation reads Equipment, Operations, and Maintenance from the existing runtime. The active A3 XLSX schema is not changed by the KPI layer.

Validated Operations rows with positive actual_hours use transaction_time + actual_hours as a derived candidate boundary. Maintenance Breakdown/Corrective events use explicit start_time/end_time.

Events are sliced to scheduled windows. The prototype baseline is 06:00–18:00 with a 12:00–13:00 break, so the scheduled calculation window is 11 hours.

Gaps, overlaps, invalid boundaries, and invalid duration evidence produce NEEDS_VALIDATION. Missing evidence is never filled automatically.

Each canonical source event receives a deterministic event version fingerprint. Changing the source record therefore changes its captured event version without mutating the raw record.

## KPI

PA = Available Time / Scheduled Time × 100%.

UA = Used Time / Available Time × 100%.

EU remains PENDING_DEFINITION. MTBF and MTTR remain HOLD.

## Fleet

Fleet PA and UA use ratio-of-totals over eligible equipment:

ΣAvailable / ΣScheduled

ΣUsed / ΣAvailable

An equipment result that fails timeline validation is retained as an exclusion. The fleet result becomes NEEDS_VALIDATION when exclusions exist, while eligible equipment contributions remain visible.

## Historical snapshot

Stage 23 adds an append-only KPI history sidecar at Database/KPI-History.json.

A final candidate requires PA and UA to be READY plus a policy version and Time Baseline version.

Identical content returns the existing revision. A materially different result creates a new FINAL revision and preserves the previous result. The new revision records supersedes_snapshot_id.

The snapshot stores calculation version, policy ID/version, Time Baseline ID/version, event versions, population, contributing hours, KPI result, exclusions, and a content fingerprint.

No manual KPI score patching is used.

## Reports & KPI

The Stage 23 Reports workspace reads the existing RuntimeAdapter and displays live equipment and fleet PA/UA results. It also exposes event lineage details and finalized snapshot history.

Finalization is blocked when the current fleet calculation is not READY.

## Project-default boundary

The Stage 23 Time Baseline is marked PROJECT_DEFAULT and is not presented as an official company/site SOP. It exists to make the prototype calculation path executable. A future official Time Baseline/policy configuration can replace it without changing the KPI engine contract.

## QA

Stage 23 includes:

- JavaScript E2E foundation contract tests.
- Python append-only snapshot/revision tests.
- Integration contract tests for artifact wiring, runtime dispatch, and default desktop entry.

The existing project regression suite remains the final acceptance gate.
