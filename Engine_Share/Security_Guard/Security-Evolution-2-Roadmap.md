# Lithosite Security Evolution 2 — Roadmap

## Decision

Evo 2 is the global, cross-product Lithosite security track. Evo 1 remains the historical, version-neutral record of application hardening already implemented. Evo 2 extends common policy and guard ownership without removing existing controls or centralizing domain validation that belongs to a specific runtime/engine.

## Current workspace and safety boundary

- Work branch: `v41-workspace`.
- Locked base before Evo 2 work: `698469057aa588de2c3d17a1327ef4892863994d`.
- Latest validated workspace HEAD: `30ff61b8a693aec691ab03119f6906f171029173` (Full Pytest #623 PASS; workflow conclusion `success`). Earlier evidence #620 (590 passed) remains in the historical record below.
- Current work includes narrow, tested runtime hardening in the owning layers: explicit local Origin policy, static asset allowlist, Topo3D package-size preflight, sanitized unreadable-workbook import errors, strict snapshot/dataset schema keys, and backup size preflight before decode/read. This is not a broad refactor; full coverage remains incomplete.
- Do not change `main` during this track until the owner explicitly promotes a tested and reviewed change.
- Use temporary A3 fixtures and temporary Evidence paths for adversarial tests.
- Never use the operational A3 workbook as a test fixture.
- Keep existing Geo Engine, Topo3D Engine, map-security.js, RuntimeAdapter, and ValidationEngine behavior intact unless a reproduced security gap justifies a minimal patch.

## Checklist

| ID | Stage | Exit criteria | Status |
|---|---|---|---|
| EVO2-01 | Confirm nomenclature and ownership | Evo 1 / Evo 2 definitions and responsibility boundaries documented | PASS — accepted and recorded |
| EVO2-02 | Complete attack-surface inventory | Endpoints, operations, input types, file paths, trust boundaries, owners, and existing controls mapped | IN PROGRESS — host routes and all 19 adapter operations are listed; initial import/restore/dataset/backup trace and static-path behavior are documented. An unexpected-entity-key gap in snapshot restore was reproduced against the locked source and fixed on the workspace; the analogous dataset load boundary is now guarded and regression-tested. Remaining: per-operation downstream validation/atomicity/audit trace, Geo caller/range inventory, full Browser Guard call-site coverage, and broader Topo3D runtime coverage. |
| EVO2-03 | Design isolated adversarial tests | Tests cover each prioritized boundary using temporary database and file fixtures | IN PROGRESS — isolated tests cover Origin allowlist (#608), Topo3D package-size preflight (#609), static asset allowlist (#611), and sanitized unreadable-XLSX import errors (#613). Remaining: deeper path/body boundary cases, malformed Topo3D runtime input, Geo finite/range tests, backup package structure/runtime cases beyond resource preflight, and additional restore/import error-contract cases. |
| EVO2-04 | Implement confirmed guard gaps in their owning layers | Only reproduced gaps patched behind regression tests; Host Guard must not bypass RuntimeAdapter | IN PROGRESS — explicit Origin allowlist, static asset allowlist, Topo3D LTDtm size preflight, unreadable-workbook error sanitization, and strict unknown-entity rejection in snapshot restore/dataset loading, and Topography/Marker Location backup size preflight before base64 decode and bounded file reads are implemented with regression tests. Other host/file/Geo/browser gaps remain open until reproduced. |
| EVO2-05 | Audit Browser Guard integration | Existing map-security.js call-sites, script order, export names, and tests mapped before reuse/refactor | IN PROGRESS — script order, two call-site paths, export shape, and test hypotheses recorded; full export/call-site coverage remains to be verified |
| EVO2-06 | Record Geo and Topo3D responsibilities | Domain rules and resource boundaries mapped; no engine migration yet | IN PROGRESS — Geo blobs identical; Topo3D files differ overall but four loader methods are identical; preflight order fixed/tested; Geo caller/range and broader Topo3D runtime coverage remain |
| EVO2-07 | Full regression and security gate | Targeted adversarial tests, full pytest, UI/static regression, console checks, and documented PASS/HOLD | BLOCKED — requires prior stages |

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
- Validation: **PENDING CI** for commit `40bbb36`; do not mark PASS until Full Pytest succeeds. Existing CRUD replay gate remains PASS at #696. `main` remains locked.
