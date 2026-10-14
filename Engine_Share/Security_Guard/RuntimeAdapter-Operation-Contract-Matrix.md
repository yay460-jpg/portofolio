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


### Schema-backed READ contract proposal — 2026-10-14

- The schema's ten domain entities are `Equipment`, `WorkFront`, `GlobalCapacity`, `Checker`, `Operations`, `Maintenance`, `Issues`, `Plans`, `HSE`, and `MapMarker`. `AuditLog` is a separate system/audit sheet, not a member of `DOMAIN_ENTITIES`; `_Lists` is a special controlled-list target.
- Confirmed UI reads include Dashboard's Plans/Equipment/WorkFront/Operations/Issues/Maintenance and marker-location's MapMarker plus linked domain entities. KPI history is exposed through `READ_KPI_SNAPSHOTS`, not generic READ. Data Management uses dedicated operations for dataset and backup flows.
- Candidate public READ allowlist: schema domain entities plus `_Lists`; default-deny generic `AuditLog` unless a real shipped integration dependency is found. Unknown entity names should be rejected explicitly at the adapter boundary rather than relying on downstream behavior.
- This remains a proposal pending the complete shipped-script/integration scan and tests. No code changes yet; preserve compatibility and test each allowed entity before enforcement.


### Public generic READ enforcement — 2026-10-14

| Request target | Adapter contract | Evidence |
|---|---|---|
| Ten schema domain entities | Allow generic READ | Parameterized adapter regression test |
| `_Lists` | Allow generic READ | Parameterized adapter regression test |
| `AuditLog` | Reject generic READ with `ADP-007` | Parameterized negative test |
| Unknown / dunder-style entity | Reject generic READ with `ADP-007` | Parameterized negative test |
| KPI history | Separate `READ_KPI_SNAPSHOTS` operation; not part of generic READ allowlist | Existing operation contract |

Guard is enforced in `RuntimeAdapter`, not the browser client. `RuntimeInterface.read("AuditLog")` remains an internal API and is not covered by the public adapter allowlist; broader authorization requires a separate internal-call-path review. Full Pytest validation is pending after the implementation commits.


### Test compatibility correction — 2026-10-14

- First full-suite run after public READ allowlist failed because `tests/test_stage5.py` still asserted generic READ of `AuditLog` returned all events. This is an obsolete expectation under the new contract and is now changed to assert `REJECTED` with `ADP-007`.
- The new `_Lists` test also assumed a wrapped `status/data` response. It now validates the established flattened controlled-list shape without changing runtime response compatibility.
- The allowlist implementation is unchanged. Validation remains pending until the follow-up Full Pytest run passes.


### Public READ allowlist validation result — 2026-10-14

- Full Pytest #683 PASS: **631 passed in 58.18s**. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38478693120.
- #682 failed on the earlier test commit and stale `AuditLog` expectation; #683 is the subsequent green full-suite run. Documentation runs #684 and #685 also passed.
- Contract under test: `DOMAIN_ENTITIES` plus `_Lists` allowed; generic public READ of `AuditLog`, unknown entities and dunder-style names rejected with `ADP-007`. Dedicated KPI snapshot reads remain separate.
- Status: adapter-level CI **PASS**; full shipped-script, bridge and host consumer compatibility audit **OPEN**. Do not mark the entire security item complete or promote the branch until that inventory and boundary validation are finished.


### Caller/host compatibility trace — 2026-10-14

- UI READ inventory: the Reports module iterates the fixed set `Operations`, `Equipment`, `WorkFront`, `Maintenance`, `Issues`, `Plans`, and `HSE`; Marker Location's dynamic READ is gated to `Equipment`, `WorkFront`, or `HSE`; other inspected UI reads use schema entities and/or `_Lists`. All are covered by the public allowlist.
- Desktop Host Evidence verification uses a fixed mapping: `TargetPlan -> Plans`, `HSE -> HSE`, `Maintenance -> Maintenance`. These READ calls remain compatible with the allowlist. Android Host creates and dispatches through `RuntimeAdapter`, with no alternate entity-read route observed in its entry point.
- Shared runtime client intentionally forwards the request; entity authorization is enforced server-side in `RuntimeAdapter`. KPI snapshot history uses dedicated `READ_KPI_SNAPSHOTS`, not generic READ.
- No generic public `READ AuditLog` call was found in the inspected shipped UI/host paths. Internal `RuntimeInterface.read("AuditLog")` remains a separate API and is not covered by the public adapter guard.
- Result: **inspected in-repository caller compatibility PASS**. Broader assurance for external integrations and direct internal Python consumers remains OPEN. Regression gate: exercise Marker Location's dynamic source entities and Desktop Evidence owner checks through the adapter/host before declaring the overall READ item complete.


### READ caller compatibility gate — CI verified — 2026-10-14

