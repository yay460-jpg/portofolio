# Lithosite Security Evolution 2 — Roadmap

## Decision

Evo 2 is the global, cross-product Lithosite security track. Evo 1 remains the historical, version-neutral record of application hardening already implemented. Evo 2 extends common policy and guard ownership without removing existing controls or centralizing domain validation that belongs to a specific runtime/engine.

## Current workspace and safety boundary

- Work branch: `v41-workspace`.
- Locked base before Evo 2 work: `698469057aa588de2c3d17a1327ef4892863994d`.
- Latest validated workspace commit before this reconciliation: `f7d35751c8d8b0075361925d94186001d9320a0d` (Full Pytest #613 PASS).
- Current work includes narrow, tested runtime hardening in the owning layers: explicit local Origin policy, static asset allowlist, Topo3D package-size preflight, and sanitized unreadable-workbook import errors. This is not a broad refactor; full coverage remains incomplete.
- Do not change `main` during this track until the owner explicitly promotes a tested and reviewed change.
- Use temporary A3 fixtures and temporary Evidence paths for adversarial tests.
- Never use the operational A3 workbook as a test fixture.
- Keep existing Geo Engine, Topo3D Engine, map-security.js, RuntimeAdapter, and ValidationEngine behavior intact unless a reproduced security gap justifies a minimal patch.

## Checklist

| ID | Stage | Exit criteria | Status |
|---|---|---|---|
| EVO2-01 | Confirm nomenclature and ownership | Evo 1 / Evo 2 definitions and responsibility boundaries documented | PASS — accepted and recorded |
| EVO2-02 | Complete attack-surface inventory | Endpoints, operations, input types, file paths, trust boundaries, owners, and existing controls mapped | IN PROGRESS — host routes and all 19 adapter operations are listed; initial import/restore/dataset/backup trace and static-path behavior are documented. An unexpected-entity-key gap in snapshot restore was reproduced against the locked source and fixed on the workspace; the analogous dataset load boundary is now guarded and regression-tested. Remaining: per-operation downstream validation/atomicity/audit trace, Geo caller/range inventory, full Browser Guard call-site coverage, and broader Topo3D runtime coverage. |
| EVO2-03 | Design isolated adversarial tests | Tests cover each prioritized boundary using temporary database and file fixtures | IN PROGRESS — isolated tests cover Origin allowlist (#608), Topo3D package-size preflight (#609), static asset allowlist (#611), and sanitized unreadable-XLSX import errors (#613). Remaining: deeper path/body boundary cases, malformed Topo3D runtime input, Geo finite/range tests, and additional restore/import error-contract cases. |
| EVO2-04 | Implement confirmed guard gaps in their owning layers | Only reproduced gaps patched behind regression tests; Host Guard must not bypass RuntimeAdapter | IN PROGRESS — explicit Origin allowlist, static asset allowlist, Topo3D LTDtm size preflight, unreadable-workbook error sanitization, and strict unknown-entity rejection in snapshot restore/dataset loading are implemented with regression tests. Other host/file/Geo/browser gaps remain open until reproduced. |
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

All Evo 2 code patches above exist on `v41-workspace` only. `main` remains the locked V41 baseline. Each result validates the current full regression suite, but does not lock Security Evolution 2 as a whole.
