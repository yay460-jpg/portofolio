# Lithosite Security Guard Evo 2 — Attack-Surface Matrix

## Status

Initial inventory of candidate risks. **No row is a confirmed vulnerability until an isolated test reproduces unsafe behavior.** The source-level endpoint and RuntimeAdapter inventory is recorded in [Endpoint & Operation Inventory](Endpoint-Operations-Inventory.md).

## Safe testing boundary

- Use temporary A3 fixtures and temporary Evidence roots.
- Never use the operational A3 workbook as a test fixture.
- Do not test mutation, import, restore, upload, or delete against the operational database or Evidence.
- Record exact request/input, expected response, actual response, affected owner, and regression proof.
- Keep `main` unchanged; Evo 2 work takes place in `v41-workspace` until explicitly promoted.

## Prioritized candidate matrix

| ID | Surface | Candidate risk / hypothesis | Existing control observed | Owning layer | Validation needed | Priority |
|---|---|---|---|---|---|---|
| SG-01 | Origin and loopback caller | At locked baseline, literal `null` and arbitrary localhost ports were accepted by policy | Evo 2 now applies an explicit allowlist: configured host port plus documented `5500/5501` development origins; missing Origin remains for non-browser local clients | Unit and endpoint regression tests reject external, `null`, and unlisted loopback origins; same-user process threat remains out of CORS scope | High — initial patch applied, validate CI |
| SG-02 | `POST /runtime` | Malformed, partial, oversized or wrong-content-type request; error detail leakage | JSON object check, 180,000,000-byte declared-length bound, origin check, RuntimeAdapter envelope checks | Host Guard + RuntimeAdapter | Boundary sizes, invalid JSON/types, required fields, all operations, sanitization | High |
| SG-03 | Import, restore, datasets, backups | Path/name escape, unsafe file package, destructive replacement, replay or non-atomic behavior | Dispatch through RuntimeAdapter and downstream services | RuntimeAdapter / owning service / persistence | Trace each operation; test temp roots, checksum/schema, rollback and audit | High |
| SG-04 | Evidence upload | Crafted filename, unsupported content, oversized/partial body, link/race, duplicate overwrite | Allowlisted module, constrained record/name, extension allowlist, 100 MB limit, owner-record check and exclusive create | Host Guard | MIME/content policy and boundary/path failures via temporary root | High |
| SG-05 | Evidence status/list/preview/file | Path traversal, unintended read, link/junction escape, response metadata/header issues | Allowlist, containment, direct-file checks, file size limits and some security headers | Host Guard / filesystem | Encoded and Windows path cases, links, size bounds and sanitized responses | High |
| SG-06 | Report PDF | Oversized/deep/extreme model uses excessive CPU/memory or errors expose internals | 10 MB declared-length limit and JSON parser | Host Guard / PDF builder | Bound model depth/collections, malformed types, limits and response sanitization | Medium |
| SG-07 | Static-file fallback | Repository-root serving may expose paths that are not intended as browser assets | Explicit allowlist permits `assets/`, `lithosite-Mine-Geologist/assets/`, and `lithosite-Mine-Services/{Artifacts,ui,shared}/`; dot-prefixed path segments are rejected; workbook deny remains as defense-in-depth | Host Guard / static asset ownership | Positive and negative endpoint tests verify core HTML/JS/SVG/image paths remain served and root metadata, backend source, docs and tests return 404; dynamic future assets require allowlist review | Initial allowlist implemented — Full Pytest #611 PASS | High |
| SG-08 | RuntimeAdapter | Unsupported operation, weak operation-specific envelope or response object exposure | Required request ID/operation, operation name allowlist, operation-specific field checks, generic runtime failure envelope | RuntimeAdapter + services | Per-operation contract tests; trace validation, idempotency, audit, transaction and error boundaries | High |
| SG-09 | Geo input | Non-finite/extreme coordinates or invalid CRS parameters reach numeric calculations | Domain calculation functions exist; two source copies currently have identical blobs | Geo Engine | Enumerate all callers and accepted ranges; isolated finite/range tests without altering validated formulas | Medium |
| SG-10 | Topo3D input | Oversized/malformed DTM/STR/package stresses memory or GPU; malformed counts/indices reach allocations | File/count limits exist; both `loadLTDtm` copies now preflight `file.size` against 128 MiB before WebGL preparation and `arrayBuffer`; byte-length validation remains after read | Topo3D owner | Source-order regression test validates both copies; broader malformed-package/browser runtime coverage remains pending | Initial preflight patch validated by Full Pytest #609 | High |
| SG-11 | Map package/import/rendering | Integrity-valid package still contains unsafe or malformed content; helper/call-site drift | Existing `map-security.js`, package contract, validation before import; script order observed | Browser Guard / Map Library | Test the real call chain, compatibility export, safe DOM and reject-before-storage behavior | Medium |
| SG-12 | Logging and resource controls | Local paths/details disclosed or repeated/concurrent requests consume resources | Coded errors and several size caps; request logging exists | Host Guard | Trace errors/logs and concurrent load; set local-host limits based on actual single-user usage | Medium |

