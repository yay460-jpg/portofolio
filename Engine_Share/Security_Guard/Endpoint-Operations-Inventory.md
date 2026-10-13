# Security Evolution 2 — Endpoint & Operation Inventory

## Audit status

Source inventory performed against the locked V41 source baseline `698469057aa588de2c3d17a1327ef4892863994d`. This document records observed routing and controls; suspected gaps remain hypotheses until reproduced by isolated tests.

Primary source owners:

- `lithosite-Mine-Services/desktop-host/server.py` — HTTP transport, static resources, Evidence file endpoints, PDF generation, and RuntimeAdapter invocation.
- `lithosite-Mine-Services/src/mine_services/adapter.py` — 19 supported runtime operation names and operation dispatch.
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

### Origin policy as implemented

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
| Generic static-file fallback | URL path | Decodes path, resolves under `STATIC_ROOT`, denies paths containing a `Database` segment and extensions `.xlsx`, `.xls`, `.csv` | Verify whether serving the repository root exposes unintended source/config/metadata paths (including hidden paths); constrain only with an explicit asset allowlist and compatibility tests |

### POST

| Path | Inputs / current bound | Observed controls | Next test |
|---|---|---|---|
| `/runtime` | JSON object; Content-Length must be 1..180,000,000 bytes | Origin rejection for present unaccepted origins; catches malformed request; dispatches via RuntimeAdapter; applies Evidence lifecycle after committed operations; generic host error for unexpected exception | Boundary sizes, content-type, malformed/partial body, all operation envelopes, internal-error sanitization, request correlation and repeated operations |
| `/evidence/upload` | Query module/record_id/filename; body 1..100,000,000 bytes | Allowlisted module; constrained path/name and extension; verifies owning record through adapter; exclusive-create prevents overwrite; cleans partial file after write error | MIME/content inspection policy, content-length/body edge cases, link/race cases, duplicates, rejected owner record |
| `/evidence/preview` | JSON object; body 1..8,192 bytes | Allowlisted Evidence path; allowed preview extensions PDF/JPEG/PNG; containment and 100,000,000-byte file limit | Schema strictness, encoded traversal, content mismatch and response headers |
| `/report-pdf` | JSON body 1..10,000,000 bytes | Size check, JSON decoding, PDF builder and error response | Non-object/extreme nested values, content-type, error sanitization and CPU/memory bounds |

Unsupported methods rely on the standard `BaseHTTPRequestHandler` behavior; explicitly verify the resulting response does not expose details or create unintended behavior.

## RuntimeAdapter operation inventory

`RuntimeAdapter.OPERATIONS` currently lists 19 operations:

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
- `map-security.js` has an exported global namespace plus a trailing compatibility function block. Determine whether every export/call-site is exercised by tests before moving or simplifying it.
- The two `shared/geo-engine.js` paths have the same Git blob in this baseline (same bytes); no Geo engine consolidation is needed for Evo 2's initial guard work.
- The two `shared/topo3d/topo3d-engine.js` files have different Git blobs and are not interchangeable by assumption. Compare callers and differences before any shared-engine move.
- Both Topo3D copies define DTM and STR limits of 64 MiB each, package limit 128 MiB, vertex limit 300,000, and triangle limit 600,000. DTM+STR parsing checks file sizes and record counts. The LTDtm v1/v2 loader calls `file.arrayBuffer()` before checking the package's byte limit; this is a high-priority test hypothesis for memory pressure, not yet a confirmed exploit.

## EVO2-02 remaining work

- [x] Record the host's HTTP routes and per-route high-level controls.
- [x] Enumerate all 19 RuntimeAdapter operation names.
- [x] Record existing host/Evidence test coverage by test function name.
- [x] Record Browser Guard script order and its presently observed call-sites.
- [ ] Trace each adapter operation to downstream path/domain validation and rollback/audit behavior.
- [ ] Trace static-file access against the local repository tree and define the intended static allowlist.
- [ ] Finish Topo3D loader path/caller comparison and create isolated resource-boundary tests.
- [ ] Finish Geo input caller inventory and range/finite-value contract.
- [ ] Promote only reproduced gaps to confirmed findings.
