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
