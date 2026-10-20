# Lithosite Security Evolution

## Purpose

Security is treated as a product-wide evolution, while each module remains responsible for its own domain controls.

## Principles

1. Authentication and authorization boundaries must be explicit.
2. Runtime data access must follow the owning module's contract.
3. Sensitive data must not be duplicated unnecessarily between modules.
4. Auditability must be preserved when data crosses module boundaries.
5. Security changes must be documented as architecture changes, not only as patches.
6. Existing production security behavior must not be weakened during structural migration.

## Migration Security Gate

Repository restructuring must verify:

- authentication paths
- authorization paths
- Service Worker scope
- cached asset boundaries
- external API endpoints
- local storage usage
- package/import boundaries
- file access paths
- deployment URLs

## Module Security

Each module will maintain its own security evolution documentation.

The product layer records cross-module security rules and ownership.

## Security Evolution 1 and 2

### Security Evolution 1 — Existing hardening history

Evo 1 refers to the existing security hardening track documented in [Security Hardening History](../01_Mine-Geologist/Android/02_Architecture/Security_Hardening_History.md), including the security-boundary audit, XSS hardening, resource-boundary hardening, dependency hardening, and session hardening. The historical controls remain valid within their existing scope; this classification does not assert that every product/runtime has identical controls.

### Security Evolution 2 — Global cross-product security

Evo 2 establishes the product-wide coordination and ownership model for common security policy across Lithosite products and runtimes. It begins with the shared `Engine_Share/Security_Guard` scaffold, attack-surface inventory, adversarial tests, then minimal and proven controls in each owning layer.

Evo 2 does not replace Evo 1 history, move domain validation into a global monolith, or treat a browser check as authoritative for backend data operations. Geo CRS/spatial constraints, Topo3D DTM/mesh/resource constraints, and Mine Services backend mutation controls remain owned by their corresponding engines/runtimes.

The active roadmap and current checklist are maintained in [Security Evolution 2 Roadmap](../../../Engine_Share/Security_Guard/Security-Evolution-2-Roadmap.md).

## Current Status

Security Evolution 1 remains the documented historical hardening baseline. Security Evolution 2 nomenclature and ownership model are accepted; its current state is **IN PROGRESS — documentation and inventory stage**. No existing runtime security contract is changed by this designation alone.
