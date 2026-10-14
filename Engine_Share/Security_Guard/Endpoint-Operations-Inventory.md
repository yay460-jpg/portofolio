# Security Evolution 2 — Endpoint & Operation Inventory

## Audit status

Source inventory performed against the locked V41 source baseline `698469057aa588de2c3d17a1327ef4892863994d`. This document records observed routing and controls; suspected gaps remain hypotheses until reproduced by isolated tests.

Primary source owners:

- `lithosite-Mine-Services/desktop-host/server.py` — HTTP transport, static resources, Evidence file endpoints, PDF generation, and RuntimeAdapter invocation.
- `lithosite-Mine-Services/src/mine_services/adapter.py` — 20 supported runtime operation names and operation dispatch.
- `lithosite-Mine-Services/src/mine_services/validation.py` and service/store/transaction layers — domain validation and authoritative data mutation.
- `lithosite-Mine-Geologist/member-app/scripts/map/map-security.js` — browser package/tile/image security helper.
- `lithosite-Mine-Geologist/shared/topo3d/topo3d-engine.js` and `lithosite-Mine-Services/shared/topo3d/topo3d-engine.js` — Topo3D import parsing and resource limits.
- `lithosite-Mine-Geologist/shared/geo-engine.js` and `lithosite-Mine-Services/shared/geo-engine.js` — geospatial calculations.

## Desktop Host network boundary

Observed server configuration:

- Bind address: `127.0.0.1`.
- Default port: `8765`, overridable with `MINE_SERVICES_PORT`.
- Database path: `MINE_SERVICES_DB` or the module's A3 workbook default.
- Active schema environment is restricted to `A3`.
- No authentication/authorization middleware was found in the inspected `Handler`; this is a local-host design fact to include in the threat model, not by itself a confirmed vulnerability.
- Core writes are routed through `RuntimeAdapter`; UI is not given a direct persistence object.

### Origin policy at the locked V41 baseline

`is_allowed_origin()` accepts:

1. four explicitly listed HTTP loopback origins on ports 5500 and 5501;
2. missing Origin and the literal `null` Origin;
3. any HTTP Origin whose host is `localhost` or `127.0.0.1`, regardless of port.

Most data endpoints explicitly return 403 when a present Origin is not accepted; `/health`, root redirect, user-guide, and generic static-file paths do not use the same explicit reject branch. The shared CORS helper only emits `Access-Control-Allow-Origin` for accepted origins. OPTIONS replies with the configured method/header list.

**Test question, not a finding:** which local origins must be supported by the official launcher and development workflow, and can an untrusted local browser origin read or invoke any sensitive response? Do not tighten this policy until allowed-origin compatibility is specified and tested.

## HTTP endpoint inventory

### OPTIONS

| Path | Behavior | Owner / control |
|---|---|---|
| Any path handled by `do_OPTIONS` | Returns the common 204/preflight headers | Host handler; `_headers()`, `is_allowed_origin()` |

### GET

