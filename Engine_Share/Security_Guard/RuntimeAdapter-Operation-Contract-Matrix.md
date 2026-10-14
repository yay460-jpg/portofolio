# RuntimeAdapter Operation Contract Matrix

Status: EVO2-02 operation inventory and ownership mapping — COMPLETE; malformed request-ID and dataset-load rollback full-suite gates PASS
Branch: `v41-workspace`
Scope: `lithosite-Mine-Services/src/mine_services/adapter.py`, `runtime.py`, operation managers, and the public desktop-host dispatch.

This matrix distinguishes observed code behavior from tested guarantees. A green adapter test does not imply parser, filesystem, browser, or crash-durability coverage.

## Envelope and request-ID contract

- All public operations require a non-empty string `request_id`; malformed values (non-string or whitespace-only) are rejected with `ADP-003` before replay-cache lookup.
- CRUD (`CREATE`, `UPDATE`, `DELETE`) remains owned by `ApplicationService._request_guard`: a repeated successfully committed ID returns `DUPLICATE_REQUEST`. Validation/transaction failures do not reserve the ID.
- The adapter fingerprint cache is used by `IMPORT_XLSX`, `RESTORE`, `SAVE_DATASET`, `SAVE_AS_DATASET`, `LOAD_DATASET`, both backup SAVE operations, both backup LOAD operations, and `FINALIZE_KPI`. A matching successful request returns a detached cached response; a changed payload with the same ID returns `ADP-006`; rejected/error responses are not cached and may be retried.
- `READ`, `READ_KPI_SNAPSHOTS`, `BACKUP`, and the three LIST operations are not in the adapter replay cache. Repeated observational calls can return fresh data/snapshot IDs.
- **Namespace decision:** keep CRUD and adapter-cache ownership separate for backward compatibility; do not silently change CRUD's established `DUPLICATE_REQUEST` response into cached replay. This is explicitly **not** a global, cross-family exactly-once guarantee. Callers must generate unique request IDs across all operations. A future unified durable ledger would be a separate compatibility change requiring its own design and consumer tests.
- Replay state is process-local, unbounded, and cleared at restart. It does not guarantee cross-process or restart-safe idempotency. This is a known design limitation, not a confirmed bypass of the current in-process contract.

## Operation inventory

