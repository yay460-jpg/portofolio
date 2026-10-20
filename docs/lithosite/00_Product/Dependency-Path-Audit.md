# Lithosite — Dependency & Path Audit

## Audit Scope

Audit target:

`architecture/lithosite-product-structure`

Repository:

`yay460-jpg/portofolio`

The audit verifies the current Mine Geologist runtime boundaries before any future directory migration.

## Result

Status: **PASS — No runtime relocation approved yet**

The current source shows that the Mine Geologist dashboard and Member App are separate runtime shells with separate manifests and Service Workers.

The existing relative paths are internally consistent with the current directory layout.

## 1. Mine Geologist Dashboard

Entry point:

`mine-geologist/index.html`

Local runtime dependencies are loaded from:

```text
mine-geologist/
├── index.html
├── manifest.json
├── sw.js
├── style/
├── scripts/
├── modules/
└── assets/
```

The dashboard loads:

- `scripts/config.js`
- `scripts/api.js`
- `scripts/i18n.js`
- `scripts/helpers.js`
- `scripts/auth.js`
- `scripts/export.js`
- `scripts/main.js`
- `scripts/bg-particles.js`
- `scripts/splash.js`
- `scripts/member-card-expand.js`
- `modules/barging.js`
- `modules/digging.js`
- `modules/validation.js`
- `modules/reconciliation.js`
- `modules/member.js`
- `modules/settings.js`
- `modules/issue.js`

These paths are root-relative to the `mine-geologist/` runtime and must remain stable while this runtime is locked.

## 2. Mine Geologist PWA Contract

Current manifest:

`mine-geologist/manifest.json`

Important contract:

- `start_url = ./index.html`
- `scope = ./`
- PWA identity points to the current GitHub Pages path under `/portofolio/mine-geologist/`

This makes `mine-geologist/` a deployment-sensitive path.

A directory rename is therefore not a cosmetic change. It would require a dedicated PWA migration.

## 3. Mine Geologist Service Worker

Current Service Worker:

`mine-geologist/sw.js`

It uses its own cache namespace:

`mine-geologist-build-20260904a`

Its APP_SHELL is scoped to the dashboard runtime:

```text
./index.html
./manifest.json
./style/*
./scripts/*
./modules/*
./assets/*
```

It is therefore a separate Service Worker boundary from the Member App.

The root dashboard Service Worker does not establish a shared cache contract with the Member App.

## 4. Member App Boundary

Entry point:

`mine-geologist/member-app/index.html`

The Member App has its own:

- `manifest.json`
- `sw.js`
- `scripts/`
- `vendor/`
- map runtime
- application UI

Its manifest uses:

- `start_url = ./index.html`
- `scope = ./`
- a PWA identity under `/portofolio/mine-geologist/member-app/`

Therefore `member-app/` is a distinct PWA/runtime boundary.

## 5. Member App → Shared Dependencies

Member App explicitly loads:

```text
../shared/geo-engine.js
../shared/topo3d/topo3d-engine.js
```

This proves that `shared/` is currently shared within the Mine Geologist runtime container between the Member App and at least the intended Master/runtime integration.

The source comments describe `geo-engine.js` as a single shared geospatial engine and `topo3d-engine.js` as a UI-independent shared Topo3D engine.

Decision:

**KEEP `mine-geologist/shared/` in place for now.**

Do not move it to `lithosite/shared/` yet.

## 6. Shared Engine Ownership

### geo-engine.js

Current location:

`mine-geologist/shared/geo-engine.js`

Observed role:

- inverse UTM
- grid convergence
- bearing/distance
- explicit parameters instead of Android-specific globals

Current evidence supports treating this as a Mine Geologist shared runtime component.

It is a candidate for future Lithosite shared infrastructure, but not yet promoted.

### topo3d-engine.js

Current location:

`mine-geologist/shared/topo3d/topo3d-engine.js`

Observed role:

- UI-independent Topo3D engine
- WebGL terrain rendering
- resource guards
- independent engine instance state

The source describes it as reusable by Member and later Master.

Decision:

**KEEP in current location until actual cross-module consumers exist.**

The phrase "later Master" is not sufficient evidence to promote it to product-global infrastructure.

## 7. Member App Service Worker

Current Service Worker:

`mine-geologist/member-app/sw.js`

Current cache namespace:

`lithosite-member-app-v24.5-lock-20260927-topo3d-step22-residual-cleanup`

The APP_SHELL explicitly includes:

```text
../shared/geo-engine.js
../shared/topo3d/topo3d-engine.js
```

and many local map/runtime scripts.

This confirms that moving `shared/` or `member-app/` without updating and validating the Service Worker would risk offline runtime failure.

## 8. Root Dashboard vs Member App

Current architecture:

```text
Mine Geologist Runtime
│
├── Dashboard PWA
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
│
├── Member App PWA
│   ├── member-app/index.html
│   ├── member-app/manifest.json
│   └── member-app/sw.js
│
└── Runtime Shared
    └── shared/
        ├── geo-engine.js
        └── topo3d/
            └── topo3d-engine.js
```

This is a valid boundary and should not be collapsed during product restructuring.

## 9. Assets

The Member App references shared branding assets through:

```text
../assets/
```

The root dashboard references:

```text
assets/
```

This indicates that the current `mine-geologist/assets/` directory is a runtime asset boundary used by both application surfaces.

Decision:

**KEEP `mine-geologist/assets/` in place.**

Do not duplicate the asset library into `lithosite/assets/` during this phase.

## 10. Lithosite Product Layer

The newly created:

`lithosite/`

does not currently participate in the runtime.

It contains product architecture documentation only.

This is intentional.

Therefore:

```text
lithosite/
    ↓
documentation / product architecture

mine-geologist/
    ↓
production runtime
```

No runtime dependency currently points from Mine Geologist into the new product layer.

## 11. Migration Risk Matrix

| Component | Current Boundary | Risk if moved now | Decision |
|---|---|---|---|
| Mine Geologist root | GitHub Pages + PWA | High | Keep |
| Dashboard manifest | PWA identity/scope | High | Keep |
| Dashboard SW | Cache/runtime | High | Keep |
| Member App | Separate PWA | High | Keep |
| Member App SW | Offline shell/cache | High | Keep |
| shared/geo-engine.js | Relative import | Medium/High | Keep |
| shared/topo3d/ | Relative import + SW | Medium/High | Keep |
| assets/ | Shared relative paths | Medium/High | Keep |
| scripts/ | Dashboard runtime | High | Keep |
| modules/ | Dashboard runtime | High | Keep |
| lithosite/ | Documentation layer | Low | Expand safely |

## 12. Audit Conclusion

The audit confirms the original migration decision:

**Do not rename or move `mine-geologist/` at this stage.**

The current runtime has multiple path-sensitive contracts:

```text
GitHub Pages path
      +
PWA manifest identity
      +
PWA scope
      +
Service Worker scope
      +
Service Worker cache
      +
relative imports
      +
shared runtime assets
      +
Member App runtime
```

The correct architectural move is therefore to continue building the Lithosite product layer above the existing runtime.

## 13. Next Gate

Before any runtime relocation:

1. Complete Module Boundary Map.
2. Complete Mine Geologist ownership map.
3. Define Mine Services boundary.
4. Identify genuinely product-global services.
5. Create migration test checklist.
6. Verify GitHub Pages deployment behavior on a disposable migration branch.
7. Only then consider runtime path migration.

Current decision:

**Migration Gate 1 = PASS**

**Runtime Relocation = NOT APPROVED**

**Mine Services can continue independently.**
