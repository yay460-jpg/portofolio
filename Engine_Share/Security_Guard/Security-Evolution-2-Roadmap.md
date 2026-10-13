# Lithosite Security Evolution 2 — Roadmap

## Decision

Evo 2 is the global, cross-product Lithosite security track. Evo 1 remains the historical, version-neutral record of application hardening already implemented. Evo 2 extends common policy and guard ownership without removing existing controls or centralizing domain validation that belongs to a specific runtime/engine.

## Current workspace and safety boundary

- Work branch: `v41-workspace`.
- Locked base commit before this documentation-only update: `698469057aa588de2c3d17a1327ef4892863994d`.
- This stage changes documentation/architecture scaffolding only; it does not change runtime behavior.
- Do not change `main` during this track until the owner explicitly promotes a tested and reviewed change.
- Use temporary A3 fixtures and temporary Evidence paths for adversarial tests.
- Never use the operational A3 workbook as a test fixture.
- Keep existing Geo Engine, Topo3D Engine, map-security.js, RuntimeAdapter, and ValidationEngine behavior intact unless a reproduced security gap justifies a minimal patch.

## Checklist

| ID | Stage | Exit criteria | Status |
|---|---|---|---|
| EVO2-01 | Confirm nomenclature and ownership | Evo 1 / Evo 2 definitions and responsibility boundaries documented | PASS — decision accepted |
| EVO2-02 | Complete attack-surface inventory | Endpoints, operations, input types, file paths, trust boundaries, owners, and existing controls mapped | IN PROGRESS — initial matrix exists; inventory still requires verification |
| EVO2-03 | Design isolated adversarial tests | Tests cover each prioritized boundary using temporary database and file fixtures | BLOCKED — wait for EVO2-02 prioritization |
| EVO2-04 | Implement Host Guard gaps | Only confirmed gaps patched behind regression tests; Host Guard does not bypass RuntimeAdapter | BLOCKED — wait for reproducing tests |
| EVO2-05 | Audit Browser Guard integration | Existing map-security.js call-sites, script order, export names, and tests mapped before reuse/refactor | BLOCKED — after host priority and call-site inventory |
| EVO2-06 | Record Geo and Topo3D responsibilities | Domain rules and resource boundaries mapped; no engine migration yet | IN PROGRESS — existing controls discovered; integration audit remains |
| EVO2-07 | Full regression and security gate | Targeted adversarial tests, full pytest, UI/static regression, console checks, and documented PASS/HOLD | BLOCKED — requires prior stages |

## Attack surface priority

1. Host origin/request boundary and `POST /runtime`.
2. Import, restore, and dataset/file operations.
3. Evidence upload/list/preview/file operations.
4. Static-file access and report generation.
5. RuntimeAdapter request contracts and exception behavior.
6. Browser package/import/rendering, including the existing map security module.
7. Geo numeric/CRS ranges and Topo3D DTM/mesh/resource limits.

Priorities are an ordering for audit and test design, not findings of confirmed vulnerabilities.

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