- Full Pytest #690 and #691 both completed successfully on Python 3.13, including the complete test-suite step. Documentation workflows #688, #689, and #692 also completed successfully.
- Regression tests cover Marker Location's dynamic READ source entity set (`Equipment`, `WorkFront`, `HSE`) and Desktop Evidence owner mapping (`TargetPlan -> Plans`, `HSE -> HSE`, `Maintenance -> Maintenance`). Unsupported Evidence modules are rejected before dispatch.
- Internal source review found no production direct generic READ caller for `AuditLog` under `src/mine_services`: the only generic `RuntimeInterface.read()` dispatch is the guarded `RuntimeAdapter`; direct `runtime.read("AuditLog")` uses are internal tests. Internal audit production behavior uses the audit repository/store API. External Python imports and out-of-repository consumers cannot be established from this repository scan.
- **Status: inspected in-repository public READ compatibility PASS.** The internal RuntimeInterface remains a separate internal API; this matrix does not claim universal authorization for arbitrary Python code.
- Next contract-matrix slice: finish per-operation side-effect/audit/replay/rollback mapping for `CREATE`, `UPDATE`, `DELETE`, `FINALIZE_KPI`, and remaining list/read operations. EVO2-02 remains IN PROGRESS; no `main` promotion.


### CRUD transaction and replay ownership — 2026-10-14

- `CREATE`, `UPDATE`, and `DELETE` dispatch through `RuntimeAdapter` to `ApplicationService`. The adapter-level replay cache intentionally excludes CRUD, preserving `ApplicationService._request_guard` as the owner of duplicate request ID handling; established response is `DUPLICATE_REQUEST`.
- `ApplicationService` validates before mutation, then uses `TransactionManager` to snapshot state, apply the mutation, append audit, and persist. On audit or store-save exception, the transaction manager restores the previous store snapshot. Existing isolated tests in `test_security_runtime_atomicity.py` cover rollback when audit append fails for each CRUD operation.
- Added tests to `test_security_request_replay.py` for changed-payload CREATE replay, changed-payload UPDATE replay, and repeated DELETE replay. Expected contract: exact `DUPLICATE_REQUEST`, no second mutation, and no second audit event.
- Full Pytest #696 completed successfully on Python 3.13 for commit `cbcd8c0`; full suite PASS. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38482028953. Documentation workflows #697–#698 also passed.
- Next test gate: identical `FINALIZE_KPI` replay must return a detached cached response and must not create another KPI history revision or audit event. Then continue READ/LIST and file-operation contract inventory.
- Current cache design limitation remains: selected non-CRUD mutating operations use an unbounded, process-local cache protected by a lock across downstream execution. It has no expiry/capacity and is cleared on restart; it is not durable exactly-once protection. Keep this as a documented design risk pending an explicit idempotency persistence/ownership decision.


### FINALIZE_KPI identical replay regression — 2026-10-14

- Added isolated test `test_finalize_kpi_same_request_returns_detached_cached_response`: identical request ID and payload should return the original committed result from the adapter cache as a detached copy, without adding another KPI history record or audit event. It also mutates the first returned object to prove cache isolation.
- Full Pytest #701 PASS on Python 3.13 for commit `40bbb36`; detached response isolation and no duplicate KPI history/audit side effects verified. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38483042457. Documentation workflows #702 and #703 passed.
- Remaining operation inventory: `BACKUP`, `LIST_DATASETS`, `LIST_TOPOGRAPHY_BACKUPS`, `LIST_MARKER_LOCATION_BACKUPS`, `LOAD_TOPOGRAPHY_BACKUP`, and `LOAD_MARKER_LOCATION_BACKUP` are not in the adapter's selected replay-cache set. This matrix records that observation, not a confirmed vulnerability. Trace actual mutation/audit behavior and define retry contract before modifying cache membership or behavior.


### BACKUP and LIST operation contract — 2026-10-14

- `BACKUP` calls `SnapshotManager.capture()`: it reads a store snapshot, seals it with a unique snapshot ID and checksum, and does not itself persist or append an audit event. Repeated calls are fresh captures rather than replayed cached responses.
- `LIST_DATASETS`, `LIST_TOPOGRAPHY_BACKUPS`, and `LIST_MARKER_LOCATION_BACKUPS` are observational reads. Their responses can legitimately change as files change; same request ID does not mean a stale cached list should be returned.
- Added isolated tests for fresh read-only backup captures and uncached LIST behavior, including assertions that store snapshot and audit history remain unchanged. Full Pytest is **PENDING** for commit `f7fe053`; do not mark PASS before CI.
- Next: trace `LOAD_TOPOGRAPHY_BACKUP` and `LOAD_MARKER_LOCATION_BACKUP` to verify they parse and return backup content without mutating runtime state or audit, then cover malformed/missing-file retry contracts.


