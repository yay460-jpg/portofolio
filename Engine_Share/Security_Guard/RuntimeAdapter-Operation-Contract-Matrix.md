# RuntimeAdapter Operation Contract Matrix

Status: EVO2-02 inventory in progress  
Branch: `v41-workspace`  
Scope: `lithosite-Mine-Services/src/mine_services/adapter.py`

This matrix records the adapter surface and current known replay/idempotency boundaries. It is an audit inventory, not a claim that all operations are secure or production-ready.

| Operation | Class | Side effects | Request ID passed downstream? | Current evidence / open question |
|---|---|---|---|---|
| CREATE | Mutation | Entity + audit + store commit | Yes | ApplicationService rejects a repeated successful request ID in process memory. Durable replay behavior not established. |
| UPDATE | Mutation | Entity + audit + store commit | Yes | Same process-local request guard as CREATE. |
| DELETE | Mutation | Entity removal + audit + store commit | Yes | Same process-local request guard as CREATE. |
| READ | Read | None intended | No | Entity READ uses PersistenceStore detached copies; AuditLog and controlled lists have targeted isolation tests. Authorization/exposure scope remains to be audited. |
| IMPORT_XLSX | Import | Dataset/entity import + possible audit | No | Replay and duplicate import semantics need isolated tests. |
| BACKUP | Export | Snapshot generation | No | Confirm whether backup is pure in-memory output or writes external state at all call sites. |
| RESTORE | Mutation | Runtime data replacement/merge + audit | No | Restore schema hardening exists; repeated restore semantics and audit atomicity need explicit contract. |
| LIST_DATASETS | Read | None intended | No | Confirm returned nested metadata cannot mutate manager state. |
| SAVE_DATASET | Persistence | Dataset file + audit + workbook save | No | Atomic rollback has targeted tests; replay behavior and same-name overwrite semantics need documentation. |
| SAVE_AS_DATASET | Persistence | New/replaced dataset file + active-state update + audit/store save | No | Atomic rollback has targeted tests; repeated same request ID is not enforced by adapter/runtime. |
| LOAD_DATASET | Mutation | Runtime replacement + audit + workbook save | No | Rollback on failure and active-state restoration need further tests. |
| SAVE_TOPOGRAPHY_BACKUP | Persistence | Base64 decode + backup file | No | Size preflight hardening exists; repeated filename behavior and replay contract need tests. |
| LIST_TOPOGRAPHY_BACKUPS | Read | None intended | No | Verify nested returned backup metadata isolation. |
| LOAD_TOPOGRAPHY_BACKUP | Read/import | Reads backup package | No | Confirm package payload is validated by domain engine and does not mutate shared state. |
| SAVE_MARKER_LOCATION_BACKUP | Persistence | Base64 decode + backup file | No | Size preflight hardening exists; repeated filename behavior and replay contract need tests. |
| LIST_MARKER_LOCATION_BACKUPS | Read | None intended | No | Verify nested returned backup metadata isolation. |
| LOAD_MARKER_LOCATION_BACKUP | Read/import | Reads backup package | No | Confirm package payload is validated by domain engine and does not mutate shared state. |
| FINALIZE_KPI | Mutation | KPI history file + audit + workbook save | No | Atomic rollback tested for audit/store-save failures; duplicate snapshot/replay semantics need explicit tests. |
| READ_KPI_SNAPSHOTS | Read | None intended | No | Nested response isolation test passes after deep-copy fix. |

## Known idempotency boundary

The adapter requires a `request_id` for every request envelope. CRUD retains the existing ApplicationService duplicate guard and its established `DUPLICATE_REQUEST` response. Other selected mutating operations now have an adapter-level, process-local fingerprint/response cache under validation. A required envelope field is not equivalent to durable idempotency enforcement.

Before implementing a generic replay cache, define:
1. Whether a repeated request ID with the same payload returns the original response or a duplicate rejection.
2. Whether the same request ID with a different payload is rejected as a conflict.
3. How cache entries survive process restarts and persistence failures.
4. Which read-only operations can safely be replayed without storage.
5. How operation-specific IDs (dataset names, backup filenames, KPI snapshot IDs) interact with the envelope request ID.

No workbook A.3 fixtures should be used; use isolated temporary stores/files for adversarial tests.


## Workflow #641 — request ID replay reproduction — 2026-10-14

- Full Pytest #641 failed as intended: 602 passed, 2 failed. `SAVE_AS_DATASET` accepted a second request using the same `request_id` with a different dataset name (`SAVED_AS`); `FINALIZE_KPI` accepted the same ID with a changed snapshot and returned `COMMITTED`. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38456045507.
- A process-local adapter guard was added on `v41-workspace`: successful side-effecting requests cache their canonical request fingerprint and response; the same ID and same payload returns a detached copy of the original response, while the same ID with a different payload is rejected with `ADP-006`.
- This is process-local protection only. It does not survive process restart and is not a durable exactly-once guarantee. The cache's lifetime/size and durable replay semantics remain open design items; do not claim cross-process idempotency.
- Full Pytest #642 and #643 exposed a regression: the initial guard intercepted CRUD duplicate requests and returned `REJECTED` instead of the established `DUPLICATE_REQUEST` contract. This was corrected by excluding CRUD from the adapter-level cache and preserving ApplicationService ownership. The corrected patch is committed as `6c68b1e582e95469a2bc76a4447fc26cec6ccc7d`; its Full Pytest validation is pending. Do not mark replay protection PASS until CI succeeds.



