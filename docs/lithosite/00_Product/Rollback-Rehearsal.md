# Rollback Rehearsal

## Scope

Controlled source-level rehearsal of the compatibility path after the Compatibility Runtime Audit.

No runtime source was changed.

## Rehearsal Matrix

| Gate | Result | Evidence |
|---|---|---|
| Canonical dashboard exists | PASS | `lithosite/index.html` |
| Canonical manifest exists | PASS | `lithosite/manifest.json` |
| Canonical dashboard SW exists | PASS | `lithosite/sw.js` |
| Canonical Member App exists | PASS | `lithosite/member-app/index.html` |
| Canonical Member manifest exists | PASS | `lithosite/member-app/manifest.json` |
| Canonical Member SW exists | PASS | `lithosite/member-app/sw.js` |
| Compatibility dashboard exists | PASS | `mine-geologist/index.html` |
| Compatibility manifest exists | PASS | `mine-geologist/manifest.json` |
| Compatibility dashboard SW exists | PASS | `mine-geologist/sw.js` |
| Compatibility Member App exists | PASS | `mine-geologist/member-app/index.html` |
| Compatibility Member manifest exists | PASS | `mine-geologist/member-app/manifest.json` |
| Compatibility Member SW exists | PASS | `mine-geologist/member-app/sw.js` |
| Relative dashboard asset/script paths remain local | PASS | Corresponding runtime trees contain referenced local assets/scripts |
| Member App shared engine paths remain local | PASS | `../shared/geo-engine.js` and `../shared/topo3d/topo3d-engine.js` exist in both roots |
| Dashboard PWA identities are isolated | PASS | Separate manifest IDs |
| Member PWA identities are isolated | PASS | Separate manifest IDs |
| Dashboard Service Worker cache namespaces are isolated | PASS | `lithosite-build-rename-20260927a` vs `mine-geologist-build-20260904a` |
| Canonical runtime remains structurally independent | PASS | Canonical root exists independently of compatibility root |

## Historical Rollback Simulation

Historical rollback target during the migration rehearsal:

`mine-geologist/`

A rollback can be addressed by the existing compatibility runtime root without renaming or rewriting its internal relative paths.

The compatibility dashboard keeps its historical PWA identity:
`https://yay460-jpg.github.io/portofolio/mine-geologist/index.html`

The compatibility Member App keeps its historical PWA identity:
`https://yay460-jpg.github.io/portofolio/mine-geologist/member-app/index.html`

The compatibility dashboard and Member App use their own Service Workers and retain separate cache namespaces from `lithosite/`.

## Important Limitation

This is a repository/source-level rollback rehearsal. It verifies that the rollback target and its isolation boundaries are present and internally coherent.

It does **not** establish live GitHub Pages availability, DNS/CDN behavior, or real-device PWA installation behavior. Those require an environment where the deployed Pages endpoints can be reached.

## Decision

**Rollback Rehearsal: PASS at repository/source level.**

This rehearsal is now historical because the compatibility runtime has been retired from the active tree. The former target remains recoverable from Git history if a source-level rollback is ever required.

## Next Gate

Proceed to a **Compatibility Retirement Decision Gate** only after preserving this rehearsal result.

Retirement must remain conditional on:
1. no unresolved runtime dependency on `mine-geologist/`;
2. canonical runtime remaining the only intended current source-of-truth;
3. an acceptable operational rollback plan;
4. explicit production verification when deployment access is available.

Those gates were satisfied by the subsequent real-device PWA verification and controlled retirement commit. `lithosite/` is now the sole current runtime source of truth.