### Backup LOAD operations — 2026-10-14

- `LOAD_TOPOGRAPHY_BACKUP` and `LOAD_MARKER_LOCATION_BACKUP` are read operations: manager code validates basename and extension, confines resolved path to the manager directory, checks file existence, uses bounded reads, validates package format/version (and Marker Location document contents), then returns base64 content. Runtime methods only set response status to `READY`; they do not restore/apply the package to live runtime state.
- Full Pytest #706 PASS validates BACKUP fresh capture and LIST observational-read contracts. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38483752068; docs #707–#708 passed.
- Added isolated tests that repeated same-ID LOAD requests are executed again without store/audit mutation and that a failed first attempt can be retried with the same request ID. Full Pytest is **PENDING** for commit `702d3d5`.
- Next: validate adapter-level error normalization for malformed, oversized, traversal, and missing backup inputs; do not alter replay cache membership unless tests demonstrate a contract failure.


### LOAD replay contract correction — 2026-10-14

- Full Pytest #709 red phase: 642 passed, 2 failed due to test assumptions, not yet a confirmed production defect. Successful `LOAD_TOPOGRAPHY_BACKUP` and `LOAD_MARKER_LOCATION_BACKUP` are replay-cached, so identical requests call the manager once. Exceptions are normalized by the adapter to `REJECTED` with `ADP-005`; rejected/error responses are not cached and may be retried with the same request ID.
- Tests corrected in commit `8387be1` to assert the established contract, including read-only store/audit state and retry after a normalized rejection. CI pending.


### Backup LOAD rejection boundary — 2026-10-14

- Full Pytest #712 PASS for corrected replay contract tests; documentation workflows #713 and #714 PASS.
- Added tests for missing backup files, traversal-style filenames, corrupt package payloads, and oversized files on both Topography and Marker Location LOAD paths. Adapter must normalize failures to `REJECTED` / `ADP-005` and keep the public message generic. Test commit `b4361d7`, CI pending.


### Backup SAVE write-failure contract — 2026-10-14

- Full Pytest #715 PASS validates missing, traversal-style, corrupt, and oversized backup LOAD rejection paths. Documentation workflows #716–#717 PASS.
- Added manager-level tests for both backup types: simulate failure writing a new backup and assert existing backup bytes/files remain unchanged. Commits `c61d472` and `b832870`; CI pending.
- Scope is limited to a failure during creation of the new file, before retention eviction. Retention cleanup failure/partial eviction remains a distinct contract question and must not be assumed atomic without evidence.


### Backup SAVE retention cleanup failure — 2026-10-14

- Red-phase Full Pytest #722/#723 reproduced that a new backup remained after the first old-file unlink failed (647 passed, 2 failed). Documentation workflow #724 also failed because the red-phase test suite was intentionally red.
- Both managers now remove the just-created backup when retention raises `OSError`, then re-raise (`2d2bb66`, `75c9143`). Full Pytest and docs CI pending.
- Boundary: rollback of the new file is covered; restoration of previously deleted old files after a later unlink failure is not yet guaranteed. Separate partial-eviction test/design remains open.


### Backup SAVE retention rollback — partial eviction failure — 2026-10-14

- Extended the earlier new-file cleanup fix: managers stage copies of selected eviction candidates before unlinking. If a later unlink raises, missing old files are restored from the staged copies, the newly written target is removed, and the error is re-raised.
- Added partial-eviction regression cases that fail the second unlink, after one deletion has succeeded (Topography test commit b4a9bca; Marker Location test commit 0c2b9b3).
- Implementation commits: Topography e2b9879; Marker Location a10957a.
- CI #729–#732 is still running at the time of this update. Contract status remains PENDING VALIDATION until final full-suite CI is green.
- This is rollback on a caught filesystem exception, not crash-atomicity; restoration may itself fail under a second filesystem failure.


### Backup SAVE retention rollback — CI result and next retry gate — 2026-10-14

- Partial-eviction rollback is validated: Full Pytest #729–#732 passed for Topography and Marker Location production fixes and their failure-on-second-unlink regression tests; docs #733–#734 passed.
- Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38487565450, https://github.com/yay460-jpg/portofolio/actions/runs/38487572665, https://github.com/yay460-jpg/portofolio/actions/runs/38487594633, https://github.com/yay460-jpg/portofolio/actions/runs/38487604828, https://github.com/yay460-jpg/portofolio/actions/runs/38487648336, https://github.com/yay460-jpg/portofolio/actions/runs/38487657212.
- New next gate adds retry coverage for a failed first SAVE attempt with the same request ID for both backup types. Expected contract: adapter returns generic `REJECTED` / `ADP-005` for the first failure, does not cache that failure, and permits the retry to succeed. Test commit `ea9b43b`; CI pending.
- Replay cache remains process-local and unbounded, and is cleared on adapter recreation/restart. This is an open design risk, not a change authorized by this contract audit. Do not implement TTL/capacity or durable idempotency until ownership, retention window, collision handling and restart recovery semantics are explicitly specified.