| Path | Inputs | Observed controls | Next test |
|---|---|---|---|
| `/health` | None | Reports READY/offline/schema/runtime and the resolved local database path | Verify which fields should be visible to the browser/caller; preserve existing health contract unless decision changes |
| `/` | None | Redirects to configured `STATIC_ENTRY` | Verify redirect target comes from trusted configuration |
| `/user-guide`, `/lithosite-Mine-Services/user-guide` | Query `file` | Resolves under the guide root, checks containment, and requires a PDF file | Traversal/encoded-path and error-response cases |
| `/evidence/status` | Query `module` | Allowlisted modules; filters unsafe linked paths and supported direct-child files | Encoded IDs, junction/symlink edge cases, and error leakage |
| `/evidence/list` | Query `module`, `record_id` | Allowlisted module and constrained record ID; skips unsupported/symlinked items; reports file metadata | Path boundary, unusual names, size/header behavior |
| `/evidence/file` | Query `module`, `record_id`, `filename` | Filename/path checks, resolved containment check, extension allowlist, 100,000,000-byte limit, `no-store`, `nosniff`, Content-Disposition | Encoded traversal, Windows path cases, race/symlink cases, MIME/disposition and errors |
| Generic static-file fallback | URL path | Decodes and resolves under `STATIC_ROOT`; allows only `assets/`, `lithosite-Mine-Geologist/assets/`, `lithosite-Mine-Services/Artifacts/`, `ui/`, and `shared/`; rejects dot-prefixed path segments; retains `Database`/XLSX/XLS/CSV defense-in-depth | Existing positive/negative endpoint tests confirm listed UI roots work and `.gitignore`, `.github` workflow, backend source, documentation and test paths return 404 (Full Pytest #611) |

### POST

| Path | Inputs / current bound | Observed controls | Next test |
|---|---|---|---|
| `/runtime` | JSON object; Content-Length must be 1..180,000,000 bytes | Origin rejection for present unaccepted origins; catches malformed request; dispatches via RuntimeAdapter; applies Evidence lifecycle after committed operations; generic host error for unexpected exception | Boundary sizes, content-type, malformed/partial body, all operation envelopes, internal-error sanitization, request correlation and repeated operations |
| `/evidence/upload` | Query module/record_id/filename; body 1..100,000,000 bytes | Allowlisted module; constrained path/name and extension; verifies owning record through adapter; exclusive-create prevents overwrite; cleans partial file after write error | MIME/content inspection policy, content-length/body edge cases, link/race cases, duplicates, rejected owner record |
| `/evidence/preview` | JSON object; body 1..8,192 bytes | Allowlisted Evidence path; allowed preview extensions PDF/JPEG/PNG; containment and 100,000,000-byte file limit | Schema strictness, encoded traversal, content mismatch and response headers |
| `/report-pdf` | JSON body 1..10,000,000 bytes | Size check, JSON decoding, PDF builder; `HOST-008` now uses a generic `Invalid report request` message rather than reflecting exception text (commit `b5c264c`, validation pending) | Regression tests cover non-object and malformed JSON (latest test commit `799deb4`); verify CI, nested/extreme values, content-type, CPU/memory bounds and generic error response |

Runtime host tests now send `Content-Length` values `0`, `-1`, `180000001`, and a non-numeric value without a body; each is rejected with HTTP 400 / `HOST-003` before any body read. An encoded `../../../../../secret.pdf` user-guide path is rejected with HTTP 400 / `HOST-007` and does not disclose the filename. Full Pytest #38502237840 passed. Remaining host tests should cover Evidence endpoint error boundaries, report-PDF malformed shapes/error sanitization, and encoded/symlink/static edge cases.

Unsupported methods rely on the standard `BaseHTTPRequestHandler` behavior; explicitly verify the resulting response does not expose details or create unintended behavior.

## RuntimeAdapter operation inventory

`RuntimeAdapter.OPERATIONS` currently lists 20 operations:

| Operation | Route class | Ownership/security questions |
|---|---|---|
| `CREATE` | Domain mutation | Required row/entity, system fields, primary keys, references, transaction/audit |
| `UPDATE` | Domain mutation | Patch allowlist, immutable/system fields, transaction/audit |
| `DELETE` | Domain mutation | Entity/ID validation, cascade/evidence lifecycle, audit and rollback |
| `READ` | Data query | Entity allowlist and response exposure |
| `IMPORT_XLSX` | File/import | Allowed path, untrusted workbook parser, validation and atomic commit |
| `BACKUP` | Snapshot/export | Allowed source and disclosure/integrity of output |
| `RESTORE` | Data replacement/import | Snapshot validation, mode, checksum/integrity and atomicity |
| `LIST_DATASETS` | Dataset listing | Metadata/file exposure |
| `SAVE_DATASET` | Dataset operation | Name and destination validation |
| `SAVE_AS_DATASET` | Dataset operation | Name/path containment and overwrite policy |
| `LOAD_DATASET` | Dataset load | Name/path containment and replacement safety |
| `SAVE_TOPOGRAPHY_BACKUP` | Topo3D backup | Base64/payload limits, filename/path, integrity |
| `LIST_TOPOGRAPHY_BACKUPS` | Topo3D backup | Listing and metadata exposure |
| `LOAD_TOPOGRAPHY_BACKUP` | Topo3D backup | Name/path containment, package validation |
| `SAVE_MARKER_LOCATION_BACKUP` | Geo/marker backup | Payload/path and schema validation |
| `LIST_MARKER_LOCATION_BACKUPS` | Geo/marker backup | Listing and metadata exposure |
| `LOAD_MARKER_LOCATION_BACKUP` | Geo/marker backup | Name/path containment and validation |
| `FINALIZE_KPI` | KPI state operation | Snapshot shape, provenance and duplicate/replay behavior |
| `READ_KPI_SNAPSHOTS` | Data query | Scope/period filters and response exposure |

This table is a test-ownership map, not a statement that every behavior is vulnerable. Each operation-specific requirement and its downstream implementation still needs source/test tracing before EVO2-02 can close.

## Existing test evidence found

At baseline source:

- `tests/test_desktop_host.py` covers health, runtime routing, a disallowed Origin, Evidence listing/file handling, invalid module/path/filename, and a disallowed Origin for an Evidence endpoint.
- `tests/test_evidence_endpoint.py` covers upload acceptance/rejection, record-scoped Evidence lifecycle, status/listing, preview and file endpoint cases.
- Full Pytest passed for the documentation-only Evo 2 scaffold commit `7d13d2046467621a2cb942e2faae103e4d9025b3` (run #605).
- These tests are baseline coverage, not proof that the new adversarial cases above are covered.

## Browser / Geo / Topo3D ownership observations

- Member `index.html` loads `map-security.js` before `map-package-transfer.js`; `map-package-transfer.js` calls `MG1LithositeSecurity.validatePayload()`, and `peta.js` calls `isSafeImageDataUrl()` before using a loaded map image payload. Audit the exact import and rendering paths before refactoring.
- `map-security.js` initially had a trailing compatibility function block that attempted to extend a frozen `MG1LithositeSecurity` object; Node runtime test reproduced the load-time TypeError. The function now lives inside the immutable namespace and calls `isSafeImageDataUrl_` / `isSafeTileKey_` directly. `map-package-transfer.js` calls `validatePayload`; the compatibility `validateImportPackage` export had no active call site in the scanned sources, so consumer and browser Console verification remain open.
- The two `shared/geo-engine.js` paths have the same Git blob in this baseline (same bytes); no Geo engine consolidation is needed for Evo 2's initial guard work.
- The two `shared/topo3d/topo3d-engine.js` files have different Git blobs and are not interchangeable by assumption. Compare callers and differences before any shared-engine move.
- Both Topo3D copies define DTM and STR limits of 64 MiB each, package limit 128 MiB, vertex limit 300,000, and triangle limit 600,000. DTM+STR parsing checks file sizes and record counts. The LTDtm v1/v2 loader calls `file.arrayBuffer()` before checking the package's byte limit; this is a high-priority test hypothesis for memory pressure, not yet a confirmed exploit.

## Downstream owner trace — first pass

### Import XLSX

The UI's Data Management flow reads a value from the `stage15ImportPath` text field and sends `{operation: "IMPORT_XLSX", path: path}` to `/runtime`. `RuntimeAdapter` requires a non-empty path and calls `RuntimeInterface.import_xlsx(path)`; `ImportCoordinator.read_xlsx()` calls `openpyxl.load_workbook(path, data_only=True)`, then validates required/unexpected sheets, schema version, and column headers. `import_dataset()` stages data, validates rows, and uses `TransactionManager` for commit/rollback.

In the inspected import layer, no explicit file-size limit or path-root allowlist was observed before `load_workbook()`. That may be intentional because the current UI accepts an explicit local path, so a policy change must not break the supported import workflow. Test hypotheses:

- Can an invalid/oversized file cause excessive resource use or return local OS path details in the import error?
- What exact file-location policy is required for a local single-user host?
- Can a browser-origin request invoke import with a path the user did not intentionally select? Test only with a temporary fixture and a benign workbook.

### Restore and dataset operations

- `SnapshotManager.verify()` checks required fields, schema version, SHA-256 checksum algorithm/value, status and entity counts; restore validates payload/domain rows and uses `TransactionManager` with rollback on failure.
- `DatasetManager._safe_name()` normalizes dataset names; `_validate_document()` checks format/schema/metadata/payload, primary-key consistency, and domain validation before load. Dataset save/load operations are followed by audit writes in `RuntimeInterface`.
- `PersistenceStore` opens the configured workbook, validates its contract on load/save, and saves through a temporary workbook path before replacing its active file.
- These observed controls reduce certain risk classes but do not replace tests for traversal, malformed data, oversized inputs, atomic rollback, and error disclosure.

### Backup domains

- Topography backups use base64 decoding with strict validation, a 128 MiB package bound, `LITHODTM` magic and supported-version checks, sanitized filename stems, containment on reads, and a five-backup retention limit. On current Evo 2 workspace code, encoded-size preflight runs before Base64 decoding, and file reads reject by `stat` plus bounded `read(limit + 1)` before materializing a full package.
- Marker backups use strict base64, a 16 MiB package bound, `LT-MARKER` magic/version, JSON shape and marker validation including finite coordinate values, sanitized filename stems, containment on reads, and a five-backup retention limit. Encoded-size preflight and bounded file reads are now tested in the same way as Topography backups.
- The host `/runtime` envelope currently accepts declared JSON bodies up to 180,000,000 bytes. Per-operation payload limits should be harmonized against the smaller owning service limits before any host-level limit is changed.

### Static asset boundary

The static fallback still uses the repository as its resolution root, but access now requires one of the explicit runtime asset roots: `assets/`, `lithosite-Mine-Geologist/assets/`, or `lithosite-Mine-Services/Artifacts/`, `ui/`, `shared/`. Dot-prefixed segments are rejected, and existing Database/XLSX/XLS/CSV denials remain. The principal Operations HTML contains 89 local `src`/`href` references; the references inspected resolve into these permitted roots. Endpoint tests confirm common HTML/JS/SVG/image paths serve successfully and `.gitignore`, `.github/workflows/mine-services-pytest.yml`, backend Python source, documentation, and test files are denied. Future dynamic asset roots must be reviewed and added only alongside regression coverage.

### Geo and Topo3D differences

- The Geo Engine files in Mine Geologist and Mine Services have the same Git blob in the inspected baseline; their bytes are identical, but caller and load-order contracts still need documenting.
- The two Topo3D Engine copies have different Git blobs. Their current limit constants include 64 MiB DTM, 64 MiB STR, 128 MiB package, 300,000 vertices and 600,000 triangles.
- `loadDTMSTR()` checks file sizes before parsing and checks vertex/triangle counts during parsing. `loadLTDtm()` checks `file.size` against the 128 MiB package ceiling before `file.arrayBuffer()` in the current workspace source. Keep a regression test for this order and test malformed package/count boundaries. No Topo3D changes are authorized from this observation alone.

## EVO2-02 remaining work

- [x] Record the host's HTTP routes and per-route high-level controls.
- [x] Enumerate all 20 RuntimeAdapter operation names.
- [x] Record existing host/Evidence test coverage by test function name.
- [x] Record Browser Guard script order and its presently observed call-sites.
- [ ] Complete per-operation trace for CREATE/UPDATE/DELETE/READ and KPI operations; first-pass import/restore/dataset/backup trace recorded above.
- [x] Define the initial static asset allowlist and test positive/negative endpoint paths; Full Pytest #611 PASS.
- [ ] Review future dynamic asset paths before extending the allowlist.
- [x] Compare the two Topo3D source blobs and confirm four import/export loader methods are identical.
- [x] Add source-order regression test for package-size preflight in both copies; Full Pytest #609 PASS.
- [ ] Complete browser/WebGL runtime tests for malformed/truncated package input, allocation behavior and cleanup.
- [ ] Finish Geo input caller inventory and range/finite-value contract.
- [ ] Promote only reproduced gaps to confirmed findings.


## Current Evo 2 Host Guard change

On the active `v41-workspace`, `Engine_Share/Security_Guard/Host_Guard/security_guard.py` now owns the Origin policy. It permits the configured host origin (default `127.0.0.1:8765` and `localhost:8765`) plus the documented development origins on ports `5500` and `5501`. The literal `null` origin, empty Origin, arbitrary localhost ports, non-loopback hosts and HTTPS variants are rejected on routes that enforce Origin checks. Missing Origin remains allowed for non-browser local clients. Unit and host endpoint regression tests cover accepted origins and rejection of external/`null`/unlisted loopback origins.

This is a narrow hardening change, not authentication. A process already executing as the same local user remains outside the protection provided by browser CORS policy. The host still binds only to loopback; no LAN exposure was added.


## Post-baseline Evo 2 finding — restore schema boundary

### Locked-source reproduction

An isolated in-memory test against the locked source baseline created a snapshot from the known schema, inserted an extra key under `payload.data`, and recomputed the SHA-256 checksum. `RESTORE` returned `COMMITTED` even though the extra entity was not part of the A.3 schema. Full Pytest #615 recorded the expected red reproduction (584 passed, one focused failure): https://github.com/yay460-jpg/portofolio/actions/runs/38421789115.

This is a confirmed schema-boundary gap in the locked source behavior, not a claim of remote code execution. The checksum proves payload consistency only; it does not replace strict schema allowlisting.

### Workspace fix and regression evidence

- `SnapshotManager.verify()` now rejects unexpected keys in `payload.data` before restore validation/transaction.
- `DatasetManager._validate_document()` now rejects unexpected entity keys before loading/replacing runtime state.
- `tests/test_security_snapshot_restore.py` tests both flows using `PersistenceStore()` in memory and a dataset file under pytest `tmp_path`; it does not use the operational workbook.
- Full Pytest #616 passes 586 tests on workspace commit `9c8508a17c5c30558beeac9e8cdceec67df3016f`: https://github.com/yay460-jpg/portofolio/actions/runs/38422299996.

### Remaining scope

This closes only the unexpected-entity-key path. Other restore/dataset requirements (strict row fields, controlled-list trust semantics, path policies, malformed/oversized payloads, audit/rollback cases) remain under inventory/test design. `main` remains unchanged; no operational A3 workbook was used or changed.


## Post-baseline Evo 2 finding — backup size preflight

### Reproduction

Focused tests lowered each backup manager's maximum to 32 bytes and used small temporary files/encoded strings, so the tests did not allocate 16 MiB or 128 MiB payloads. The test-only run #618 reproduced all four late-check paths: `TopographyBackupManager.read/save` and `MarkerLocationBackupManager.read/save` performed a full file read or Base64 decode before rejecting the configured size (586 passed, four focused failures): https://github.com/yay460-jpg/portofolio/actions/runs/38423367223.

### Workspace fix and validation

- Both backup managers now reject oversized encoded Base64 input before calling `base64.b64decode`.
- Both read paths check `stat().st_size` before opening the file and then read at most `MAX_PACKAGE_BYTES + 1`; this preserves a defense if the file changes between stat and read.
- An intermediate implementation run #619 exposed a call-site error (`cls` used inside the Topography instance method); it was corrected in commit `0a8371d38d08ea7eae399a57d048e4ad6ca9ab86`.
- Full Pytest #620 passed 590 tests: https://github.com/yay460-jpg/portofolio/actions/runs/38424109031.
- All tests use pytest temporary directories and lowered test-only limits. They do not use the operational A3 workbook or user Evidence directories.

### Remaining scope

These checks close only size preflight/bounded-read behavior for these two backup managers. Package structure validation, concurrent file replacement, complete adapter-level request memory limits, and other input surfaces remain in EVO2-02/EVO2-03 scope.


## EVO2 READ exposure boundary — 2026-10-14

- `POST /runtime` dispatches READ through the RuntimeAdapter. The host rejects a present Origin outside the allowlist; existing host tests exercise a disallowed-origin READ and expect HTTP 403. Missing Origin is intentionally allowed for local non-browser clients, so Origin validation is not authentication.
- The adapter/runtime read surface returns full domain rows, all AuditLog events, and controlled-list values. Existing isolation tests verify that mutating detached results does not mutate stored state; they do not restrict which callers may read them.
- Operations UI source confirms the need for `Operations`, `Checker`, `WorkFront`, `Equipment`, `_Lists`, `GlobalCapacity`, and `Maintenance`. AuditLog was not observed in that module; the full UI call-site inventory is still open.
- No guard restriction was applied. Next: complete cross-module caller inventory and agree the public READ entity/field contract, then write focused regression tests. Treat this as a local trust-boundary/design question until a reproducible unauthorized path is demonstrated.


### READ exposure boundary — compatibility gate result — 2026-10-14

The previous note above that the full UI call-site inventory remained open is superseded for the inspected in-repository public callers by the follow-up inventory and regression gate. Full Pytest #690 and #691 completed successfully; documentation workflows #688, #689, and #692 also completed successfully. The public adapter permits the ten schema domain entities plus `_Lists`, rejects generic `AuditLog` and unknown targets with `ADP-007`, and has passing caller-compatibility regression coverage for Marker Location's dynamic source entity set and Desktop Evidence owner mapping. Within `src/mine_services`, generic `RuntimeInterface.read()` dispatch is through `RuntimeAdapter`; direct `RuntimeInterface.read("AuditLog")` usages found are internal tests. This closes the inspected in-repository public READ caller-compatibility gate, not external integration assurance or authorization of arbitrary Python callers. EVO2-02 remains in progress; the next operation inventory covers mutation/KPI side effects, audit, replay, and rollback contracts. 



## EVO2-02 — consumer and domain-owner inventory completion pass (2026-10-14)

### Browser Map Security Guard — source and call-site map

- Script order in `lithosite-Mine-Geologist/member-app/index.html`: shared `geo-engine.js`, shared `topo3d-engine.js`, then `scripts/map/map-security.js`; the map tile store and map UI scripts load after the security helper, `scripts/peta.js` loads before `map-package-transfer.js`. This order makes the security namespace available before inspected consumers execute.
- Confirmed call sites in the workspace:
  - `scripts/map/map-package-transfer.js:82` — `MG1LithositeSecurity.validatePayload(entry)` before map package export/import processing.
  - `scripts/map/map-tile-store.js:32` — `isSafeImageDataUrl` before retaining a persisted tile data URL.
  - `scripts/map/map-ui.js:127-129` — image data URL validation before preview.
  - `scripts/map/map-management-compat.js:1031` — image data URL validation before compatibility preview.
  - `scripts/peta.js:2811` — image data URL validation before embedding a map image into generated SVG.
- `map-security.js` exports `isSafeImageDataUrl`, `isSafeTileKey`, `validateTile`, and `validatePayload` on a frozen `MG1LithositeSecurity` object. It then declares a second `validateImportPackage` compatibility block and calls `Object.assign` against that already frozen object at the end of the file. Static source inspection indicates this attempted extension can throw a `TypeError`; no shipped call site for `validateImportPackage` was found in the scanned member-app scripts. Treat this as a high-priority runtime reproduction/console test for EVO2-03/EVO2-05, not as a claimed CI-confirmed exploit or as permission to patch out of sequence.
- The exported `validatePayload` currently bounds image URL size, tile key syntax, tile coordinates/dimensions, pyramid level count, factor/dimensions, and tile count. It does not itself verify a package's cryptographic integrity; `map-package-transfer.js` separately checks package format/schema/timestamp/integrity and calls the payload validator. These are layered responsibilities, not interchangeable checks.

### Geo Engine — callers, inputs, and boundary ownership

- The shared engine source is `lithosite-Mine-Geologist/shared/geo-engine.js` (workspace blob `bd17331317ba6f5aa2dd5ae9136acea053f39b03`). It defines `inverseUtm_`, `gridConvergence_`, `computeConvergenceForPoint_`, and `bearingDistanceGrid_`; no second shared Geo engine copy was found in the workspace tree.
- Inspected caller files: `lithosite-Mine-Geologist/member-app/scripts/peta.js` calls `computeConvergenceForPoint_` at line 3116 and `bearingDistanceGrid_` plus convergence at lines 3179–3182. The parallel `lithosite-Mine-Geologist/scripts/peta.js` contains corresponding calls at lines 2875 and 2938–2941, but the root `index.html` currently loads its main/module scripts rather than this `scripts/peta.js` file; do not count it as a verified active page path without a runtime load trace. The member-app index explicitly loads the shared engine and member `peta.js`.
- Red-phase Node tests confirmed `computeConvergenceForPoint_` could report `ok: true` for NaN/Infinity, invalid/fractional UTM zones, invalid hemisphere and out-of-range Easting. Both Geo Engine copies now reject non-finite inputs, unsupported zones/hemispheres, conservative coordinate bounds, and non-finite/implausible outputs before reporting success. The valid site control point remains accepted; Full Pytest #38501182094 passed. Bearing-distance input validation remains a separate open test target.
- Ownership decision: CRS/numeric/spatial invariants belong to the Geo Engine; UI coordinate parsing and CRS configuration belong to the calling app. EVO2-03 should test finite inputs, supported UTM zone/hemisphere, plausible coordinate ranges, and zero/negative/huge deltas without changing valid site behavior.

### Topo3D — loaded surfaces, owners, and known differences

- `member-app/index.html:36` loads `../shared/topo3d/topo3d-engine.js`. A scan of the shipped member-app script files and both peta files found no direct call to `LithositeTopo3D.create`, `Topo3DEngine`, `loadDTMSTR`, or `loadLTDtm`; the engine is loaded but a shipped invocation path was not established in the scanned files. Confirm whether the UI uses another indirect entry point before declaring a dead-code or coverage conclusion.
- Both engine copies expose `window.LithositeTopo3D.create(options)` and implement the same `loadDTMSTR`, `loadLTDtm`, size preflight and count checks. The Geologist copy and Mine Services copy are **not byte-identical**: the Services copy has a render callback/top-view state and a `clear()` method that are absent/different in the Geologist copy. Do not consolidate or overwrite either copy as a cleanup.
- Resource limits in both copies: DTM 64 MiB, STR 64 MiB, package 128 MiB, 300,000 vertices, and 600,000 triangles. `loadDTMSTR` checks file sizes before reading text; `loadLTDtm` checks package size before allocating its ArrayBuffer. Node runtime tests exposed/fixed the v1 parser's undeclared `icount` assignment and verify that out-of-range triangle indices are rejected before GPU build while valid v1 fixtures are accepted. V2 runtime tests verify truncation rejection and valid package flow. Both copies pass the latest Full Pytest #38502385771 (676 passed). Version-2 manifest semantics, broader malformed versions, and count/resource boundaries remain open.
- Ownership decision: each engine copy owns its parser/resource limits; the consumer owns file selection and engine lifecycle. EVO2-03 should add isolated tests for the preflight order, malformed headers/versions, truncated records, invalid references, and vertex/triangle limits. EVO2-05 should verify Browser Guard integration and console cleanliness independently.

### EVO2-02 inventory exit assessment

- The 20 RuntimeAdapter operations are mapped in `RuntimeAdapter-Operation-Contract-Matrix.md`, including side effects, owner, request-ID behavior, retry/error contract, and evidence/remaining limitations.
- HTTP host routes, body/path limits, trust boundaries, and evidence/file ownership are inventoried above.
- Browser Guard, Geo and Topo3D call sites and owner boundaries have now been source-traced; unresolved runtime hypotheses are explicitly handed to EVO2-03/EVO2-05 rather than represented as confirmed vulnerabilities.
- No production change to `main`; all code and documentation changes remain on `v41-workspace`. EVO2-02 inventory criteria are PASS. EVO2-03 now has code-backed Browser Guard/Geo fixes, Topo3D v1 parser/index validation, Topo3D v2 truncation/valid-flow tests, and host path/body boundary tests. Latest combined Full Pytest #38502385771 passed 676 tests. Deeper Host error-boundary tests, broader Geo/Topo3D adversarial cases, and full Browser Guard consumer/Console verification remain open and must not be described as closed.
