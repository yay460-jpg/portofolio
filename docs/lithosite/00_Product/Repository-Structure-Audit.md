# Lithosite Repository Structure Audit

## Purpose

Dokumen ini menetapkan hasil audit struktur repository setelah migrasi runtime `mine-geologist/` → `lithosite/`.

Audit ini adalah **structure-only**. Tidak ada perubahan runtime, Engine V2, Service Worker, PWA contract, atau data model yang disetujui melalui dokumen ini.

## Audit Position

Repository saat ini memiliki dua runtime:

```text
portofolio/
├── lithosite/          # canonical runtime baru
├── mine-geologist/     # compatibility / rollback runtime
└── portfolio.html
```

Di dalam `lithosite/` saat ini terdapat dua kelompok yang secara konsep berbeda:

1. runtime application;
2. product / architecture documentation.

Kondisi ini menjelaskan mengapa struktur terlihat bercampur.

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
| `lithosite/00_Product/` | product architecture documentation | Governance / Documentation | Boundary review |
| `lithosite/02_Mine-Services/` | Mine Services documentation | Module documentation | Boundary review |
| `lithosite/Lithosite Android/` | established technical documentation | Technical documentation | Preserve; future consolidation only |
| `lithosite/README_Lithosite.md` | legacy developer/runtime documentation | Documentation | Review and reconcile |
| `mine-geologist/` | compatibility runtime | Legacy / rollback runtime | Preserve |

## Findings

### 1. Runtime and documentation are mixed

The canonical `lithosite/` runtime now contains:

```text
Runtime
+
Product documentation
+
Mine Services documentation
+
Technical Android documentation
```

This is structurally understandable during migration, but it is not the desired long-term product boundary.

### 2. Existing product documents contain historical migration assumptions

Some product migration documents still describe `lithosite/` as a documentation/product layer while the current repository now contains the canonical runtime there.

Those documents must be reconciled before any physical reorganization.

### 3. README_Lithosite.md is not yet a clean canonical product README

The file still describes the application primarily as Mine Geologist and contains references to documentation paths inherited from the previous runtime layout.

It must not be treated as the final Lithosite product architecture document.

### 4. Lithosite Android documentation is an established technical domain

`Lithosite Android/` already contains its own Baseline, Architecture, Engine, Issues-Fixes, Version-History, Guides, Archive, and migration documentation.

It should not be flattened into the new product layer without a dedicated documentation migration map.

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

At this stage:

- no runtime directory is moved;
- no runtime file is renamed;
- no Service Worker path is changed;
- no manifest identity is changed;
- no Engine V2 source is changed;
- no Mine Services implementation is added;
- no legacy runtime is deleted.

## Next Structural Gates

Before physical reorganization:

1. Layer and boundary map must be approved.
2. Module ownership must be explicit.
3. Documentation ownership must be explicit.
4. Runtime dependency direction must be verified.
5. Product-global candidates must be audited from actual consumers.
6. A target repository tree must be approved.
7. A path migration matrix must be prepared.
8. Only then may a dedicated normalization branch move files.

## Current Gate

**Repository Structure Audit: PASS**

**Physical normalization: NOT YET APPROVED**

**Runtime modification: NOT IN SCOPE**