| Operation | Owner / effects | Request-ID and failure contract | Evidence / remaining boundary |
|---|---|---|---|
| CREATE | ApplicationService + TransactionManager; entity, audit, persistence | CRUD guard; successful duplicate -> `DUPLICATE_REQUEST`; audit/store failure rolls back | Changed-payload duplicate and injected audit failure tests pass. Durable ID registry is not claimed. |
| UPDATE | ApplicationService + TransactionManager; entity, audit, persistence | Same CRUD guard and rollback contract | Changed-payload duplicate and injected audit failure tests pass. |
| DELETE | ApplicationService + TransactionManager; entity/cascade effects, audit, persistence | Same CRUD guard and rollback contract | Repeated delete does not create another audit/mutation; injected audit failure rollback tested. Cascade/evidence lifecycle has its own tests. |
| READ | RuntimeAdapter allowlist + RuntimeInterface / store | No replay cache; `DOMAIN_ENTITIES` and `_Lists` allowed; other generic targets rejected with `ADP-007` | In-repository callers, dynamic Marker Location sources and Desktop Evidence owner mapping tested. Copy isolation has targeted tests; arbitrary external Python consumers/field-level authorization are outside this public adapter contract. |
| IMPORT_XLSX | ImportCoordinator + ValidationEngine + TransactionManager; workbook parse, staged data, audit/persist | Fingerprint cache on successful result; rejected attempt may retry; path is supplied by caller | Adapter replay uses a stub; domain import has separate tests. No blanket file-root/size policy is claimed; local-path compatibility remains a host-policy question. |
| BACKUP | SnapshotManager; reads state and builds sealed snapshot in memory | No replay cache; same ID can yield a fresh snapshot | Test confirms new snapshot ID and unchanged store/audit. No external file write by capture path observed. |
| RESTORE | SnapshotManager + TransactionManager; replace/merge runtime and append audit | Fingerprint cache on success; invalid/rejected result may retry | Schema/entity/row allowlists, checksum and mode checks plus rollback path exist. Tests cover retry/conflict and payload guards; no crash-atomicity across process/power loss is claimed. |
| LIST_DATASETS | DatasetManager; lists dataset metadata and active marker | No replay cache; fresh listing | Repeated list calls return fresh values and do not mutate store/audit. Malformed files are skipped by manager. |
| SAVE_DATASET | RuntimeInterface + DatasetManager; writes/replaces dataset file, updates active metadata, audit and workbook store | Fingerprint cache on success; rejected attempt can retry | Same-file and store-save rollback tests cover prior bytes, active metadata and audit for tested failures; filesystem crash durability is not claimed. |
| SAVE_AS_DATASET | RuntimeInterface + DatasetManager; creates dataset file, updates active metadata, audit and workbook store | Fingerprint cache on success; same payload replays cached result; changed payload -> `ADP-006` | Identical/concurrent/conflicting replay, retry-after-rejection and write rollback gates pass. Retention/overwrite semantics are explicit: existing name is rejected by manager. |
| LOAD_DATASET | RuntimeInterface + DatasetManager; replaces domain data, controlled lists and active metadata, then audit/workbook persistence | Fingerprint cache on success; rejected/error result may retry | Dataset schema/row validation exists. Regression verifies that a failed workbook save restores store, controlled lists, active metadata and audit state. Full Pytest #38499279618 PASS. |
| SAVE_TOPOGRAPHY_BACKUP | TopographyBackupManager; base64 decode, bounded package validation, file write and retention cleanup | Fingerprint cache on success; conflict -> `ADP-006`; failed attempt may retry | Size preflight, bounded reads, invalid package/path/oversize rejection, write-failure and partial retention rollback tests exist. Rollback is for caught exceptions, not crash-atomicity. |
| LIST_TOPOGRAPHY_BACKUPS | TopographyBackupManager; lists metadata | No replay cache; fresh listing | Read-only listing tests assert store/audit unchanged. Filesystem races/symlink hardening remain separate path audit scope. |
| LOAD_TOPOGRAPHY_BACKUP | TopographyBackupManager; bounded read and package validation, returns package data; does not apply it to runtime | Fingerprint cache on success; rejected/error result may retry | Same-ID successful response is cached; missing/traversal/corrupt/oversized cases reject; runtime store/audit remain unchanged. |
| SAVE_MARKER_LOCATION_BACKUP | MarkerLocationBackupManager; base64 decode, schema validation, file write and retention cleanup | Fingerprint cache on success; conflict -> `ADP-006`; failed attempt may retry | Size preflight, package/schema checks, write-failure and partial retention rollback tests exist. Rollback is for caught exceptions, not crash-atomicity. |
| LIST_MARKER_LOCATION_BACKUPS | MarkerLocationBackupManager; lists metadata | No replay cache; fresh listing | Read-only listing tests assert store/audit unchanged. |
| LOAD_MARKER_LOCATION_BACKUP | MarkerLocationBackupManager; bounded read and marker schema validation, returns package data; does not apply it to runtime | Fingerprint cache on success; rejected/error result may retry | Same-ID successful response is cached; missing/traversal/corrupt/oversized cases reject; runtime store/audit remain unchanged. |
| FINALIZE_KPI | RuntimeInterface + KPIHistoryStore + audit/store persistence; appends KPI history and audit | Fingerprint cache on success; same ID/payload returns detached cached result; changed payload -> `ADP-006`; rejected attempt may retry | Tests cover identical replay and rollback when audit append or workbook save fails. Rollback is in-process; two-file crash atomicity is not guaranteed. |
| READ_KPI_SNAPSHOTS | KPIHistoryStore; filtered history read | No replay cache | Nested response isolation test passes after deep-copy fix; authorization scope is separate from copy isolation. |

## Latest EVO2-02 code evidence — 2026-10-14