## Tracking checklist

- [x] Host HTTP routes and method groups inventoried.
- [x] RuntimeAdapter's 19 named operations inventoried.
- [x] Existing host/Evidence tests identified.
- [x] Browser security script order and observed call-sites identified.
- [ ] Complete per-operation downstream validation/atomicity/audit tracing.
- [x] Implement initial static asset allowlist and isolated positive/negative endpoint tests; Full Pytest #611 PASS. Audit any future new static asset roots before adding them.
- [ ] Complete Geo caller/range inventory.
- [x] Compare both Topo3D source copies and verify `loadDTMSTR`, `exportLTDtm`, `loadLTDtm`, and `loadFiles` methods are identical despite different overall file blobs.
- [x] Add source-order regression test that asserts LTDtm size preflight precedes `prepare()` and `arrayBuffer()` in both copies; Full Pytest #609 PASS.
- [ ] Complete browser/WebGL adversarial runtime coverage for malformed/truncated package input and GPU cleanup.
- [ ] Create adversarial tests for prioritized rows, still using temporary data only.
- [ ] Mark any vulnerability CONFIRMED only after reproduction; otherwise record PASS/NOT REPRODUCED or unresolved hypothesis.

## Initial Evo 2 implementation evidence

- Host Origin policy guard: `security_guard.py` centralizes the allowlist and retains no-Origin support for non-browser local clients; `null` and unlisted local ports are rejected on protected routes. Unit and endpoint regression tests passed Full Pytest #608: https://github.com/yay460-jpg/portofolio/actions/runs/38416665156.
- Static asset allowlist: Desktop Host now serves only `assets/`, `lithosite-Mine-Geologist/assets/`, and `lithosite-Mine-Services/Artifacts/`, `ui/`, and `shared/` trees; hidden segments are denied. Positive/negative tests passed Full Pytest #611: https://github.com/yay460-jpg/portofolio/actions/runs/38418373578.
- Topo3D package resource preflight: both engine copies now call `guardTopoFileSize_(file, maxPackageBytes, ...)` before `prepare()` and `file.arrayBuffer()`, retaining the post-read byte-length check. Source-order regression coverage passed Full Pytest #609: https://github.com/yay460-jpg/portofolio/actions/runs/38417323954.
- These are narrow hardening changes; they do not establish that all attack-surface rows are closed. Browser/WebGL runtime tests and the import boundary remain open. Static-file allowlist behavior is covered for the current documented UI paths; future asset roots still require review.

## Change rule

1. Establish the expected behavior before changing implementation.
2. Add an isolated failing test for a reproducible gap.
3. Patch only the owning layer and preserve current contracts.
4. Run targeted tests and full suite.
5. Review diffs for unrelated UI/engine changes, unintended writes, and data leakage.
6. Never promote to `main` or call Evo 2 LOCKED from a documentation update or green suite alone.
