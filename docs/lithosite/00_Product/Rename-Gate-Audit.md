# Lithosite — Runtime Rename Gate Audit

## Status
- Audit scope: `mine-geologist/` → `lithosite/`
- Branch under preparation: `architecture/lithosite-product-structure`
- Static source audit: **COMPLETE**
- Physical runtime rename: **NOT EXECUTED**
- Rename Gate: **BLOCKED — deployment migration still required**

## 1. Executive Result

The audit confirms that the current product can already use Lithosite as its brand, but the physical runtime path cannot yet be renamed safely as a simple directory operation.

The current runtime has path-sensitive PWA and Service Worker identities.

Current dashboard runtime:
`/portofolio/mine-geologist/`

Target runtime:
`/portofolio/lithosite/`

The migration must therefore be treated as a runtime deployment migration, not a cosmetic folder rename.

## 2. Static Audit Results

| Gate | Result | Finding |
|---|---|---|
| Product brand | PASS | Lithosite already active |
| Repository product layer | PASS | Product architecture exists independently |
| Dashboard manifest | BLOCKER | PWA ID contains `/mine-geologist/` |
| Dashboard production URL | BLOCKER | URL is embedded in runtime UI/documentation |
| Dashboard Service Worker | WARNING | SW is path-scoped and registered relatively |
| Dashboard cache identity | WARNING | Cache name still identifies Mine Geologist |
| Member App manifest | BLOCKER | PWA ID contains `/mine-geologist/member-app/` |
| Member App Service Worker | BLOCKER | Separate path-scoped SW/runtime |
| Member App shared paths | BLOCKER | Uses `../assets/` and `../shared/` relative to current location |
| Member App registration | WARNING | Registers local `./sw.js` |
| Documentation/runtime instructions | BLOCKER | Multiple instructions explicitly reference old folder/path |
| Engine/Topo3D ownership | AUDIT REQUIRED | Relative dependency paths must remain valid after relocation |
| GitHub Pages deployment | NOT VERIFIED | Deployment migration has not been executed |
| Rollback | NOT VERIFIED | No live rollback rehearsal yet |

## 3. Confirmed Source Findings

### Dashboard Manifest

`mine-geologist/manifest.json` currently defines:

- `start_url: ./index.html`
- `scope: ./`
- PWA `id` containing `/portofolio/mine-geologist/index.html`

Moving the runtime changes the effective PWA identity and installation scope.

### Dashboard Runtime

`mine-geologist/index.html` contains the production URL:

`https://yay460-jpg.github.io/portofolio/mine-geologist/`

It also contains operational instructions that refer to the `mine-geologist` Service Worker/cache naming.

### Dashboard Service Worker

`mine-geologist/scripts/main.js` registers:

`navigator.serviceWorker.register('./sw.js')`

This is relative registration, so moving the page changes the Service Worker location/scope relationship.

`mine-geologist/sw.js` uses a cache identity beginning with `mine-geologist-...`.

### Member App

`member-app/manifest.json` currently defines a PWA ID under:

`/portofolio/mine-geologist/member-app/index.html`

`member-app/index.html` registers its own `./sw.js` and loads shared resources using relative paths such as:

`../assets/...`
`../shared/geo-engine.js`
`../shared/topo3d/topo3d-engine.js`

These dependencies must be revalidated after relocation.

## 4. Required Migration Model

The safe model is not:

`rename folder → deploy`

The required model is:

1. Prepare target `/lithosite/` runtime.
2. Update path-sensitive references and PWA identities.
3. Preserve a compatibility strategy for `/mine-geologist/`.
4. Deploy the target runtime.
5. Verify dashboard PWA.
6. Verify Member App PWA.
7. Verify Service Worker registration and cache lifecycle.
8. Verify Map Engine, Geo Engine, and Topo3D paths.
9. Verify offline shell.
10. Verify old URL compatibility/migration behavior.
11. Verify rollback.
12. Only then declare Rename Gate PASS.

## 5. Compatibility Decision

The old `/mine-geologist/` URL must not simply disappear without a migration strategy.

Recommended transition:

`/mine-geologist/` = compatibility/migration entry

`/lithosite/` = canonical new runtime

The transition must account for installed PWAs because a Service Worker cannot be assumed to transfer control between unrelated scopes automatically.

Existing installed Mine Geologist PWAs therefore require an explicit migration/reinstall/update strategy.

## 6. Important Non-Changes

The following must remain unchanged during the rename unless separately audited:

- Engine V2 behavior
- Map tile contracts
- Map Library lifecycle
- Topo3D runtime behavior
- Geo Engine semantics
- backend/API contracts
- Mine Geologist business logic

The rename is a path/identity migration, not a feature refactor.

## 7. Rename Gate Checklist

### Static Gate
- [x] Product brand defined as Lithosite
- [x] Product architecture layer established
- [x] Dashboard manifest identified
- [x] Dashboard Service Worker identified
- [x] Member App manifest identified
- [x] Member App Service Worker identified
- [x] Relative shared dependencies identified
- [x] Production URL references identified
- [x] Compatibility requirement identified

### Migration Gate
- [ ] Target `/lithosite/` runtime created
- [ ] All path-sensitive references migrated
- [ ] Dashboard PWA ID/scope verified
- [ ] Member App PWA ID/scope verified
- [ ] Dashboard Service Worker verified
- [ ] Member App Service Worker verified
- [ ] Cache migration verified
- [ ] Engine/Topo3D/Geo Engine paths verified
- [ ] Old URL compatibility verified
- [ ] GitHub Pages deployment verified
- [ ] Offline behavior verified
- [ ] Installed-PWA migration verified
- [ ] Rollback verified

## 8. Gate Decision

**Rename Gate = NOT PASSED YET.**

This is an intentional engineering block, not a product-brand block.

The static audit is complete enough to define the migration work. The remaining gate requires an actual target-runtime migration and deployment verification.

## 9. Next Controlled Step

Create a dedicated runtime-migration branch from the current architecture branch.

That branch should contain only the path/PWA/Service Worker migration required for the rename.

No Mine Services feature work should be mixed into that migration branch.

After the migration branch passes smoke, PWA, offline, and rollback verification, the Rename Gate can be marked **PASS** and the runtime can become canonically Lithosite.