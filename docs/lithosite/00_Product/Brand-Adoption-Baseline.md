# Lithosite — Brand Adoption Baseline

## Status
- Product brand: **Lithosite**
- Brand adoption: **ACTIVE**
- Product architecture: **ACTIVE**
- Runtime path rename: **DEFERRED**
- Rename Gate: required before physical runtime path migration

## 1. Product Brand

Lithosite is the umbrella product brand for the mining software platform.

Initial module structure:

- Mine Geologist
- Mine Services
- Mine Plan
- Mine Pit Control

The maturity of an individual module does not determine whether the Lithosite brand may be adopted.

## 2. Brand vs Runtime Identity

Brand identity and runtime path identity are separate concerns.

### Brand

May be adopted immediately across:
- product documentation
- architecture documentation
- module map
- UI/product naming where safe
- project communication

### Runtime Path

The existing Mine Geologist runtime path remains unchanged until the Rename Gate is passed.

Example:

`mine-geologist/` remains the current runtime path.

`Lithosite` is the product identity above that runtime.

## 3. Why Runtime Rename Is Deferred

The current runtime has path-sensitive dependencies including PWA manifests, Service Workers, cache scope, Member App paths, shared runtime resources, relative imports, and deployment URLs.

A physical directory rename therefore requires dependency verification rather than a simple folder rename.

## 4. Rename Gate

The runtime rename may proceed only after:

1. Repository path dependency audit passes.
2. PWA manifest/start_url/scope audit passes.
3. Service Worker scope and cache audit passes.
4. Member App path audit passes.
5. Shared Engine/Topo3D/Geo Engine path audit passes.
6. Relative import/reference audit passes.
7. GitHub Pages deployment path test passes.
8. Existing installed/bookmarked runtime behavior has a migration strategy.
9. Rollback path is documented and tested.
10. A clean post-rename smoke test passes.

## 5. Product Development Independence

Mine Services does not need to reach 98% before Lithosite branding or product architecture can advance.

Current state is intentionally:

`Lithosite → Mine Geologist (~98%) + Mine Services (Stage 2) + Mine Plan (planned) + Mine Pit Control (planned)`

Each module can mature independently while remaining under the Lithosite product layer.

## 6. Change Policy

Brand adoption does not authorize uncontrolled runtime renaming.

Runtime rename is a separate engineering change and must pass the Rename Gate.

Production runtime behavior must remain unchanged until that gate is explicitly passed.

## 7. Baseline Decision

**Lithosite is now the active product brand.**

**Mine Geologist remains the current runtime/module identity where path compatibility requires it.**

**Mine Services development proceeds independently and does not block brand adoption.**