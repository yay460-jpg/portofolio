# Lithosite — Brand Adoption Baseline

## Status

- Product brand: **Lithosite**
- Brand adoption: **ACTIVE**
- Module naming convention: **ACTIVE**
- Canonical Mine Geologist runtime: **ACTIVE** at `lithosite/`
- Compatibility / rollback runtime: **RETIRED**
- Compatibility retirement: **COMPLETED** after repository and real-device PWA verification

## 1. Product Brand

Lithosite is the umbrella product brand for the mining software platform.

Initial module structure:

- Mine Geologist
- Mine Services
- Mine Plan
- Mine Pit Control

The maturity of an individual module does not determine whether the Lithosite brand may be adopted.

## 2. Module Brand Naming

The user-facing module naming convention is:

- **Lithosite | Mine Geologist**
- **Lithosite | Mine Services**
- **Lithosite | Mine Plan**
- **Lithosite | Mine Pit Control**

This naming convention identifies the product brand first and the module second.

For the current mature module, the canonical dashboard and PWA identity use **Lithosite | Mine Geologist**.

Mine Services will use **Lithosite | Mine Services** when its user-facing runtime is introduced.

## 3. Brand vs Runtime Identity

Brand identity and runtime path identity are separate concerns.

### Brand

The Lithosite brand may be used across:

- product documentation
- architecture documentation
- module map
- UI and PWA naming
- project communication

### Runtime Path

The canonical Mine Geologist runtime is now:

`lithosite/`

The previous `mine-geologist/` runtime has been retired after the canonical Lithosite runtime passed repository and real-device PWA verification.

The path name is therefore not used as the product brand.

## 4. Compatibility Runtime Retirement

The former `mine-geologist/` compatibility runtime has been retired from the active repository tree.

The canonical `lithosite/` runtime is now the sole current Mine Geologist runtime source of truth.

Historical compatibility state remains recoverable through Git history rather than a second live runtime tree.

## 5. Product Development Independence

Mine Services does not need to reach the same maturity level as Mine Geologist before Lithosite branding or product architecture can advance.

Current product structure is intentionally:

`Lithosite → Mine Geologist + Mine Services + Mine Plan + Mine Pit Control`

Each module can mature independently while remaining under the Lithosite product layer.

## 6. Change Policy

Brand naming changes do not authorize uncontrolled runtime restructuring.

Runtime changes remain subject to repository, PWA, Service Worker, dependency, deployment, and rollback verification.

New Mine Services work must remain independent from the mature Mine Geologist runtime unless an explicit shared dependency is documented and audited.

## 7. Baseline Decision

**Lithosite is the active product brand.**

**Lithosite | Mine Geologist is the current canonical user-facing module brand.**

**Lithosite | Mine Services is the reserved user-facing module brand for the Mine Services runtime.**

**The canonical Mine Geologist runtime is `lithosite/`.**

**The previous `mine-geologist/` runtime has been retired; `lithosite/` is the sole current Mine Geologist runtime source of truth.**
