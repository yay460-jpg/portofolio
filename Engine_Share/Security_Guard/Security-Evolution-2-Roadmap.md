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
