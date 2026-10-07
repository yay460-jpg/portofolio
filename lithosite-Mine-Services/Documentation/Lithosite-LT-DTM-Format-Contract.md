# Lithosite LT-DTM Package Contract

**Status:** V37 Stage 26  
**Brand:** Lithosite  
**Format:** `.ltdtm`  
**Meaning:** **LT-DTM = Lithosite Digital Terrain Model**

## 1. Purpose

The `.ltdtm` file is the common **topography exchange package** used by Lithosite products.

It exists so that **Mine Services** and **Mine Geologist Android Member** can exchange topography using the same file format without sharing folders, databases, or runtime storage.

The interoperability contract is the **file format**, not the storage location.

## 2. Product Boundary

Mine Services and Mine Geologist remain independent applications.

```text
Mine Services
    │
    │ Export / Backup
    ▼
  .ltdtm
    ▲
    │ Import / Open
    │
Mine Geologist Android Member
```

The reverse direction is also supported:

```text
Mine Geologist Android Member
    │
    │ Export
    ▼
  .ltdtm
    ▲
    │ Import / Open
    │
Mine Services
```

### Important boundary rule

**Do not create or depend on a shared Mine Services topography folder for Mine Geologist.**

Mine Services owns its own local backup storage.

Mine Geologist owns its own Android storage.

Neither application is required to access the other's internal storage.

## 3. Topography Package Principle

A topography source may consist of multiple source components, such as:

- DTM surface data
- STR / terrain structure data

The `.ltdtm` package combines the required topography components into **one portable file**.

Therefore, a user does not need to keep a DTM file and an STR file manually paired when transferring or restoring a saved topography package.

```text
DTM + STR
   │
   ▼
LITHODTM / .ltdtm
   │
   ├── Mine Services
   └── Mine Geologist Android Member
```

## 4. Mine Services Storage

Mine Services may maintain local topography backups under its own application storage, for example:

`Database/topography/`

This folder is **Mine Services internal storage only**.

It is not a shared folder and is not part of the Mine Geologist runtime contract.

Recommended retention for Mine Services local topography backups:

**Maximum: 5 packages**

```text
Database/topography/
├── topography-backup-01.ltdtm
├── topography-backup-02.ltdtm
├── topography-backup-03.ltdtm
├── topography-backup-04.ltdtm
└── topography-backup-05.ltdtm
```

Retention policy may remove the oldest local backup when the limit is exceeded.

## 5. Interoperability Rule

A valid Lithosite topography exchange is represented by a `.ltdtm` file.

| Producer | Output | Consumer |
|---|---|---|
| Mine Services | `.ltdtm` | Mine Services / Mine Geologist |
| Mine Geologist Android Member | `.ltdtm` | Mine Geologist / Mine Services |

The consumer must not require the producer's original DTM, STR, database, folder structure, or application runtime.

## 6. What LT-DTM Means

When a user asks:

> **"What is an LT-DTM / .ltdtm file?"**

The standard explanation is:

> **LT-DTM means Lithosite Digital Terrain Model. It is Lithosite's portable topography package for exchanging Digital Terrain Model data between Lithosite applications.**

Short form:

**LT-DTM = Lithosite Digital Terrain Model**

Extension:

**`.ltdtm`**

## 7. Compatibility Requirement

Mine Services and Mine Geologist may evolve independently, but their topography import/export interfaces must preserve compatibility with the agreed `.ltdtm` package contract.

A change to the package structure must be treated as a format-contract change and documented before release.

Compatibility means:

- same `.ltdtm` extension;
- same package contract/version semantics;
- portable between Lithosite products;
- no dependency on the originating application's internal storage;
- no dependency on a shared folder.

## 8. Non-Goals

The LT-DTM contract does **not** mean:

- Mine Geologist can browse Mine Services' `Database/topography/` directly;
- Mine Services can browse Mine Geologist's Android private storage;
- the two applications share an XLSX database;
- the two applications share runtime state;
- the two applications need to be online together.

Only the **exported `.ltdtm` file** is exchanged.

## 9. V37 Design Decision

For V37, the topography direction is:

**One portable topography package instead of manually transferring paired DTM + STR files.**

The package is the Lithosite-level exchange boundary:

```text
                    Lithosite
                       │
                ┌──────┴──────┐
                │   .ltdtm    │
                │ LT-DTM      │
                │ Lithosite   │
                │ Digital     │
                │ Terrain     │
                │ Model       │
                └──────┬──────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   Mine Services          Mine Geologist
   own storage            own storage
```

This keeps the two products independent while allowing reliable topography exchange under the same Lithosite brand.