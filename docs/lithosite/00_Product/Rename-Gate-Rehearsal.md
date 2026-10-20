# Lithosite — Runtime Rename Rehearsal

## Status
- Branch: `migration/lithosite-runtime-rename`
- Source runtime: `mine-geologist/`
- Target runtime: `lithosite/`
- Static migration rehearsal: **PASS**
- Live deployment verification: **PENDING**
- Rename Gate: **NOT YET PASSED**

## 1. Migration Rehearsal

A complete runtime copy was prepared under `lithosite/` while the existing `mine-geologist/` runtime remains intact.

This is intentional: it creates a reversible dual-runtime migration state without touching the production runtime.

## 2. Path Migration

Target runtime structure preserves the existing relative layout:

- `index.html`
- `manifest.json`
- `sw.js`
- `scripts/`
- `modules/`
- `style/`
- `assets/`
- `shared/`
- `member-app/`

Because the internal directory topology is preserved, relative runtime paths remain structurally compatible.

## 3. PWA Migration

Target dashboard manifest now identifies:

`https://yay460-jpg.github.io/portofolio/lithosite/index.html`

Target Member App manifest now identifies:

`https://yay460-jpg.github.io/portofolio/lithosite/member-app/index.html`

The old Mine Geologist manifests remain unchanged in the source runtime, preserving compatibility during transition.

## 4. Service Worker Migration

Target dashboard Service Worker has a distinct cache identity:

`lithosite-build-rename-20260927a`

Target Member App retains its separate Lithosite cache identity.

Dashboard and Member App Service Workers remain separate runtime boundaries.

## 5. Static Smoke Test

### Dashboard Service Worker shell
All 29 local shell references declared by the target dashboard Service Worker resolve to files in the migrated runtime tree.

Result: **PASS**

### Member App Service Worker shell
All 51 local shell references declared by the target Member App Service Worker resolve to files in the migrated runtime tree.

Result: **PASS**

### Dashboard HTML local references
All 25 local `src`/`href` references in the target dashboard resolve to files in the migrated runtime tree.

Result: **PASS**

### Member App HTML local references
All 46 local `src`/`href` references in the target Member App resolve to files in the migrated runtime tree.

Result: **PASS**

## 6. Compatibility State

The migration branch intentionally contains both:

`/mine-geologist/` — existing runtime

`/lithosite/` — migrated target runtime

This allows the old URL to remain available while the new runtime is verified.

## 7. Remaining Live Gate

The remaining checks cannot be honestly marked PASS from source inspection alone:

- GitHub Pages deployment of the migration branch/target
- opening the live `/lithosite/` URL
- dashboard PWA installation/update behavior
- Member App PWA installation/update behavior
- Service Worker registration in a real browser
- offline shell behavior
- old URL compatibility in the deployed environment
- installed-PWA migration behavior
- rollback from target to old runtime.

These require a real deployed browser environment.

## 8. Decision

Static Rename Gate: **PASS**

Runtime Deployment Gate: **PENDING**

Overall Rename Gate: **NOT YET PASSED**

No merge to `main` and no production URL change is authorized by this rehearsal alone.