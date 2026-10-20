# Lithosite Documentation Ownership and Migration Map

## Purpose

Dokumen ini menentukan siapa pemilik setiap kelompok dokumentasi yang saat ini tersebar di repository dan bagaimana dokumentasi tersebut diposisikan setelah normalisasi.

Dokumen ini mencatat hasil migrasi dokumentasi secara bertahap dan tidak mengubah runtime contract.

## Current Documentation Sources

Setelah Group A selesai, kelompok dokumentasi utama berada di:

```text
docs/lithosite/00_Product/
docs/lithosite/02_Mine-Services/
docs/lithosite/01_Mine-Geologist/Android/
```

Selain itu terdapat documentation material di runtime compatibility:

```text
mine-geologist/Lithosite Android/
```

## Ownership Matrix

| Current location | Content | Future owner | Action |
|---|---|---|---|
| `docs/lithosite/00_Product/` | Product architecture | Product | **MOVED / CANONICAL** |
| `docs/lithosite/02_Mine-Services/` | Mine Services lifecycle | Mine Services | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/01_Baseline/` | Locked technical baseline | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/02_Architecture/` | Architecture/security | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/03_Engine/` | Engine/runtime technical docs | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/04_Issues-Fixes/` | Issue/fix history | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/05_Version-History/` | Historical record | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/06_Guides/` | Guides | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/99_Archive/` | Historical archive | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/DOCUMENT_STYLE.md` | Documentation style | Product documentation standard | **MOVED / CANONICAL within Android package** |
| `docs/lithosite/01_Mine-Geologist/Android/MIGRATION_MAP.md` | Technical migration map | Mine Geologist / Android | **MOVED / CANONICAL** |
| `docs/lithosite/01_Mine-Geologist/Android/README.md` | Technical documentation entry | Mine Geologist / Android | **MOVED / CANONICAL** |
| `mine-geologist/Lithosite Android/` | Compatibility copy | Compatibility runtime | Do not create new source material |

## Source-of-Truth Rule

After migration, there must be exactly one authoritative copy of each current document.

Temporary duplication is permitted only during a controlled migration rehearsal.

The following is prohibited:

```text
Current docs A
     +
Current docs B
     +
different edits
     =
two sources of truth
```

## Version History Rule

Version-specific historical documents remain historical.

They may be relocated, but their technical content is not rewritten merely to fit the new tree.

Global/current contracts should remain separated from historical records.

## Baseline Rule

Current locked technical contracts remain under the Mine Geologist/Android documentation ownership until explicitly promoted or superseded.

A directory rename does not change a baseline.

## Link Migration Rule

Before any physical move, inspect:

- Markdown relative links;
- HTML documentation links;
- repository links;
- GitHub Pages links;
- references to `mine-geologist/`;
- references to `lithosite/`;
- references to `Lithosite Android/`;
- references to version-history locations;
- references from README navigation.

Broken documentation links are treated as migration failures.

## Compatibility Documentation Rule

The old `mine-geologist/Lithosite Android/` tree is not allowed to diverge from the canonical documentation.

During the transition it may remain as a historical compatibility copy.

Once the canonical documentation is verified at its target location, the compatibility copy can be retired through a separate cleanup gate.

## Migration Sequence

### Group A — Product Documentation

```text
lithosite/00_Product/
        ↓
docs/lithosite/00_Product/
```

**Status: COMPLETE / PASS**

### Group B — Mine Services

```text
lithosite/02_Mine-Services/
        ↓
docs/lithosite/02_Mine-Services/
```

No Mine Services runtime dependency is introduced.

**Status: COMPLETE / PASS**

### Group C — Mine Geologist Android Documentation

```text
lithosite/Lithosite Android/
        ↓
docs/lithosite/01_Mine-Geologist/Android/
```

This group has completed its controlled audit and physical migration. Historical links and baseline references were preserved.

### Group D — Compatibility Cleanup

Only after Groups A-C are verified:

- remove duplicate documentation;
- reconcile old README links;
- confirm no runtime dependency points to documentation;
- preserve historical records in exactly one location.

## Gate

**Documentation Ownership Map: PASS**

**Migration Map: PASS**

**Group A Physical Documentation Move: PASS**

**Group B Physical Documentation Move: PASS**

**Group C Physical Documentation Move: PASS**