- Malformed request-ID red phase: Full Pytest workflow [#38499134404](https://github.com/yay460-jpg/portofolio/actions/runs/38499134404) failed on the new regression as intended; non-string/whitespace IDs could reach cache lookup or be accepted inconsistently.
- Adapter fix: commit `9601ac80b836243789250906b33c18ab480ac45c`; Full Pytest [#38499151045](https://github.com/yay460-jpg/portofolio/actions/runs/38499151045) PASS.
- Dataset-load rollback red phase: Full Pytest [#38499262056](https://github.com/yay460-jpg/portofolio/actions/runs/38499262056) failed as intended when an injected store-save error left active dataset metadata and controlled lists changed.
- Runtime fix: commit `c9e168b86d0b99275eb76f0d5289fd9c2f179082`; Full Pytest [#38499279618](https://github.com/yay460-jpg/portofolio/actions/runs/38499279618) PASS.
- Contract matrix sync: [#38499332965](https://github.com/yay460-jpg/portofolio/actions/runs/38499332965) PASS. Operation count correction: [#38499350686](https://github.com/yay460-jpg/portofolio/actions/runs/38499350686) PASS.
- These are real production-code fixes with isolated regression coverage. The replay cache remains process-local/unbounded by explicit scope decision; Browser Guard, Geo numeric-boundary and Topo3D malformed-input hypotheses are transferred to EVO2-03/EVO2-05 and are not called fixed by this matrix.

## Cross-operation risks assigned to follow-up gates

1. Replay cache is process-local/unbounded; durable replay, expiry/capacity, and restart behavior require a separate design rather than an undocumented patch.
2. CRUD and adapter-cache IDs have separate owners; cross-family ID reuse is not a global duplicate guard. Preserve compatibility for this track and make callers' global uniqueness requirement explicit.
3. Dataset-load rollback now restores the store, controlled lists and active dataset metadata after an injected workbook-save failure; Full Pytest #38499279618 is PASS. Future failure modes beyond the injected audit/store-save boundary remain separate tests.
4. Domain validation and host transport limits remain owner-specific. Do not interpret adapter envelope validation as full workbook, file path, browser, Geo, or Topo3D security validation.

No operational A3 workbook is used as a test fixture; use isolated stores and temporary files.

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
- Full Pytest #751 PASS: rejected `LOAD_DATASET` attempts are not cached as successful responses and can retry with the same request ID and payload. https://github.com/yay460-jpg/portofolio/actions/runs/38492967531.
- Full Pytest #755 PASS: rejected `FINALIZE_KPI` attempts are not cached as successful responses and can retry with the same request ID and payload. https://github.com/yay460-jpg/portofolio/actions/runs/38496213644. No production replay semantics changed. Global-vs-family request-ID scope remains an explicit contract decision.


### RuntimeAdapter retry gate — LOAD_DATASET PASS, FINALIZE_KPI pending — 2026-10-14

- Full Pytest #751 PASS: `LOAD_DATASET` rejected responses are not cached as successful replay results; identical request ID and payload can retry. https://github.com/yay460-jpg/portofolio/actions/runs/38492967531.
- Documentation workflows #752–#754 PASS, including correction of the dataset-load CI reference.
- Added a focused retry test for `FINALIZE_KPI`; pending CI. Do not mark it PASS until the run concludes.
- No production behavior changed. Global-vs-family request-ID scope remains an explicit contract decision.


### RuntimeAdapter retry gate — FINALIZE_KPI PASS, SAVE_DATASET pending — 2026-10-14

- Full Pytest #755 PASS: rejected `FINALIZE_KPI` responses are not cached as successful replay results; identical request ID and payload can retry. https://github.com/yay460-jpg/portofolio/actions/runs/38496213644.
- Documentation workflows #756 and #757 PASS. Roadmap and contract matrix are synchronized.
- Added a focused rejected-first-attempt retry test for `SAVE_DATASET`; CI pending. Do not mark PASS before the workflow concludes.
- Retry gates confirmed include `SAVE_AS_DATASET` (#746), `RESTORE` (#748), `LOAD_DATASET` (#751), and `FINALIZE_KPI` (#755), alongside existing import/backup retry tests.
- No production behavior changed. Request-ID scope across operation families and cache lifecycle remain explicit open contract decisions.


### RuntimeAdapter retry gate — SAVE_DATASET PASS; advance request-ID scope audit — 2026-10-14

- Full Pytest #758 PASS: rejected `SAVE_DATASET` attempts are not cached as successful replay responses; identical request ID and dataset name can retry. https://github.com/yay460-jpg/portofolio/actions/runs/38496637615.
- Documentation workflows #759 and #760 PASS; roadmap and matrix synchronized. https://github.com/yay460-jpg/portofolio/actions/runs/38496661461 and https://github.com/yay460-jpg/portofolio/actions/runs/38496670924.
- Current retry test inventory covers adapter-cached import, restore, dataset save/save-as/load, KPI finalize, and topography/marker backup save/load. Observational list/read operations are intentionally uncached; CRUD follows its separate application-level duplicate-request contract.
- Retryability review gate closed for the current cached operation set. No production behavior changed.
- Next: contract decision on request-ID namespace and lifecycle across adapter cache, CRUD, and observational reads, including cache lifetime/eviction and compatibility. Keep implementation unchanged pending explicit contract resolution.


### Replay-cache lifecycle audit — source findings and contract decision gate — 2026-10-14

- Documentation workflows #761 and #762 PASS; roadmap and matrix synchronized. https://github.com/yay460-jpg/portofolio/actions/runs/38496950642 and https://github.com/yay460-jpg/portofolio/actions/runs/38496961799.
- `_request_results` is an adapter-instance in-memory dictionary with no TTL, capacity limit, eviction, or persistence. Cache state is lost when the adapter instance/process is replaced; this must not be represented as durable idempotency.
- One adapter `RLock` currently protects cache lookup, dispatch, and cache write for all cached operations. It prevents duplicate concurrent dispatch for identical requests, but serializes unrelated cached requests. Existing concurrency tests cover identical and conflicting same-ID requests.
- Cached operations: `IMPORT_XLSX`, `RESTORE`, `SAVE_DATASET`, `SAVE_AS_DATASET`, `LOAD_DATASET`, Topography/Marker Location backup save/load, and `FINALIZE_KPI`. CRUD duplicate detection belongs to `ApplicationService`; `BACKUP`, LIST and READ observational operations bypass the adapter cache.
- Request-ID namespace across cache and CRUD is currently separate, proven by `test_request_id_scope_is_currently_separate_between_adapter_cache_and_crud`. Keep this as characterized behavior until contract owners decide otherwise.
- Decision options: retain explicitly separate scopes (simpler compatibility, weaker cross-family collision protection), or introduce a unified ledger (stronger cross-family consistency, requires migration/compatibility contract). Either requires explicit semantics for conflicts, retries, concurrency, lifetime, restart, and owner. No TTL/capacity/durable-store patch until retention requirements are approved.
- Gate remains OPEN for public contract decision; no production code changed.
