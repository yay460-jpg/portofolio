# Lithosite Target Repository Tree

## Purpose

Dokumen ini mendefinisikan target struktur repository Lithosite setelah fase migrasi runtime selesai.

Target ini adalah **desain arsitektur**, bukan izin untuk langsung memindahkan file.

## Target Tree

```text
portofolio/
│
├── lithosite/                         # Canonical production runtime
│   ├── assets/
│   ├── member-app/
│   ├── modules/
│   ├── scripts/
│   ├── shared/
│   ├── style/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
│
├── docs/
│   └── lithosite/                     # Product documentation
│       ├── 00_Product/
│       ├── 01_Mine-Geologist/
│       ├── 02_Mine-Services/
│       ├── 03_Mine-Plan/
│       └── 04_Mine-Pit-Control/
│
├── mine-geologist/                    # Compatibility / rollback runtime
│
└── portfolio.html
```

## Runtime Rule

`lithosite/` adalah canonical deployment runtime.

Tidak boleh ada product documentation yang menjadi dependency runtime di dalam folder tersebut.

Runtime-owned paths tetap:

- `assets/`
- `member-app/`
- `modules/`
- `scripts/`
- `shared/`
- `style/`
- `index.html`
- `manifest.json`
- `sw.js`

## Documentation Rule

Semua documentation baru yang bersifat product-level diarahkan ke:

`docs/lithosite/`

Documentation domain dibagi menjadi:

### 00_Product

Pemilik:

- product identity
- architecture
- module map
- dependency governance
- migration gates
- product-level security evolution

### 01_Mine-Geologist

Pemilik:

- Mine Geologist module position
- runtime ownership
- module-specific architecture
- references to established Android/MG1 technical baseline

Dokumen teknis historis tidak ditulis ulang hanya karena lokasi berubah.

### 02_Mine-Services

Pemilik:

- Stage 1 Data Model
- Stage 2 Operational Transactions
- Fleet & Maintenance
- Planning & Budget
- HSE
- Reporting
- Audit
- Security Evolution

### 03_Mine-Plan

Reserved for future Mine Plan documentation.

### 04_Mine-Pit-Control

Reserved for future Mine Pit Control documentation.

## Established Android Documentation

Current:

`lithosite/Lithosite Android/`

Target conceptual owner:

`docs/lithosite/01_Mine-Geologist/Android/`

However, this is **not yet approved for physical movement**.

Reason:

The Android documentation contains locked baseline, Engine V2 contracts, Version History, guides, issue records, archive material, and internal links. It requires a dedicated migration rehearsal.

## Compatibility Runtime

`mine-geologist/` remains a compatibility / rollback runtime during the transition.

It must not become a second source of truth for new product documentation.

The eventual retirement of this runtime is a separate gate.

## Physical Migration Principle

No bulk move is allowed.

Migration must occur in controlled groups:

1. product documentation;
2. Mine Services documentation;
3. established Android/MG1 documentation;
4. compatibility documentation cleanup;
5. final runtime-only verification.

Each group requires:

- link audit;
- reference audit;
- GitHub Pages impact review;
- local verification;
- rollback path.

## Explicitly Not Moved

Until separately approved:

- `lithosite/index.html`
- `lithosite/manifest.json`
- `lithosite/sw.js`
- `lithosite/member-app/`
- `lithosite/shared/`
- `lithosite/scripts/`
- `lithosite/modules/`
- `lithosite/assets/`
- `lithosite/style/`
- `mine-geologist/`

## Target-State Invariant

The desired final relationship is:

```text
Documentation
     ↓ describes
Canonical Runtime
     ↓ implements
Module Contracts
     ↓ use
Approved Runtime Services
```

The runtime never depends on documentation location.

## Gate

**Target Repository Tree: DEFINED**

**Physical Migration: NOT YET APPROVED**