## Workflow #651–#652 — backup replay and identical-request semantics — 2026-10-14

- Full Pytest #651 PASS: Marker Location backup rejects a reused request ID with a different package and does not create a second backup file: https://github.com/yay460-jpg/portofolio/actions/runs/38458423985.
- Full Pytest #652 PASS: identical `SAVE_AS_DATASET` request replay returns a detached cached response and does not create a second dataset or audit entry: https://github.com/yay460-jpg/portofolio/actions/runs/38458690154.
- Next isolated tests cover `IMPORT_XLSX` request-ID payload conflicts and detached cached responses. These use a stubbed import call to test adapter replay behavior without requiring an operational workbook. Validation is pending.



## Workflow #653–#654 — XLSX replay validation — 2026-10-14

- Full Pytest #653 PASS: isolated adapter tests verify that reusing a request ID for a different XLSX path is rejected with `ADP-006`, and identical requests return detached cached responses without calling the import path twice. The import function is stubbed; this validates adapter replay semantics, not workbook parser/domain import behavior. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38467458050.
- Full Pytest #654 PASS: documentation synchronization. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38467470045.
- Additional retry test is now queued: a rejected import attempt must not be cached as a successful response, so the same request can be retried. CI pending.
- Process-local cache size/lifetime and cross-restart idempotency remain unresolved. No claim of durable exactly-once semantics.


## Workflow #655–#659 — retry and persistence rollback — 2026-10-14

- Full Pytest #655 PASS: rejected XLSX import attempts are not cached as success; retry with the same request ID executes again. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38467949013.
- Full Pytest #657 PASS: if the workbook/store save fails after a KPI finalize attempt, the existing KPI History file bytes and records are restored, and audit state remains unchanged. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38468724314.
- Full Pytest #658 PASS: if saving an existing dataset fails at store persistence, the original dataset file, active dataset state, and audit state are restored. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38468750357.
- Full Pytest #659 PASS: rollback evidence and replay retry findings synchronized in the roadmap. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38468756229.
- Remaining replay design limitation: RuntimeAdapter keeps _request_results as an unbounded process-local dictionary. It is cleared on process restart, has no explicit expiry/capacity, and cannot guarantee cross-process idempotency. The lock currently spans the downstream operation, so the implications for throughput should be reviewed before changing it.
- Next inventory slice: assess READ exposure for AuditLog and controlled lists and map the actual caller/authentication boundary before proposing restrictions. Do not assume this adapter is internet-facing or that the read is unauthorized without tracing the host/call-sites.


## EVO2 READ exposure trace — 2026-10-14

- `RuntimeAdapter` accepts `READ` and forwards the entity name to `RuntimeInterface.read()`; the domain path returns all rows or the requested primary-key row. `AuditLog` and `_Lists` are special read targets. Detached-copy tests cover audit events, controlled lists and nested KPI snapshots, but are integrity/isolation tests rather than authorization tests.
- Observed Operations UI READ dependencies: `Operations`, `Checker`, `WorkFront`, `Equipment`, `_Lists`, `GlobalCapacity`, and `Maintenance`. The Operations module does not call `AuditLog`; other UI modules remain to be inventoried before deciding whether that target should be exposed.
- Desktop host Origin checks protect browser-origin access on the runtime endpoint, but do not authenticate a local process or a request with no Origin. Current evidence is insufficient to classify the generic READ behavior as a confirmed remote vulnerability. The public entity allowlist, audit-log availability and any field-level filtering need an explicit compatibility contract before enforcement changes.
- Status: inventory finding / policy decision pending; no code patch authorized from this evidence alone.


### Caller inventory extension — 2026-10-14

Observed UI dependencies in the modules traced: `Plans`, `Equipment`, `WorkFront`, `Operations`, `Issues`, `Maintenance`, `Checker`, `HSE`, `_Lists`, and `GlobalCapacity`. KPI history uses the separate `READ_KPI_SNAPSHOTS` operation from `ui/modules/reports/kpi-foundation.js`. No `AuditLog` read was found in the inspected operational/KPI UI modules. The all-repository consumer scan is not yet complete, so this is not authorization to remove or block AuditLog. The next step is a full call-site scan, then a tested explicit public READ allowlist if the contract supports it.


### Adapter READ policy decision gate — 2026-10-14

- Latest green documentation Full Pytest workflows #669–#673 confirm the READ caller-trace records are synchronized; they are not evidence of a completed authorization fix.
- `RuntimeAdapter` has no explicit entity allowlist for generic `READ`; `RuntimeInterface.read()` returns all audit events for `AuditLog`, controlled-list values for `_Lists`, and delegates other names to the application store. Unknown entity handling currently depends on downstream behavior rather than a declared adapter contract.
- Although the inspected UI modules do not call `AuditLog`, the full shipped-script and integration inventory is still incomplete. Do not deny AuditLog or add an entity allowlist until compatibility is established.
- Next gate: complete caller/consumer scan, define allowed entity and field exposure, add adapter and host tests for allowed, unknown and restricted targets, then implement the smallest compatible guard. No code patch made; `main` remains locked.
