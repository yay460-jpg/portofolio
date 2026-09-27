# Lithosite Repository Structure Audit

## Purpose

Dokumen ini menetapkan hasil audit struktur repository setelah migrasi runtime `mine-geologist/` → `lithosite/`.

Audit ini adalah **structure-only**. Tidak ada perubahan runtime, Engine V2, Service Worker, PWA contract, atau data model yang disetujui melalui dokumen ini.

## Audit Position

Repository saat ini memiliki dua runtime dan satu canonical documentation boundary:

```text
portofolio/
├── lithosite/          # canonical runtime
├── docs/
│   └── lithosite/      # canonical product documentation
├── mine-geologist/     # compatibility / rollback runtime
└── portfolio.html
```

Documentation transition groups have been separated from `lithosite/`; the canonical runtime tree now contains runtime assets and application components only.

## Current Classification

| Path | Current role | Structural layer | Decision |
|---|---|---|---|
| `lithosite/index.html` | dashboard entry | Runtime | Keep |
| `lithosite/manifest.json` | dashboard PWA contract | Runtime | Keep |
| `lithosite/sw.js` | dashboard Service Worker | Runtime | Keep |
| `lithosite/assets/` | runtime assets | Runtime | Keep |
| `lithosite/scripts/` | dashboard scripts | Runtime | Keep |
| `lithosite/modules/` | dashboard feature modules | Runtime | Keep |
| `lithosite/style/` | runtime styles | Runtime | Keep |
| `lithosite/member-app/` | separate PWA runtime | Runtime | Keep |
| `lithosite/shared/` | shared runtime dependencies | Runtime / candidate core | Audit before promotion |
| `docs/lithosite/00_Product/` | product architecture documentation | Governance / Documentation | **Canonical / PASS** |
| `docs/lithosite/02_Mine-Services/` | Mine Services documentation | Module documentation | **Canonical / PASS** |
| `docs/lithosite/01_Mine-Geologist/Android/` | established technical documentation | Technical documentation | **Canonical / PASS** |
| `lithosite/README_Lithosite.md` | legacy developer/runtime documentation | Documentation | Review and reconcile |
| `mine-geologist/` | compatibility runtime | Legacy / rollback runtime | Preserve |

## Findings

### 1. Group A Product Documentation is now separated from runtime

The Product documentation has been moved from:

`lithosite/00_Product/`

to:

`docs/lithosite/00_Product/`

The runtime root `lithosite/` no longer owns the Product architecture documentation.

### 2. Documentation groups are now separated from runtime

The established Android/MG1 and Mine Services documentation are now separated into their canonical documentation boundaries. Their migrations were performed independently from runtime code.

### 3. README_Lithosite.md remains a runtime-adjacent developer document

The file still describes the Mine Geologist runtime in detail.

It is not treated as the Product architecture source of truth.

Its references have been normalized to the current Android documentation package.

### 4. Lithosite Android documentation is an established technical domain

`Lithosite Android/` already contains its own Baseline, Architecture, Engine, Issues-Fixes, Version-History, Guides, Archive, and migration documentation.

It should not be flattened into the Product layer without a dedicated documentation migration map.

### 5. Runtime folders are internally meaningful

The following are runtime boundaries and must not be moved merely for visual cleanliness:

- `member-app/`
- `shared/`
- `scripts/`
- `modules/`
- `assets/`
- `style/`
- `manifest.json`
- `sw.js`

A visual cleanup that changes these paths is a runtime migration, not a folder cleanup.

## Structural Principle

The final repository should separate these concerns conceptually:

```text
Product
  ↓
Module
  ↓
Documentation / Governance

Runtime
  ↓
Application
  ↓
Shared Runtime / Engine
  ↓
PWA / Service Worker
```

Documentation must describe runtime contracts, but runtime code must not depend on product documentation.

## No-Move Rule

For the remaining runtime and documentation groups:

- no runtime directory is moved;
- no runtime file is renamed;
- no Service Worker path is changed;
- no manifest identity is changed;
- no Engine V2 source is changed;
- no Mine Services implementation is added;
- no legacy runtime is deleted.

## Next Structural Gates

1. Compatibility documentation cleanup.
2. Final runtime-only repository verification.
3. Compatibility runtime retirement — separate deployment/rollback gate.

## Current Gate

**Repository Structure Audit: PASS**

**Group A Product Documentation Migration: PASS**

**Group B / C Physical normalization: PASS**

**Runtime modification: NOT IN SCOPE**
