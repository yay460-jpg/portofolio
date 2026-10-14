# Lithosite Security Evolution 2 — Roadmap

## Decision

Evo 2 is the global, cross-product Lithosite security track. Evo 1 remains the historical, version-neutral record of application hardening already implemented. Evo 2 extends common policy and guard ownership without removing existing controls or centralizing domain validation that belongs to a specific runtime/engine.

## Current workspace and safety boundary

- Work branch: `v41-workspace`.
- Locked base before Evo 2 work: `698469057aa588de2c3d17a1327ef4892863994d`.
- Latest code fix commit: `5431b74019cf1dbed359d9023ced59fb4885810f`. Latest full green workspace HEAD: `45b313e1f08466e0624ce290619d57aac32be938`, Full Pytest [#38502385771](https://github.com/yay460-jpg/portofolio/actions/runs/38502385771) PASS (676 passed). This gate includes Browser Guard, Geo, Topo3D v1/v2 runtime tests and host path/body adversarial tests. Earlier request-ID and dataset rollback fixes remain covered by their own full-suite gates. The V41 locked `main` baseline remains unchanged.
- Current work includes narrow, tested runtime hardening in the owning layers: explicit local Origin policy, static asset allowlist, Topo3D package-size preflight, sanitized unreadable-workbook import errors, strict snapshot/dataset schema keys, and backup size preflight before decode/read. This is not a broad refactor; full coverage remains incomplete.
- Do not change `main` during this track until the owner explicitly promotes a tested and reviewed change.
- Use temporary A3 fixtures and temporary Evidence paths for adversarial tests.
- Never use the operational A3 workbook as a test fixture.
- Keep existing Geo Engine, Topo3D Engine, map-security.js, RuntimeAdapter, and ValidationEngine behavior intact unless a reproduced security gap justifies a minimal patch.

## Checklist

| ID | Stage | Exit criteria | Status |
|---|---|---|---|
| EVO2-01 | Confirm nomenclature and ownership | Evo 1 / Evo 2 definitions and responsibility boundaries documented | PASS — accepted and recorded |
| EVO2-02 | Complete attack-surface inventory | Endpoints, operations, input types, file paths, trust boundaries, owners, and existing controls mapped | PASS — the 20-operation RuntimeAdapter matrix maps owner, side effects, request-ID/retry behavior, rollback/audit evidence, and remaining boundaries. Host endpoints/path/body limits and public READ callers are inventoried; Browser Guard call-sites/script order, Geo callers, and both Topo3D copies/limits are source-traced. Request-ID decision: keep CRUD and adapter-cache guard ownership separate for backward compatibility; require callers to use globally unique IDs, and do not claim cross-family or cross-restart exactly-once protection. Malformed request-ID regression passed #38499151045; dataset-load state rollback regression passed #38499279618. Open runtime hypotheses are handed to EVO2-03/EVO2-05, not treated as fixed. |
| EVO2-03 | Design isolated adversarial tests | Tests cover each prioritized boundary using temporary database and file fixtures | IN PROGRESS — existing host/static/import/backup preflight tests and replay concurrency/retry gates (#745–#758) remain covered. EVO2-02 source inventory identified a Browser Guard load-time extension hypothesis (frozen export followed by Object.assign), non-finite Geo inputs that may propagate with `ok: true`, and Topo3D consumer/test gaps. Next: add isolated Node/browser reproduction for the Guard export, Geo finite/range tests, malformed/truncated Topo3D package/count tests, deeper host path/body cases, and explicit caller tests for the documented request-ID family boundary. Keep fixtures temporary and do not use operational A3. |
| EVO2-04 | Implement confirmed guard gaps in their owning layers | Only reproduced gaps patched behind regression tests; Host Guard must not bypass RuntimeAdapter | IN PROGRESS — confirmed fixes include Origin/static-asset allowlists, Topo3D package-size preflight, safe unreadable-XLSX errors, strict snapshot/dataset entity keys, dataset-save/KPI-finalization rollback, Topography/Marker backup size/read/retention rollback, malformed request-ID rejection (`9601ac80`, Full Pytest #38499151045), dataset-load rollback (`c9e168b8`, Full Pytest #38499279618), Browser Guard immutable API export (`cef0b92d`, Full Pytest #38500867998), Geo UTM finite/range rejection in both product copies, and Topo3D v1 metadata/index plus v2 truncation checks (`5431b740`, Full Pytest #38501823406 and #38502385771). The latest gate also passes new Host body/path boundary tests. Remaining gaps must be reproduced and patched only in their owning layer; replay-cache expiry/capacity/durability remains a design decision, not silently changed. |
| EVO2-05 | Audit Browser Guard integration | Existing map-security.js call-sites, script order, export names, and tests mapped before reuse/refactor | IN PROGRESS — member-app script order and calls are mapped in Endpoint-Operations-Inventory.md. Node runtime test reproduced `TypeError: Cannot add property validateImportPackage, object is not extensible` (red-phase #38500649506); commit `cef0b92d` moved the compatibility validator into the same frozen API and corrected helper references. Full Pytest #38500867998 PASS (669 passed). `map-package-transfer.js` consumes `validatePayload`; no shipped call site for `validateImportPackage` was found in the source scan, so broader consumer/runtime Console verification remains open. |
| EVO2-06 | Record Geo and Topo3D responsibilities | Domain rules and resource boundaries mapped; no engine migration yet | IN PROGRESS — Geo blobs identical; Topo3D files differ overall but four loader methods are identical; preflight order and backup size/read bounds have focused tests, and backup save/load retry paths are covered. Geo caller/range validation and broader Topo3D runtime input/resource coverage remain open. |
| EVO2-07 | Full regression and security gate | Targeted adversarial tests, full pytest, UI/static regression, console checks, and documented PASS/HOLD | BLOCKED — requires prior stages |

## EVO2-02 closure and next gate — 2026-10-14

- **EVO2-02 PASS — inventory complete, not security release complete.** The RuntimeAdapter matrix and endpoint/guard-owner inventory are synchronized on `v41-workspace`. All 20 adapter operations are mapped with side effects, owner, request-ID/retry behavior, known rollback/audit evidence and residual boundaries. Browser Guard call-sites/script order, Geo callers, and Topo3D copy differences/resource limits are documented.
- **Code fix — malformed request ID:** red-phase Full Pytest [#38499134404](https://github.com/yay460-jpg/portofolio/actions/runs/38499134404) failed on the new regression as intended. Commit `9601ac80` fixes it; Full Pytest [#38499151045](https://github.com/yay460-jpg/portofolio/actions/runs/38499151045) PASS.
- **Code fix — dataset-load rollback:** red-phase Full Pytest [#38499262056](https://github.com/yay460-jpg/portofolio/actions/runs/38499262056) reproduced leaked active-dataset/controlled-list state after an injected store-save failure. Commit `c9e168b8` restores store, controlled lists and active metadata; Full Pytest [#38499279618](https://github.com/yay460-jpg/portofolio/actions/runs/38499279618) PASS.
- **Request-ID decision:** preserve separate guard ownership for CRUD and adapter-cache operations to maintain the established CRUD `DUPLICATE_REQUEST` contract. Callers must generate globally unique IDs; current design does not enforce cross-family uniqueness and does not provide durable or restart-safe exactly-once semantics. Cache remains process-local/unbounded; no unreviewed cache policy change was made.
- **Immediate next gate — EVO2-03:** build isolated adversarial tests for the static Browser Guard export hypothesis, Geo finite/range boundaries, Topo3D malformed/truncated/count/resource inputs, and remaining host path/body boundaries. Only confirmed failures proceed to minimal owner-layer fixes. `main` stays locked; EVO2-02 PASS does not mean EVO2 as a whole is LOCKED.

## EVO2-03 adversarial evidence — 2026-10-14

- **Browser Guard:** red-phase [#38500649506](https://github.com/yay460-jpg/portofolio/actions/runs/38500649506) reproduced a load-time TypeError caused by extending a frozen export. The compatibility validator now lives inside the immutable API and uses local safe-image/tile-key helpers. Full Pytest [#38500867998](https://github.com/yay460-jpg/portofolio/actions/runs/38500867998) PASS (669 passed).
- **Geo Engine:** red-phase [#38501022193](https://github.com/yay460-jpg/portofolio/actions/runs/38501022193) confirmed NaN/Infinity, invalid/fractional zones, invalid hemisphere and out-of-range Easting could be reported with `ok: true`. Both copies now validate finite inputs, supported zone/hemisphere, conservative coordinate bounds and plausible finite outputs. Full Pytest [#38501182094](https://github.com/yay460-jpg/portofolio/actions/runs/38501182094) PASS (670 passed).
- **Topo3D v1:** runtime reproduction exposed strict-mode `icount is not defined`; both copies now declare parser locals, reject invalid/truncated metadata, enforce triangle-index alignment and reject any index `>= vertexCount` before GPU build. Valid v1 fixtures remain accepted.
- **Topo3D v2:** runtime tests verify a truncated package is rejected before the DTM/STR loader and a structurally valid package reaches that loader.
- **Host boundaries:** [#38502237840](https://github.com/yay460-jpg/portofolio/actions/runs/38502237840) PASS covers invalid/negative/over-limit runtime `Content-Length` before body reads and encoded user-guide path traversal. The final combined gate [#38502385771](https://github.com/yay460-jpg/portofolio/actions/runs/38502385771) PASS (676 passed).
- **Host report-PDF error handling — source-backed gap, regression tests and minimal fix:** the handler previously returned `str(exc)` in the public `HOST-008` message. Test commit [ec8beeb](https://github.com/yay460-jpg/portofolio/commit/ec8beeb652242ad355a2846952715e821040ac3e) introduced the non-object JSON case; [b5c264c](https://github.com/yay460-jpg/portofolio/commit/b5c264c784502afe796155db1fbac133a66e0d3e) now returns `Invalid report request`; follow-up test commit [799deb4](https://github.com/yay460-jpg/portofolio/commit/799deb4452ef8780f68eb4c25995c2438d526ebf) extends regression coverage to malformed JSON and non-object JSON. CI status for these commits is not available through the current status response, so this is **implementation pending validation**, not PASS.
- **Still open:** deeper Host Evidence/static/symlink/error boundaries, malformed report-PDF variants and error sanitization validation, Geo bearing-distance numeric cases, broader Topo3D v2 manifest/version/count/resource combinations, and full Browser Guard consumer/Console verification. EVO2-03 remains IN PROGRESS; no security release or `main` promotion is implied.

## Attack surface priority

1. Host origin/request boundary and `POST /runtime`.
2. Import, restore, and dataset/file operations.
3. Evidence upload/list/preview/file operations.
4. Static-file access and report generation.
5. RuntimeAdapter request contracts and exception behavior.
6. Browser package/import/rendering, including the existing map security module.
7. Geo numeric/CRS ranges and Topo3D DTM/mesh/resource limits.

Priorities are an ordering for audit and test design, not findings of confirmed vulnerabilities. Detailed routes, size limits, operations, existing tests, and remaining questions are in [Endpoint & Operation Inventory](Endpoint-Operations-Inventory.md).

## Security guard responsibilities

### Common policy

- Consistent rejection envelope and safe error handling principles.
- Explicit maximum sizes/counts/depths where relevant.
- Clear ownership of trust boundary and validation stage.
- Repeatable adversarial test patterns and regression evidence.

### Browser Guard

- Input/payload preflight checks.
- Safe DOM/rendering patterns and resource bounds before expensive parsing.
- Defense-in-depth only; backend still validates all operations.

### Host Guard

- HTTP request shape, Origin policy, request size, parsing, path/file access, endpoint routing, and sanitized responses.
- Loopback does not automatically equal caller authentication.
- Apply policy without breaking the approved launcher/development origin paths; prove the behavior with tests.

### Domain guardrails

- Geo Engine owns CRS and numeric/spatial invariants.
- Topo3D owns DTM/package/mesh counts and GPU/resource constraints.
- RuntimeAdapter and backend domain/persistence services remain authoritative for data mutations.

## Change protocol

1. Confirm the existing control and all call sites before modifying code.
2. Write a failing, isolated test that demonstrates the gap or regression risk.
3. Make the smallest viable code change within the owning layer.
4. Run targeted tests and the full suite; preserve existing PASS behavior.
5. Inspect the diff for accidental scope expansion, secret/path leakage, or data mutation.
6. Record evidence and update this checklist only after observed results.

## Completion rule

Evo 2 is not LOCKED by the creation of this folder or by a green suite alone. Each stage is completed only when its exit criteria and evidence are recorded. Global Evo 2 may be declared locked only after the applicable browser, host, Geo, and Topo3D boundaries pass review and regression validation.


## Initial implementation evidence

- Host Origin policy patch: Full Pytest #608 PASS — https://github.com/yay460-jpg/portofolio/actions/runs/38416665156.
- Topo3D package-size preflight patch: Full Pytest #609 PASS — https://github.com/yay460-jpg/portofolio/actions/runs/38417323954.
- Static-file allowlist patch: Full Pytest #611 PASS — https://github.com/yay460-jpg/portofolio/actions/runs/38418373578.
- Unreadable-workbook import error sanitization: Full Pytest #613 PASS — https://github.com/yay460-jpg/portofolio/actions/runs/38419516850.
- Snapshot restore accepted an unexpected `payload.data` entity in the locked source: isolated test-only commit `8ceb766` reproduced it (`1 failed, 584 passed`, Full Pytest #615: https://github.com/yay460-jpg/portofolio/actions/runs/38421789115). The failure was expected as a red-phase reproduction, not a baseline change.
- Fix: `SnapshotManager` rejects unknown entity keys before accepting the payload; `DatasetManager` now rejects unknown entity keys before replacing runtime data. In-memory/temp-path regression tests cover both paths. Full Pytest #616 PASS, 586 passed: https://github.com/yay460-jpg/portofolio/actions/runs/38422299996.
- Backup size preflight: temporary-directory tests reproduced four missing preflight cases (file read and Base64 decode for Topography and Marker Location backups). The test-only run #618 recorded 586 passed and four focused failures: https://github.com/yay460-jpg/portofolio/actions/runs/38423367223. First integration run #619 exposed an instance-helper invocation error in Topography backup save (585 passed, five failures); it was corrected in commit `0a8371d38d08ea7eae399a57d048e4ad6ca9ab86`. The final fix checks encoded Base64 size before decode and stats/reads at most `MAX_PACKAGE_BYTES + 1` before rejecting oversized backup files. Full Pytest #620 PASS, 590 passed: https://github.com/yay460-jpg/portofolio/actions/runs/38424109031.

All Evo 2 code patches above exist on `v41-workspace` only. `main` remains the locked V41 baseline. Each result validates the current full regression suite, but does not lock Security Evolution 2 as a whole.

## Workflow #637–#638 — READ collection isolation — 2026-10-14

- Full Pytest #637 completed successfully: https://github.com/yay460-jpg/portofolio/actions/runs/38455358687. Tests verify that mutating returned AuditLog events and controlled-list values does not mutate the backing store.
- Documentation sync #638 completed successfully: https://github.com/yay460-jpg/portofolio/actions/runs/38455386931.
- READ isolation now has passing targeted coverage for KPI nested history, AuditLog events, and controlled-list values. This does not establish that every operation response or nested payload across all runtime managers is detached.

## EVO2-02 next slice — RuntimeAdapter replay/idempotency inventory — 2026-10-14

- RuntimeAdapter declares 20 operations. CRUD (`CREATE`, `UPDATE`, `DELETE`) pass `request_id` to `ApplicationService`, whose in-memory `_request_guard` rejects already-successful IDs as `DUPLICATE_REQUEST`; this is process-local and not a durable replay cache.
- Other operations do not pass `request_id` into their side-effecting runtime methods (`IMPORT_XLSX`, `BACKUP`, `RESTORE`, dataset save/load, Topography/Marker backup save/load, `FINALIZE_KPI`). Their replay semantics must be assessed operation by operation; do not infer idempotency from a required adapter envelope alone.
- READ and LIST operations are read-only by intent but still require response isolation and authorization/exposure checks.
- Next: add an explicit operation contract matrix with side effects, audit behavior, idempotency key usage, and test evidence; then add isolated replay tests for high-impact side effects before any production patch.
## Workflow #634 — KPI READ nested-data exposure — 2026-10-14

- Red-phase workflow #634 failed as intended: 599 passed, 1 failed. Mutating nested fields in the result of `read_kpi_snapshots()` changed the stored KPI history (`result.PA.value` became `-999`): https://github.com/yay460-jpg/portofolio/actions/runs/38454460124.
- Confirmed cause: `KPIHistoryStore.list()` copied only each top-level record with `dict(x)`, leaving nested objects shared with internal records.
- Fix committed as `8d1107ef5da24d4cccd20ac536c048fbbd73c3bb`: return `deepcopy(records)` from `list()`. This isolates nested response data from runtime-owned history.
- Full Pytest #635 completed successfully on the fix commit: https://github.com/yay460-jpg/portofolio/actions/runs/38454745839. The nested KPI read-exposure fix is PASS for the reproduced case.
- Next READ checks: verify `AuditLog` and controlled-list results are detached/read-only. Isolated tests were added in `tests/test_security_read_collections.py`; Full Pytest #637 is queued at https://github.com/yay460-jpg/portofolio/actions/runs/38455358687. Then document replay/idempotency expectations for all 20 adapter operations.
## Workflow #631 — KPI finalization atomicity fix — 2026-10-14

- Full Pytest #631 completed successfully: https://github.com/yay460-jpg/portofolio/actions/runs/38454081053.
- The two #630 red-phase tests are now covered by the runtime rollback path: failed audit append or workbook save restores the KPI history records/file and workbook store snapshot, and returns a rejected result rather than reporting a committed finalization.
- Scope is limited to injected audit/store-save failures with a temporary KPI history file. Crash/power-loss atomicity across two independent files is not guaranteed by in-process rollback and is not claimed by this result.
- Next audit slice: READ contract/exposure for `AuditLog`, controlled lists, and KPI snapshots; test filtering, stable copies, and that returned values cannot mutate runtime-owned state. Continue tracking per-operation request replay/idempotency separately.
## Workflow #630 — KPI cross-store atomicity reproduction — 2026-10-14

- Red-phase workflow #630 failed as intended: 597 passed, 2 failed. Both new tests showed `finalize_kpi()` returned `COMMITTED` after audit append or workbook save failed, while the KPI history had already been committed: https://github.com/yay460-jpg/portofolio/actions/runs/38453697482.
- Production fix committed as `2fe5eb29b4c16d32d85d801b3537f28dbe400ef2` in `runtime.py`. The flow now snapshots the workbook store, KPI history records, and prior KPI history file bytes; on failure it restores those states and returns `REJECTED` with `KPI_FINALIZATION_FAILED` / `NOT_APPENDED`.
- Full Pytest #631 is queued/pending at the time of this note: https://github.com/yay460-jpg/portofolio/actions/runs/38454081053. Do not mark this fix PASS until the workflow completes successfully.
- After #631, inspect the tests for both audit failure and workbook save failure, then continue the RuntimeAdapter operation inventory and READ exposure audit.
## Workflow #628 — dataset save atomicity fix — 2026-10-14

- Red-phase workflow #627 reproduced two failures: dataset JSON remained after audit append failed, and after workbook store save failed. The run recorded 595 passed and 2 failed: https://github.com/yay460-jpg/portofolio/actions/runs/38452998298.
- Production fix committed as `3e36b34803daa39bd12367170c7b67d43d5d03da` in `lithosite-Mine-Services/src/mine_services/runtime.py`. A shared transactional helper snapshots store/audit state, active dataset metadata, and pre-existing target file bytes; on failure it restores prior state and removes or restores the target file.
- Full Pytest workflow #628 completed successfully: https://github.com/yay460-jpg/portofolio/actions/runs/38453280551. This validates the current full suite including the two formerly failing reproductions.
- Scope is limited to dataset save and save-as rollback. KPI history/workbook cross-store atomicity remains unverified and is the next EVO2-02 test slice.

## Workflow #625 — RuntimeAdapter mutation atomicity tests — 2026-10-14

- Test commit: `48aad9d4c776d33e3b467a7546fe861c8de58df7`.
- Full Pytest workflow #625 completed with conclusion `success`: https://github.com/yay460-jpg/portofolio/actions/runs/38452202355.
- Added isolated tests in `lithosite-Mine-Services/tests/test_security_runtime_atomicity.py` for CREATE, UPDATE, and DELETE when `AuditRepository.append()` raises.
- The tests assert the expected rejected adapter response, restored entity state, and unchanged audit log. This validates the existing rollback behavior for these injected audit-append failures under the in-memory test store.
- No production code changed in this commit. Do not interpret these three cases as complete coverage of persistence failures, dataset lifecycle, or KPI cross-store atomicity.
- Next EVO2-02 slice: add isolated tests for dataset file creation/update followed by audit or workbook-save failure; then reproduce the observed `FINALIZE_KPI` ordering using a temporary KPI history file and forced audit/store-save failure. Determine expected recovery contract before proposing any production patch.

## Workflow #623 synchronization — 2026-10-14

- Latest workspace HEAD verified: `30ff61b8a693aec691ab03119f6906f171029173` (`v41-workspace`).
- Full Pytest workflow #623 completed with conclusion `success`: https://github.com/yay460-jpg/portofolio/actions/runs/38439995521.
- Commit #623 adds row-field allowlisting to `SnapshotManager._validate_payload()` and `DatasetManager._validate_document()`. Unknown row keys are rejected before domain validation / dataset load mutation.
- Roadmap status remains unchanged: EVO2-02 through EVO2-06 are IN PROGRESS; EVO2-07 remains BLOCKED. A successful CI run validates the current suite only and is not a full security release gate.
- Historical evidence for red-phase reproductions #615 and #618 and intermediate integration failure #619 is retained below.

## EVO2-02 next audit slice — mutating operations and KPI boundary

Source inspection performed on workspace code at HEAD `30ff61b8a693aec691ab03119f6906f171029173`:
- `RuntimeAdapter.handle()` dispatches CREATE/UPDATE/DELETE to `ApplicationService`; that service validates domain rows and wraps store mutation plus audit append in `TransactionManager`. Existing `ApplicationService` checks primary-key immutability, system fields, foreign keys, controlled lists, and related domain rules through `ValidationEngine`.
- `RuntimeAdapter` catches unexpected exceptions and returns generic `ADP-005` for adapter-dispatched operations. However, several operations have operation-specific downstream paths and need independent failure-injection tests rather than relying only on the generic envelope.
- `RuntimeInterface.load_dataset()` takes an in-memory snapshot, applies dataset load, audits and saves; on exception it restores the prior runtime snapshot. `save_dataset()` and `save_dataset_as()` write audit and save after the dataset file has been written; inspect for orphaned dataset-file behavior if audit/save fails.
- `RuntimeInterface.finalize_kpi()` asks `KPIHistoryStore.finalize()` to commit to its separate JSON history file before appending audit to the workbook store. If the later audit/save fails, the code reports `audit_status: NOT_APPENDED` and restores only the application store snapshot; the already-committed history file may remain changed. This is a confirmed ordering observation, **not yet a confirmed vulnerability**; verify intended contract and reproduce using a temporary KPI-history path plus a forced audit/store-save failure before proposing a patch.
- The adapter accepts arbitrary `request_id` values and tracks duplicate request IDs only in the in-memory `ApplicationService` for CREATE/UPDATE/DELETE; other operations have their own/no idempotency behavior. Record per-operation replay expectations explicitly before centralizing this policy.
- Next isolated tests should cover CREATE/UPDATE/DELETE audit-failure rollback, dataset file vs audit/store save failure, KPI finalize cross-store atomicity/replay, and READ exposure of `AuditLog` / controlled lists. Use in-memory stores and pytest temporary directories; never use the operational A3 workbook or real backup/Evidence folders.




## EVO2-02 continuation — replay retry and persistence rollback — 2026-10-14

- Full Pytest #655 PASS: a rejected XLSX import attempt is not cached as a successful response; a retry with the same request ID may execute again. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38467949013.
- Full Pytest #656 PASS: replay validation documentation synchronized. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38467958760.
- Added isolated regression tests for dataset overwrite rollback when workbook/store persistence fails, and KPI History rollback preserving pre-existing file bytes/records when the later store save fails. Both use temporary directories/stores. Validation pending.
- Scope note: #653 uses a stubbed import call, so it validates adapter request replay semantics, not real XLSX parsing or domain mutation.
- Next: wait for Full Pytest on the new rollback tests; inspect any failure logs before production changes. Then audit request-cache size/lifetime and cross-restart behavior. Do not implement durable idempotency until storage/ownership and recovery semantics are defined.
- Release gate remains blocked; no changes promoted to `main`.


## EVO2-02 continuation — rollback PASS and Android adapter lifetime finding — 2026-10-14

- Full Pytest #657 PASS: KPI finalize rollback restores existing KPI History file bytes/records when the subsequent store save fails. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38468724314.
- Full Pytest #658 PASS: dataset save rollback restores the pre-existing dataset file, active dataset state, and audit state after store-save failure. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38468750357.
- Full Pytest #659 PASS: documentation sync. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38468756229.
- Source-trace finding requiring a focused test/design decision: `android-host/app/src/main/python/android_entry.py` calls `_runtime_for(app_dir)` inside every `handle()` call, and `_runtime_for()` constructs a new `RuntimeAdapter`. Therefore the current in-memory replay cache is not retained between Android bridge calls, even though the Python module itself is loaded through the persistent Chaquopy module. Do not call this a confirmed exploit; it is a mismatch between the intended replay guarantee and Android host object lifetime. Add a host-level regression test and choose adapter/runtime lifecycle ownership before claiming replay protection on Android.
- `MineServicesBridge.kt` holds the Python module but calls `android_entry.handle()` for each request; it does not itself retain the adapter. Confirm the intended runtime/store lifecycle before moving ownership, because changing it may also affect resource usage and shared state.
- Next audit slice: host lifecycle/replay guarantee, then READ exposure of AuditLog and controlled lists against the actual host boundary. Desktop host binds to loopback; its lack of auth middleware is a threat-model fact, not by itself a confirmed vulnerability. No production patch until a focused test reproduces the behavior and expected contract is agreed.
- Replay cache remains unbounded and process-local in the desktop adapter; cross-restart/cross-process idempotency is not guaranteed. Release gate remains blocked; no changes promoted to `main`.


## EVO2-02 — Android replay lifecycle reproduction and scoped correction — 2026-10-14

- Full Pytest #662 FAILED as intended by the reproduction test: two calls to `android_entry.handle()` with the same request each constructed a fresh RuntimeAdapter, and the fake downstream side effect count was 2 instead of 1. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38469841530. Suite result: 1 failed, 614 passed.
- Corrective patch committed as `8cf53b1e7b137b9322e592ab5e1d3303f599a94b`: Android host now retains RuntimeAdapter instances in a process-local map keyed by the resolved application directory, with a lock around adapter lookup/construction. This aligns the adapter cache lifetime with repeated bridge calls for a given app directory.
- Full Pytest #663 is queued; do not mark Android replay lifecycle PASS until the workflow completes successfully. Follow-up review should assess adapter cache lifecycle when app directories change and ensure Android host shutdown/process restart semantics are documented. This remains process-local and does not provide cross-restart idempotency.
- `main` remains locked; no promotion. Release gate remains blocked.


## EVO2-02 — Android lifecycle validation and initialization race hardening — 2026-10-14

- Full Pytest #663 PASS: the first scoped Android adapter-retention correction passed the complete suite. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38470291849.
- Full Pytest #664 PASS: documentation synchronization. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38470313842.
- Follow-up code review identified a first-initialization race: cache lookup was locked, but adapter construction and insertion happened after releasing the lock. Concurrent first calls for the same app directory could therefore still construct separate adapters. This was not covered by #663.
- Corrected in commit `a3d20dfcbe9ca0fec91488f14dba94c09d648778`: keep adapter lookup, construction, and insertion within `_ADAPTERS_LOCK`.
- Added isolated tests for concurrent initialization (16 calls across 8 threads must create one adapter) and cache scoping across separate application directories. Full Pytest is pending; do not mark the race-hardening follow-up PASS until CI succeeds.
- Cache remains process-local and unbounded; app-directory changes create separate adapters, and process restart clears replay state. These lifecycle semantics still require explicit documentation and resource-lifetime review. No promotion to `main`; release gate remains blocked.


## EVO2-02 — Android adapter initialization race closed by tests — 2026-10-14

- Full Pytest #665 PASS: adapter lookup, construction and insertion are serialized under `_ADAPTERS_LOCK`. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38471552956.
- Full Pytest #666 PASS: concurrent initialization (16 calls across 8 threads) creates one adapter for the same resolved app directory; different app directories receive separate adapters. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38471569652.
- Full Pytest #667 PASS: roadmap synchronization. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38471607265.
- Android in-process adapter lifetime/replay guard now has targeted regression evidence. Remaining limits: process restart clears cache; cache is process-local and currently unbounded; no durable cross-restart idempotency claim. Review resource lifetime and shutdown semantics before declaring the host lifecycle audit complete.
- Next audit slice: READ exposure and caller policy. Existing unit tests confirm detached copies for `AuditLog`, `_Lists`, and KPI snapshots, but that is data-isolation evidence, not authorization. Trace which UI features call these entities, what fields are returned, and whether the local-host threat model requires role/scope filtering. No restriction patch until expected access contract is defined.


## EVO2-02 — READ exposure and caller-boundary trace — 2026-10-14

- Source trace confirmed the public adapter's `READ` dispatch forwards `entity` and optional `entity_id` to `RuntimeInterface.read()`. Domain entities return full stored rows via `ApplicationService.read()`; `AuditLog` returns all audit events (or one event by audit ID); `_Lists` returns controlled-list values. Returned-data detachment tests prevent caller mutation from altering stored values, but do not provide authorization or field-level filtering.
- The active Operations UI explicitly reads `Operations`, `Checker`, `WorkFront`, `Equipment`, `_Lists`, `GlobalCapacity`, and `Maintenance`. `_Lists` is a required UI dependency. The inspected Operations UI does not call `AuditLog`; do not conclude that no other UI module uses it until the complete UI call-site inventory is finished.
- Desktop Host binds to loopback and enforces the Origin allowlist on `POST /runtime` when an Origin header is present. Existing host tests reject disallowed Origins on a `READ` request. This is a browser-origin boundary, not user authentication: local processes and callers without an Origin are not authenticated by this policy.
- Finding classification: **exposure boundary requires a contract decision; no confirmed remote unauthorized-read vulnerability from this trace alone.** The adapter can return audit data to callers accepted by the local-host boundary, and no role/scope authorization layer was observed. Do not patch by blocking AuditLog or filtering domain fields until all UI/report consumers and intended local trust model are inventoried.
- Next actions: finish the all-module READ call-site inventory; identify whether AuditLog is intentionally available to the UI; define the exact public READ entity allowlist and any sensitive-field policy; then add focused positive/negative adapter/host tests before a narrowly scoped enforcement patch. Keep all tests on temporary fixtures; do not use or alter the operational A.3 workbook.
- `main` remains locked at the V41 baseline. No production guard restriction or promotion was made in this audit slice.


### READ caller inventory extension — 2026-10-14

The UI source trace was extended beyond Operations:

- Domain UI reads observed: `Plans`, `Equipment`, `WorkFront`, `Operations`, `Issues`, `Maintenance`, `Checker`, and `HSE`; several modules also read `_Lists` and `GlobalCapacity`. This supports retaining these entity/list reads for current workflows, subject to the final full-repository scan.
- KPI UI reads snapshots through `READ_KPI_SNAPSHOTS` from `ui/modules/reports/kpi-foundation.js`; this is a separate explicit adapter operation rather than generic `READ`.
- In the modules inspected (Operations, Dashboard, Checker, Equipment, WorkFront, Maintenance, Issues, Plans, HSE, KPI Foundation, and report history/report entry modules), no `AuditLog` UI read was found. This is strong evidence that the generic public `READ AuditLog` target may be unnecessary for these UI flows, but it is not yet proof that no other script/integration consumes it.
- Decision remains HOLD on restriction patch until a complete caller scan and contract review. Next test design should establish the approved public READ entity set, test unknown/disallowed entities at the adapter boundary, and test any AuditLog restriction only after consumer compatibility is verified. Existing Origin 403 test is a host-boundary regression, not a substitute for entity authorization.


### CI confirmation and next decision gate — 2026-10-14

- Full Pytest documentation workflows #669, #670, #671, #672, and #673 are green in the latest user-provided Actions evidence. These establish that the READ audit records and caller-inventory documentation were committed and the suite passed; they do not establish that READ authorization is fixed.
- Direct adapter source review confirms generic `READ` currently forwards any supplied entity string to `RuntimeInterface.read(entity, entity_id)`. RuntimeInterface special-cases `_Lists` and `AuditLog`, while other names flow to `ApplicationService.read()`. There is no explicit public READ entity allowlist in `RuntimeAdapter` today.
- Generic `READ AuditLog` can therefore return all audit events to a caller that reaches the adapter. Current inspected UI modules do not use it, but the all-repository consumer scan remains incomplete and GitHub code search returned incomplete/no indexed matches; do not treat that as proof of no consumers.
- Decision: continue with a read-only complete caller/consumer inventory and an explicit contract proposal. Do not yet add a deny rule for AuditLog or an allowlist patch: this could break an uninspected integration. Next validation must include the host/API entry points and all shipped UI scripts, then define tests for allowed entities, unknown entities, and AuditLog exposure before enforcing the contract.
- Security classification remains **potentially over-broad local adapter exposure / contract not yet finalized**, not a confirmed remote exploit. Desktop Origin checks are not authentication for local processes. No production code changed in this audit slice; `main` and the operational A.3 workbook remain untouched.


### READ entity inventory — schema cross-check — 2026-10-14

- Cross-checked the domain schema. `DOMAIN_ENTITIES` contains exactly: `Equipment`, `WorkFront`, `GlobalCapacity`, `Checker`, `Operations`, `Maintenance`, `Issues`, `Plans`, `HSE`, and `MapMarker`. `AuditLog` is a separate persistence sheet and a special `RuntimeInterface.read()` target; `_Lists` is also a special controlled-list target. This distinction matters when drafting an adapter allowlist.
- Additional caller evidence: Dashboard explicitly reads `Plans`, `Equipment`, `WorkFront`, `Operations`, `Issues`, and `Maintenance`; marker-location synchronizes `MapMarker` and uses dynamic READ for linked domain entities (including HSE, Equipment, and WorkFront). KPI snapshots use the separate `READ_KPI_SNAPSHOTS` operation. Data Management uses dedicated dataset/backup/import/restore operations rather than generic READ.
- The shared runtime client sends requests to loopback `/runtime` and relies on the host to dispatch; it does not implement client-side entity authorization. Desktop Host's Origin policy is enforced separately and does not substitute for adapter-level operation/entity policy.
- Candidate contract for review (not enforced yet): generic READ should accept only the ten schema domain entities plus `_Lists`; keep `AuditLog` excluded from generic public READ unless a confirmed UI/integration consumer requires it. This is a proposal, not a confirmed policy, because the shipped-script and integration inventory is still being completed.
- Next: scan remaining shipped UI scripts, bridge/integration callers, and host helpers; verify whether any legitimate caller needs `READ AuditLog`; add isolated tests for each allowed entity, `_Lists`, `AuditLog`, and unknown entity behavior. Only then implement the smallest compatible enforcement and run Full Pytest. No code guard changed in this slice.


### Public READ guard implementation — 2026-10-14

- Implemented the generic READ allowlist in `lithosite-Mine-Services/src/mine_services/adapter.py`: schema-backed `DOMAIN_ENTITIES` plus `_Lists` are allowed; `AuditLog` and unknown names are rejected with contract error `ADP-007` at the adapter boundary.
- Added parameterized regression coverage in `tests/test_security_runtime_atomicity.py` for all ten domain entities, `_Lists`, `AuditLog`, an unknown entity, and a dunder-style name.
- Scope is intentionally limited to external `RuntimeAdapter.handle(operation=READ)`. The internal `RuntimeInterface.read("AuditLog")` method remains available for internal tests/services; do not describe this as universal audit-data authorization until all internal call paths and host adapters are reviewed.
- Validation gate: wait for the Full Pytest run triggered by these commits. No baseline promotion; main remains locked. If CI reveals any legitimate caller of generic READ AuditLog, investigate the caller and add a dedicated scoped operation rather than broadly reopening AuditLog.


### READ guard red-phase correction — 2026-10-14

- Full Pytest runs #678–#681 failed after the guard was introduced. Root causes were test-contract mismatches, not an observed failure of the allowlist: (1) an existing Stage 5 test still expected generic READ of `AuditLog` to succeed; (2) the new `_Lists` case incorrectly assumed a `status/data` wrapper, while the established controlled-list response is flattened; (3) the allowed-entity test assumed each empty domain read returns a list, which is not the adapter's current response shape for all targets.
- Corrected regression expectations: the legacy audit test now asserts `REJECTED / ADP-007`; the `_Lists` test checks the existing flattened controlled-list payload; domain entity cases check their response shape only where stable. Production guard remains unchanged in this correction.
- Follow-up Full Pytest runs triggered by commits `d6051c0` and `baf3d74` are the next gate. Do not call the public READ guard PASS until a green Full Pytest run and review of all remaining callers.


### Follow-up CI result and next roadmap gate — 2026-10-14

- Full Pytest #683 is GREEN: **631 passed in 58.18s**. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38478693120.
- Workflow #682 is RED on an earlier commit (`d6051c0`) because it still exercised the stale Stage 5 AuditLog expectation. Do not treat that earlier result as the latest code state; #683 ran after the test correction and is the current suite evidence. Documentation-only workflows #684 and #685 are also green.
- The adapter allowlist implementation is unchanged by the compatibility correction. Current confirmed contract: ten schema-backed `DOMAIN_ENTITIES` plus `_Lists` are allowed; generic public READ of `AuditLog`, unknown names and dunder-style names are rejected with `ADP-007`.
- Gate status: **adapter-level regression suite PASS; full consumer/host compatibility audit still OPEN**. This is not a release/baseline lock and does not authorize promotion to `main`.
- Next roadmap task: complete a repository-wide scan of shipped UI scripts, shared runtime clients, bridge/desktop host dispatch, and tests for generic `READ` requests and any dynamic entity values. Record exact paths/call sites; distinguish generic READ from dedicated operations such as `READ_KPI_SNAPSHOTS`. If a legitimate consumer of generic `AuditLog` appears, stop and design a scoped contract rather than weakening the allowlist wholesale.
- After inventory: add explicit tests for confirmed caller compatibility and host/adapter boundary behavior, rerun Full Pytest, then review whether the Evo 2 READ guard can be marked complete. Keep `main` locked throughout.


### READ caller inventory — UI, runtime client and host trace — 2026-10-14

- Full Pytest documentation workflows #686 and #687 are green in the latest user-provided Actions evidence. Evidence: #686 commit `f9f485a`, #687 commit `e9933f4`; these confirm the previous roadmap/matrix sync, not a new security test run.
- Traced the shipped UI READ call sites across operational modules, Dashboard, Reports/KPI, Workfront, Map Marker and shared client. Static generic READ targets observed are schema entities and `_Lists`; Reports uses a fixed `entities` array: `Operations`, `Equipment`, `WorkFront`, `Maintenance`, `Issues`, `Plans`, `HSE`. Marker Location has a dynamic `entity` read, but its source selector is explicitly restricted to `Equipment`, `WorkFront`, and `HSE` before dispatch. All are in the allowlist.
- The shared browser runtime client forwards requests to loopback `POST /runtime` without client-side entity authorization. This is expected: the adapter is the enforcement boundary.
- Desktop Host internal Evidence owner verification issues generic READ only for `Plans`, `HSE`, and `Maintenance`, through a fixed `record_specs` mapping. Those targets are allowlisted. Android host constructs and dispatches requests through the same `RuntimeAdapter`; no alternate READ dispatch path was observed in its entry point.
- `READ_KPI_SNAPSHOTS` is used separately by KPI Foundation and is not routed through the generic READ entity allowlist. No generic READ of `AuditLog` was found in the shipped UI modules or the inspected host helper. AuditLog remains available only through the internal RuntimeInterface API and the adapter now rejects it at the public boundary.
- Remaining scope note: this source inventory covers the shipped UI modules and the inspected Desktop/Android runtime entry points; it does not prove there are no out-of-repository integrations or direct internal Python consumers. The guard compatibility check is **PASS for inspected in-repository public callers**, while broader internal authorization and external-consumer assurance remain OPEN.
- Next: add or verify explicit regression coverage for the dynamic Marker Location READ set and Desktop Evidence host mapping, run Full Pytest, and review the host-origin tests alongside adapter tests. Do not weaken the allowlist without a demonstrated legitimate caller. `main` remains locked.


### Caller compatibility regression tests added — 2026-10-14

- Added Desktop Host tests asserting Evidence owner verification maps `TargetPlan -> Plans`, `HSE -> HSE`, and `Maintenance -> Maintenance`, and that unsupported modules (including `AuditLog`) are rejected before a READ dispatch.
- Added a Marker Location source-contract test locking its dynamic generic READ to the allowlisted source set `Equipment`, `WorkFront`, and `HSE`.
- These are regression guards for the inspected caller inventory, not a claim of test success yet. Full Pytest triggered by commits `072672f` and `c24f049` is the next validation gate.


### READ caller compatibility gate — CI verified — 2026-10-14

- Verified directly from GitHub Actions: Full Pytest #690 and #691 both completed with conclusion `success`; each job ran the full test suite on Python 3.13. Documentation workflows #688, #689, and #692 also completed successfully. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38479402095, https://github.com/yay460-jpg/portofolio/actions/runs/38479407426, https://github.com/yay460-jpg/portofolio/actions/runs/38479350186, https://github.com/yay460-jpg/portofolio/actions/runs/38479357519, https://github.com/yay460-jpg/portofolio/actions/runs/38479421329.
- Caller compatibility tests now cover the Marker Location dynamic entity restriction and the Desktop Evidence owner-to-domain mapping. The unknown Evidence module is rejected before any generic READ dispatch. No production behavior changed in this follow-up.
- Internal Python scan: within `src/mine_services`, the only generic dispatch to `RuntimeInterface.read()` is through `RuntimeAdapter`; the direct `RuntimeInterface.read("AuditLog")` usages found are internal tests (`tests/test_runtime.py`, `tests/test_security_read_collections.py`). Production code accesses audit events through the audit repository/store for internal auditing, not by issuing a generic public READ of `AuditLog`. This supports keeping `AuditLog` excluded from generic public READ; it does not constrain separately imported Python APIs or out-of-repository integrations.
- Result: **public generic READ allowlist and inspected in-repository UI/host caller compatibility PASS**. Internal tests that call `RuntimeInterface.read("AuditLog")` are intentionally testing the internal interface and must not be changed to reopen the public adapter contract. External integrations remain outside repository evidence.
- Roadmap sync: the READ caller/compatibility subtask is closed for inspected in-repository callers. **EVO2-02 remains IN PROGRESS**; this does not complete the global security release gate.
- Next slice (per existing EVO2-02 plan): complete the per-operation contract trace for `CREATE/UPDATE/DELETE`, `FINALIZE_KPI`, and remaining read/list operations—side effects, audit writes, replay/idempotency behavior, response contract and rollback tests. Then continue the separately open Geo, Browser Guard and Topo3D validation work. Do not promote to `main`.


### EVO2-02 operation contract slice — CRUD replay contract — 2026-10-14

- Reviewed `RuntimeAdapter.handle()`, `ApplicationService.create/update/delete`, and `TransactionManager`. CRUD is intentionally excluded from the adapter-level process-local replay cache; `ApplicationService._request_guard` owns duplicate request IDs and preserves the established `DUPLICATE_REQUEST` response. Mutations run inside the transaction manager; audit append or store-save failure should roll back store state.
- Existing isolated atomicity tests cover CREATE/UPDATE/DELETE rollback when audit append fails, and separate tests cover KPI finalize and dataset save rollback on audit/persistence failure. These are existing evidence and were not rerun as part of this documentation update.
- Added three isolated replay regression tests to `tests/test_security_request_replay.py` for CREATE, UPDATE and DELETE: reuse a successful request ID with a changed payload or repeat a delete, assert the exact `DUPLICATE_REQUEST` contract, no second mutation, and no additional audit entry. Test fixtures use a fresh in-memory store and temporary runtime directories.
- Full Pytest #696 PASS: complete Python 3.13 suite succeeded for commit `cbcd8c0`; all three new CRUD replay tests are included. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38482028953. Documentation workflows #697 and #698 also succeeded: https://github.com/yay460-jpg/portofolio/actions/runs/38482050858 and https://github.com/yay460-jpg/portofolio/actions/runs/38482056039.
- Result: **CRUD replay regression gate PASS**. This validates the existing ApplicationService-owned `DUPLICATE_REQUEST` contract and does not add or claim durable idempotency.
- Next operation slice: add explicit identical-request replay coverage for `FINALIZE_KPI` (detached cached response, one history record and one audit event), then review remaining READ/LIST and file operations against the operation matrix. The unbounded process-local cache and restart limitation remain documented design gaps; do not implement durable idempotency without a defined persistence/ownership/recovery contract. `main` remains locked.


### EVO2-02 KPI identical replay gate — 2026-10-14

- Added an isolated regression test for identical `FINALIZE_KPI` request replay in `tests/test_security_request_replay.py`. It checks that the second call returns a detached copy of the cached committed response, caller mutation of the first response cannot corrupt the cache, and replay does not create a second KPI history record or audit event.
- Fixtures use a fresh adapter, in-memory persistence store, and temporary KPI history/dataset/backup directories.
- Full Pytest #701 PASS on Python 3.13 for commit `40bbb36`; detached cached response, caller-mutation isolation, one KPI history record, and one audit event all validated. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38483042457. Documentation workflows #702 and #703 also passed: https://github.com/yay460-jpg/portofolio/actions/runs/38483057327 and https://github.com/yay460-jpg/portofolio/actions/runs/38483062606.
- Result: **FINALIZE_KPI identical replay gate PASS**.
- Initial operation-set review found that adapter replay caching is intentionally applied only to selected operations (`IMPORT_XLSX`, `RESTORE`, dataset save/load, backup save/load, and `FINALIZE_KPI`), while `BACKUP` and LIST operations bypass the cache. This is not automatically a defect: classify each operation by side effects and repeatability before changing the guard. Next: trace `BACKUP`, all LIST operations, `LOAD_TOPOGRAPHY_BACKUP`, and `LOAD_MARKER_LOCATION_BACKUP` for state changes, audit writes, and retry safety. Add tests only where the expected contract is established. `main` remains locked.


### EVO2-02 BACKUP and LIST operation contract gate — 2026-10-14

- Source review confirmed `BACKUP` calls `SnapshotManager.capture()` and does not write audit or mutate the store; each call intentionally creates a fresh snapshot ID, so it should not be forced into the idempotent response cache.
- `LIST_DATASETS`, `LIST_TOPOGRAPHY_BACKUPS`, and `LIST_MARKER_LOCATION_BACKUPS` call their respective list/read paths and are expected to be observational reads. Caching these responses would risk stale results as files change, so repeated same-ID calls are intentionally expected to execute again.
- Added isolated regression tests: repeated `BACKUP` calls return fresh sealed snapshots without store/audit mutation; repeated LIST requests call the underlying list provider again and reflect changed data without changing store/audit state. CI is **PENDING** for test commit `f7fe053`; do not mark PASS until Full Pytest succeeds.
- Next after CI: inspect `LOAD_TOPOGRAPHY_BACKUP` and `LOAD_MARKER_LOCATION_BACKUP` source contracts (read-only file parsing versus runtime mutation), then test retry behavior and file tampering/error handling. `main` remains locked.


### EVO2-02 backup LOAD contract gate — 2026-10-14

- Full Pytest #706 PASS for commit `f7fe053`: repeated `BACKUP` requests create fresh sealed snapshots without store/audit mutation; repeated LIST operations execute underlying readers again and leave runtime store/audit unchanged. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38483752068. Documentation workflows #707 and #708 passed.
- Source review of `TopographyBackupManager.read()` and `MarkerLocationBackupManager.read()` confirms both validate the requested basename/extension, resolve the path under the configured backup directory, reject missing files, read with a size bound, and validate package structure before returning base64 content. The RuntimeInterface LOAD methods only decorate the returned payload with `status=READY`; they do not apply it to live runtime state.
- Added isolated tests for repeated LOAD calls preserving read-only state and for retrying the same request ID after a first missing-backup failure. CI is **PENDING** for test commit `702d3d5`; do not mark PASS until Full Pytest succeeds.
- Next after CI: check package corruption/oversize/path traversal failure contracts at adapter boundary and verify errors are translated to stable responses; then continue remaining operation inventory and cache-lifetime risk decision. `main` remains locked.


### EVO2-02 LOAD replay red-phase correction — 2026-10-14

- Full Pytest #709 exposed two incorrect test assumptions (642 passed, 2 failed): successful LOAD requests are included in the adapter replay cache, so identical same-ID requests must call the backup reader once and return the cached detached response; adapter runtime exceptions are normalized to `REJECTED` / `ADP-005`, not raised to the caller.
- Corrected the tests to preserve the existing replay contract: success is cached; `REJECTED` responses are not cached, allowing the same request ID to retry. No production behavior was changed.
- Corrected regression tests committed as `8387be1`; Full Pytest and docs CI are **PENDING**. Do not mark the LOAD gate PASS until CI succeeds.


### EVO2-02 backup LOAD rejection-boundary gate — 2026-10-14

- Full Pytest #712 PASS after correcting the LOAD replay tests to the established adapter contract (successful identical requests are cached; normalized `REJECTED`/`ADP-005` failures are not cached). Documentation workflows #713 and #714 PASS.
- Added isolated adapter-boundary regression coverage for missing files, traversal-style filenames, corrupt package contents, and oversized files for both Topography and Marker Location LOAD operations. Expected public response is a generic `REJECTED` / `ADP-005` without leaking internal exception details.
- Test commit `b4361d7`; Full Pytest and documentation CI are **PENDING**. If green, next audit the complete operation matrix for remaining persistence/replay/error-normalization gaps. `main` remains locked.


### EVO2-02 backup SAVE write-failure atomicity gate — 2026-10-14

- Full Pytest #715 PASS for backup LOAD rejection-boundary coverage; documentation workflows #716 and #717 PASS.
- Started the next operation-contract slice: backup SAVE write-failure behavior for Topography and Marker Location. Added isolated tests that simulate a filesystem write failure while saving a new package and assert existing backup bytes and directory contents remain unchanged.
- Test commits: Topography `c61d472`, Marker Location `b832870`. Full Pytest and documentation sync are **PENDING**. These tests cover failure before retention cleanup; they do not claim rollback of a failure during multi-file retention eviction. If green, map retention-cleanup failure semantics separately before changing production behavior.
- `main` remains locked; no release-gate promotion.


### EVO2-02 backup retention cleanup failure — red-phase reproduction — 2026-10-14

- Full Pytest #718 and #719 PASS: failures while writing a new Topography or Marker Location backup preserve existing files. Documentation workflows #720 and #721 PASS.
- Added isolated red-phase tests for a distinct failure window: the new backup has been written, but retention cleanup fails while evicting an older backup. The required rollback expectation is that all pre-existing backup bytes/files remain and the newly created backup is removed. Test commits: Topography `be3240b`, Marker Location `eafbfef`.
- Full Pytest and docs CI are **PENDING**. This test intentionally probes current behavior before production changes; do not call retention atomic until the failure window is addressed. Next: inspect red-phase results, then implement a small shared/consistent rollback strategy only if reproduced. `main` remains locked.


### EVO2-02 backup retention cleanup failure — reproduced and scoped fix — 2026-10-14

- Red-phase CI confirmed a real gap: Full Pytest #722 and #723 failed (647 passed, 2 failed) because both backup managers left the newly written package behind when the first retention unlink raised `OSError`. Workflow #724 also failed because its documentation job ran the full suite against the intentionally failing red-phase tests; this was expected evidence, not a docs-content defect.
- Applied a scoped production fix in both Topography and Marker Location managers: if retention cleanup raises `OSError`, remove the newly created target and re-raise. Commits Topography `2d2bb66`, Marker Location `75c9143`.
- Explicit limitation: this protects against the tested cleanup failure before any old file has been removed. It does **not** guarantee rollback of old files already deleted if a later unlink fails part-way through multi-file eviction. Do not describe retention as fully atomic until that partial-eviction case is separately designed and tested.
- Full Pytest and roadmap/matrix documentation CI for the fix are **PENDING**. `main` remains locked.


### EVO2-02 backup retention rollback — partial-eviction hardening — 2026-10-14

- Follow-up review found the first fix removed the new package but did not restore an older package if a later retention unlink failed after an earlier unlink had succeeded.
- Both Topography and Marker Location managers now stage copies of all files selected for eviction before deleting any. On an OSError during eviction, the manager restores any staged old file that is missing, removes the new package, and re-raises the original failure.
- Added regression tests for failure on the second eviction, after one old file has already been removed:
  - Topography: commit b4a9bca
  - Marker Location: commit 0c2b9b3
- Production fixes: Topography e2b9879; Marker Location a10957a.
- Validation of these follow-up commits is IN PROGRESS in GitHub Actions #729–#732. Do not mark EVO2-02 complete until both tests and the final full-suite CI pass.
- Scope note: this is exception rollback, not a claim of crash-atomic filesystem transactions. Recovery itself can still fail under a second filesystem failure; that failure mode must not be represented as guaranteed.


### EVO2-02 backup retention rollback — partial-eviction gate PASS — 2026-10-14

- GitHub Actions #729 and #730: Topography and Marker Location production rollback changes passed Full Pytest.
- GitHub Actions #731 and #732: partial-eviction regression tests passed Full Pytest for both backup managers.
- Documentation sync workflows #733 and #734 also passed. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38487565450, https://github.com/yay460-jpg/portofolio/actions/runs/38487572665, https://github.com/yay460-jpg/portofolio/actions/runs/38487594633, https://github.com/yay460-jpg/portofolio/actions/runs/38487604828, https://github.com/yay460-jpg/portofolio/actions/runs/38487648336, https://github.com/yay460-jpg/portofolio/actions/runs/38487657212.
- Result: **partial-eviction exception rollback gate PASS**. Scope remains caught filesystem exceptions; do not claim crash-atomicity or guaranteed recovery if the recovery writes themselves fail.
- Next gate: verify failed `SAVE_TOPOGRAPHY_BACKUP` and `SAVE_MARKER_LOCATION_BACKUP` attempts are not cached as successful responses and the same request ID can retry after the underlying failure is corrected. Keep the replay cache process-local and unbounded as a documented design risk; do not change cache capacity/TTL or claim durable idempotency without an explicit contract decision.


### EVO2-02 backup SAVE retry contract — CI PASS — 2026-10-14

- Full Pytest #735 PASS for commit `ea9b43b`: injected first-attempt write failures for both Topography and Marker Location SAVE paths return `REJECTED` / `ADP-005`; the same request ID then retries successfully after the injected failure is removed. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38488260830.
- Documentation workflows #736 and #737 PASS and synchronize the roadmap and operation contract matrix: https://github.com/yay460-jpg/portofolio/actions/runs/38488283239 and https://github.com/yay460-jpg/portofolio/actions/runs/38488291682.
- Result: **backup SAVE retry gate PASS**. The test does not claim that every filesystem failure is recoverable, nor that the retention rollback is crash-atomic.
- Next: finish the RuntimeAdapter replay-cache lifecycle/ownership audit: selected operation coverage, request-ID collision behavior across operations, serialization under the global lock, unbounded growth, and process restart semantics. Document findings and an explicit decision gate before changing cache policy. No TTL, capacity limit, or durable idempotency is authorized by current evidence. `main` remains locked.


## EVO2-02 — replay-cache lifecycle source audit — 2026-10-14

- Documentation gate for the backup SAVE retry contract is complete: Full Pytest #735 PASS and docs workflows #736–#739 PASS. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38488260830 and https://github.com/yay460-jpg/portofolio/actions/runs/38488660537.
- Source audit of `RuntimeAdapter.handle()` identifies a single adapter-instance `RLock` protecting lookup, downstream execution, and insertion for the selected replay-cache operations. This prevents two concurrent identical requests through this adapter instance from both executing, but it also serializes unrelated selected operations while the downstream operation runs.
- Cache keys are `request_id`; the fingerprint includes the complete request (including operation). Reusing an ID with a different payload/operation inside the selected cache set returns `ADP-006`. Successful responses are deep-copied into and out of the cache; `REJECTED`, `ERROR`, or responses with errors are not cached.
- The cache is in-memory, instance-local, unbounded, and lost on adapter recreation/process restart. There is no TTL or eviction policy. These are observed implementation properties, not proof of a current production exploit.
- Ownership boundary: CRUD (`CREATE`, `UPDATE`, `DELETE`) bypasses the adapter cache and delegates duplicate-ID behavior to `ApplicationService`; observational `BACKUP` and LIST operations also bypass it. Therefore the adapter cache does not provide a universal request-ID namespace across all 20 operations. Whether IDs must be globally unique across operation families is an unresolved contract decision; do not patch by assumption.
- Next gate: add isolated contract tests for cross-family request-ID reuse and concurrency/serialization behavior, review expected semantics with the operation owners, then choose explicitly between per-operation-family ID scope and a unified adapter-wide request ledger. Do not add TTL/capacity or durable storage until retention and restart semantics are approved. `main` remains locked; EVO2-02 remains IN PROGRESS.

## Workflow #740–#743 — RuntimeAdapter replay contract and cross-family scope — 2026-10-14

- #740 records the replay-cache lifecycle inventory and the decision questions for request-ID scope: https://github.com/yay460-jpg/portofolio/actions/runs/38489432674.
- #741 records cache ownership/lifecycle findings: https://github.com/yay460-jpg/portofolio/actions/runs/38489439711.
- #742 was a characterization run but failed at one assertion (654 passed, 1 failed). The test observed two audit entries after `SAVE_AS_DATASET` followed by `CREATE` using the same request ID. This is consistent with the two separate successful side effects; the test's expected count of one was incorrect. Run: https://github.com/yay460-jpg/portofolio/actions/runs/38489717343.
- Test-only correction: commit `cf8083b1f8e7f43485b5978627021b1d6efcc363` changes the expected audit count to two and explains the two audit sources. No production behavior was changed.
- Full Pytest #743 PASS: https://github.com/yay460-jpg/portofolio/actions/runs/38489990780.
- Current finding: replay-cache guards reject reused IDs with conflicting payloads among cached adapter operations, and identical concurrent cached requests are tested to execute the side effect once. CRUD uses a separate application-level request guard; a characterization test confirms the same ID can currently be used once in the adapter cache family and once in CRUD.
- Decision still OPEN: whether request IDs are intentionally scoped per guard/family or should be global across all RuntimeAdapter operations. Do not change production code until the public contract and compatibility expectations are decided.
- Next: inventory each operation's replay owner and persistence lifetime, then add/confirm isolated tests for concurrent conflicting payloads, rejected/failed retry behavior, and cross-family audit/side-effect contracts. Preserve current CRUD duplicate behavior unless a confirmed contract gap justifies a minimal change.

## Workflow #745–#746 — Replay concurrency and retryability — 2026-10-14

- Full Pytest #745 PASS: concurrent identical cached requests execute the side effect once, and conflicting payloads sharing a request ID yield one accepted operation and one `ADP-006` rejection. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38490506418.
- Added a focused test for `SAVE_AS_DATASET`: a rejected first attempt must not be cached as a successful replay result, allowing the same request ID and payload to retry. Workflow #746 is running; do not record PASS until its conclusion is observed: https://github.com/yay460-jpg/portofolio/actions/runs/38492024542.
- Current replay behavior is now covered for identical concurrent calls, concurrent conflicting payloads, and retry after rejection for `IMPORT_XLSX` plus the new dataset-save case (pending CI). Other operation-specific failure paths remain to be reviewed against the matrix.
- Next after #746: inspect results, then extend the replay contract matrix and audit cache scope/lifetime. Do not broaden request-ID scope or alter CRUD duplicate semantics without a documented contract decision.

## Workflow #745–#748 — Replay concurrency and retryability — 2026-10-14

- Full Pytest #745 PASS: concurrent identical cached requests execute the side effect once, and conflicting payloads sharing a request ID yield one accepted operation and one `ADP-006` rejection. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38490506418.
- Full Pytest #746 PASS: `SAVE_AS_DATASET` does not cache a rejected response as a successful replay result; the same request ID and payload can retry successfully. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38492024542.
- Documentation workflow #747 PASS and records the concurrency/retry gate: https://github.com/yay460-jpg/portofolio/actions/runs/38492092421.
- Added a focused `RESTORE` rejected-attempt retry test. It injects a rejected first result followed by a successful result for the identical request. Full Pytest #748 is pending; do not mark this gate PASS before CI completes: https://github.com/yay460-jpg/portofolio/actions/runs/38492451181.
- Local user validation after pulling commit `b11dd569`: `python -m pytest -q` reported `657 passed in 60.20s`. This validates the pulled tree at that commit; it does not include the newer #748 test commit.
- Current scope remains unchanged: no production replay policy changes. Next, verify #748 and continue failure/retry coverage for selected cached operations, then reconcile operation contract matrix and roadmap. Global-vs-family request-ID scope remains an explicit open decision; `main` remains locked.


## Workflow #748–#751 — Restore and dataset-load retryability — 2026-10-14

- Full Pytest #748 PASS: a rejected `RESTORE` attempt is not cached as a successful result; retrying the identical request ID and payload invokes the operation again. Evidence: https://github.com/yay460-jpg/portofolio/actions/runs/38492451181.
- Documentation workflows #749 and #750 PASS, synchronizing the roadmap and RuntimeAdapter contract matrix: https://github.com/yay460-jpg/portofolio/actions/runs/38492477097 and https://github.com/yay460-jpg/portofolio/actions/runs/38492484773.
- Added an isolated `LOAD_DATASET` retry test for a rejected first response followed by a successful retry with the same request ID and dataset name. Full Pytest #751 PASS: the rejected `LOAD_DATASET` attempt is not cached as success; retrying with the same request ID and dataset name succeeds. https://github.com/yay460-jpg/portofolio/actions/runs/38492967531.
- Replay retry gates confirmed by CI include `SAVE_AS_DATASET` (#746), `RESTORE` (#748), and `LOAD_DATASET` (#751). Documentation workflows #752–#754 all PASS and the roadmap/matrix CI references are synchronized. No production replay policy was changed.
- Open decision remains: request-ID scope across adapter-cached operations, CRUD, and uncached observational operations. Do not change semantics until the public contract and compatibility requirements are explicitly resolved; `main` remains locked.


## Workflow #751–next gate — Dataset-load PASS and KPI-finalize retry — 2026-10-14

- Full Pytest #751 PASS: rejected `LOAD_DATASET` response is not cached as a successful replay result; the same request ID and dataset name can retry. https://github.com/yay460-jpg/portofolio/actions/runs/38492967531.
- Documentation workflows #752, #753, and #754 PASS. #754 corrects the CI reference; all three completed successfully.
- Full Pytest #755 PASS: the rejected `FINALIZE_KPI` response is not cached as success; the identical request ID and payload can retry. https://github.com/yay460-jpg/portofolio/actions/runs/38496213644.
- Next: verify the KPI retry CI, then assess remaining cached-operation retry cases and document coverage. Request-ID namespace/lifecycle remains an open contract decision; no production behavior change and `main` remains locked.


## Workflow #755–next gate — KPI retry PASS and dataset-save retry — 2026-10-14

- Full Pytest #755 PASS: rejected `FINALIZE_KPI` attempts are not cached as successful replay results; retrying the identical request ID and payload dispatches the operation again. https://github.com/yay460-jpg/portofolio/actions/runs/38496213644.
- Documentation workflows #756 and #757 PASS; the roadmap and operation contract matrix are synchronized. https://github.com/yay460-jpg/portofolio/actions/runs/38496231704 and https://github.com/yay460-jpg/portofolio/actions/runs/38496239546.
- Added a focused `SAVE_DATASET` retry test for a rejected first response followed by a successful retry using the same request ID and dataset name. CI is pending; do not mark the gate PASS until the workflow concludes.
- Retryability is now CI-confirmed for `SAVE_AS_DATASET` (#746), `RESTORE` (#748), `LOAD_DATASET` (#751), and `FINALIZE_KPI` (#755), in addition to existing `IMPORT_XLSX` and backup retry coverage. No production replay semantics changed.
- Next gate: verify `SAVE_DATASET`, then review the operation matrix for remaining retry gaps. Global-vs-family request-ID scope and cache lifecycle remain open decisions; `main` stays locked.


## Workflow #758–next gate — Dataset-save retry PASS and replay-scope audit — 2026-10-14

- Full Pytest #758 PASS: a rejected `SAVE_DATASET` response is not cached as a successful replay result; retrying the identical request ID and dataset name dispatches the operation again. https://github.com/yay460-jpg/portofolio/actions/runs/38496637615.
- Documentation workflows #759 and #760 PASS; the roadmap and RuntimeAdapter operation contract matrix are synchronized. https://github.com/yay460-jpg/portofolio/actions/runs/38496661461 and https://github.com/yay460-jpg/portofolio/actions/runs/38496670924.
- Audit of the current adapter-cached operation set found retry coverage for import, restore, dataset save/save-as/load, KPI finalize, and topography/marker backup save/load. Observational list/read operations remain uncached by contract; CRUD retains its separate application-level duplicate-request contract.
- Retryability gate is closed for the reviewed cached operation set. No production replay behavior changed.
- Next gate: resolve and document request-ID namespace/lifecycle across adapter-cached operations, CRUD, and observational reads; inspect cache lifetime/eviction and compatibility implications before proposing implementation. Do not change semantics until the public contract is agreed. `main` remains locked.


## Workflow #761–next gate — Replay-cache lifecycle findings — 2026-10-14

- Documentation workflows #761 and #762 PASS; the roadmap and RuntimeAdapter operation contract matrix are synchronized. https://github.com/yay460-jpg/portofolio/actions/runs/38496950642 and https://github.com/yay460-jpg/portofolio/actions/runs/38496961799.
- Source audit confirms `RuntimeAdapter._request_results` is an in-memory dictionary owned by one adapter instance. There is no TTL, capacity bound, eviction, or persistence; entries disappear when the adapter instance/process is replaced. This is process-local replay protection, not durable idempotency.
- A single adapter `RLock` currently encloses lookup, dispatch, and cache write for all cached operations. This prevents duplicate concurrent dispatch for identical cached requests, but also serializes unrelated cached requests. Existing #745 tests cover identical concurrent requests and conflicting payloads; no lock redesign is proposed in this gate.
- Cached operations are `IMPORT_XLSX`, `RESTORE`, dataset save/save-as/load, topography/marker backup save/load, and `FINALIZE_KPI`. CRUD delegates duplicate detection to `ApplicationService`; BACKUP and LIST/READ observational operations bypass the adapter cache by contract.
- Existing characterization proves adapter-cache IDs and CRUD IDs are currently separate namespaces. This behavior is documented, but whether the public contract should be global or family-scoped remains OPEN; do not silently change it.
- Decision options for the contract review: (A) explicitly retain separate namespaces and document per-family guarantees; (B) introduce a unified request ledger with defined collision behavior across CRUD and cached operations. Either choice must specify retry semantics, response compatibility, lifetime/eviction, restart behavior, concurrency, and ownership. TTL/capacity/durable storage are out of scope until retention requirements are approved.
- Next gate: contract review of options A/B and consumer compatibility, then isolated tests for the chosen contract. No production code changed; `main` remains locked.