### Backup SAVE retry contract — CI verified — 2026-10-14

- Full Pytest #735 PASS validates retry after injected initial write failure for both Topography and Marker Location SAVE operations. The first attempt returns generic `REJECTED` / `ADP-005`; because rejected responses are not cached, the same request ID can succeed after the underlying failure is corrected.
- Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38488260830. Documentation workflows #736 and #737 passed: https://github.com/yay460-jpg/portofolio/actions/runs/38488283239 and https://github.com/yay460-jpg/portofolio/actions/runs/38488291682.
- Status: **backup SAVE retry contract PASS**.
- Next audit: replay-cache lifecycle and ownership, including operation membership, same-ID collisions across operations, global lock scope, unbounded growth, and restart behavior. Record trade-offs before changing production semantics; do not infer durable idempotency from this process-local cache.


### Replay-cache lifecycle and ownership — source audit — 2026-10-14

- Source: `lithosite-Mine-Services/src/mine_services/adapter.py` on `v41-workspace`; no production code changed in this audit.
- Cache set: `IMPORT_XLSX`, `RESTORE`, `SAVE_DATASET`, `SAVE_AS_DATASET`, `LOAD_DATASET`, `SAVE_TOPOGRAPHY_BACKUP`, `LOAD_TOPOGRAPHY_BACKUP`, `SAVE_MARKER_LOCATION_BACKUP`, `LOAD_MARKER_LOCATION_BACKUP`, and `FINALIZE_KPI`.
- Concurrency: one adapter-instance `RLock` covers cache lookup, full downstream execution, and successful-result insertion. Same-instance duplicate requests are serialized, but independent requests in this set are also serialized for the duration of each operation.
- Fingerprint: SHA-256 of the complete canonicalized request. Within the cached set, reusing a request ID for a different payload or operation returns `REJECTED` / `ADP-006`; successful cached responses are deep-copied. Rejected/error responses are not cached.
- Lifecycle: cache is local to one adapter object, has no TTL/capacity/eviction, and disappears on adapter recreation or process restart. No durable exactly-once guarantee is established.
- Scope boundary: CRUD uses `ApplicationService`'s separate duplicate-request guard; BACKUP and LIST operations bypass the cache. The current code therefore does not enforce one request-ID namespace across every operation family. This is a contract question, not yet a confirmed defect.
- Decision gate: add isolated tests for cross-family request-ID reuse and concurrent same-ID dispatch, then decide whether IDs are scoped per operation family or globally before any production change. Any cache bound/TTL or durable idempotency design must specify retention window, restart behavior, collision semantics, and ownership first.
- Related retry gate: Full Pytest #735 PASS; docs #736–#739 PASS. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38488260830 and https://github.com/yay460-jpg/portofolio/actions/runs/38488669213.


### RuntimeAdapter replay retry gates — 2026-10-14

- Full Pytest #745 PASS validates identical concurrent replay and concurrent conflicting payloads: one accepted side effect, one `ADP-006` rejection. https://github.com/yay460-jpg/portofolio/actions/runs/38490506418.
- Full Pytest #746 PASS validates retry after a rejected `SAVE_AS_DATASET` response using the same request ID and payload. https://github.com/yay460-jpg/portofolio/actions/runs/38492024542.
- Docs workflow #747 PASS synchronizes the roadmap. https://github.com/yay460-jpg/portofolio/actions/runs/38492092421.
- A rejected-attempt retry test for `RESTORE` has been added; CI #748 is pending, so this operation remains PENDING VALIDATION until the run completes. https://github.com/yay460-jpg/portofolio/actions/runs/38492451181.
- No production replay behavior changed in these steps. Request-ID scope across the adapter cache, CRUD, and uncached observational operations remains undecided.


### RuntimeAdapter retry gate update — RESTORE PASS, LOAD_DATASET pending — 2026-10-14

- Full Pytest #748 PASS: rejected `RESTORE` attempts are not cached as successful replay responses; identical request ID and payload can retry. https://github.com/yay460-jpg/portofolio/actions/runs/38492451181.
- Documentation workflows #749 and #750 PASS: roadmap and contract matrix synchronized. https://github.com/yay460-jpg/portofolio/actions/runs/38492477097 and https://github.com/yay460-jpg/portofolio/actions/runs/38492484773.
- Added a rejected-first-attempt retry test for `LOAD_DATASET`; CI is pending and must be checked before marking the contract PASS.
- No production replay semantics changed. Global-vs-family request-ID scope remains an explicit contract decision.
