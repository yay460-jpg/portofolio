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

## Current Status

This document establishes the product-level framework only.

No existing runtime security contract is changed by this document.
