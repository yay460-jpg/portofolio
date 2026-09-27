# Documentation Link & Reference Audit

## Scope

Audit target: current `main` after the Lithosite repository-boundary foundation merge.

Audit focus:

- Markdown relative-link integrity.
- References to retired or compatibility runtime paths.
- References to the old `docs/` documentation location.
- Cross-section navigation for the Android/Mine Geologist technical documentation.
- Baseline → Version-History relationships.
- Architecture → Engine relationships.
- Guide → runtime references.
- Archive → current-baseline boundaries.
- README navigation and status consistency.

No runtime files were changed by this audit.

## Result

**Status: CONDITIONAL PASS — documentation movement remains blocked until the identified stale references are normalized.**

The audit found no broken Markdown links in the checked Version-History index navigation. The existing Android documentation package is internally organized into Baseline, Architecture, Engine, Issues-Fixes, Version-History, Guides, and Archive.

However, the legacy developer README at:

`lithosite/README_Lithosite.md`

still contains references from the pre-normalization documentation layout.

## Findings

### 1. Legacy root README contains stale documentation paths

**File:** `lithosite/README_Lithosite.md`

The document references:

`02_Architecture/Security_Evolution.md`

but the current file is located at:

`lithosite/Lithosite Android/02_Architecture/Security_Evolution.md`

The same README also references:

`docs/panduan-split-backend-8file.md`
`docs/panduan-partisi-member-android.md`
`docs/panduan-geopdf-coordinate-engine.md`

There is no current `lithosite/docs/` directory containing those documents. Their current canonical locations are:

`lithosite/Lithosite Android/06_Guides/Backend_Split_8Files.md`
`lithosite/Lithosite Android/06_Guides/Member_Android_Partition.md`
`lithosite/Lithosite Android/06_Guides/GeoPDF_Coordinate_Engine.md`

**Classification:** BLOCKER for documentation migration.

### 2. Root product README is structurally current but its relative references are local to the current transition state

**File:** `lithosite/README.md`

The references to:

- `00_Product/Product-Architecture.md`
- `00_Product/Module-Map.md`
- `00_Product/Repository-Migration-Map.md`
- `00_Product/Security-Evolution.md`

are valid for the current transition tree because the Product documentation still physically resides under `lithosite/00_Product/`.

These references will require a controlled rewrite only when Group A Product Documentation is physically moved to `docs/lithosite/00_Product/`.

**Classification:** PASS for current tree; migration dependency recorded.

### 3. Version-History index navigation is intact

**File:** `lithosite/Lithosite Android/05_Version-History/00_Index.md`

The Markdown links in the version table resolve to files that exist in the current repository tree.

**Classification:** PASS.

### 4. Version-History content contains an obsolete folder-layout example

**File:** `lithosite/Lithosite Android/05_Version-History/00_Index.md`

The section `Struktur Folder Dokumen` still shows the historical source layout:

`LITHOSITE_VERSION_DOCS/`

This is not a broken navigation link and is useful as historical context, but it must not be interpreted as the current repository tree.

**Classification:** ACCEPTED — historical reference, but should be explicitly labelled as historical during a future documentation cleanup.

### 5. Progress Dashboard is stale relative to the current Version-History index

**File:** `lithosite/Lithosite Android/05_Version-History/00_Progress_Dashboard.md`

It states:

- Current: V24.3
- Next: V24.4
- V24.4 and later areas: 0%

The current Version-History index records V24.5 as the final release locked stage and V25 as the next stage.

This is a documentation consistency issue, not a runtime issue.

**Classification:** BLOCKER for final documentation normalization, not for runtime operation.

### 6. Android documentation boundary is otherwise coherent

The current package has the expected top-level sections:

- `01_Baseline`
- `02_Architecture`
- `03_Engine`
- `04_Issues-Fixes`
- `05_Version-History`
- `06_Guides`
- `99_Archive`

The README correctly defines Baseline as the source for current V24.5 behavior and separates historical material from current contracts.

**Classification:** PASS.

### 7. Runtime safety boundary remains intact

This audit did not identify a requirement to modify:

- `lithosite/index.html`
- `lithosite/manifest.json`
- `lithosite/sw.js`
- `lithosite/member-app/`
- `lithosite/shared/`
- `lithosite/scripts/`
- `lithosite/modules/`
- `lithosite/assets/`
- `lithosite/style/`

The documentation normalization work must continue without changing these runtime boundaries.

**Classification:** PASS.

## Gate Decision

| Gate | Result |
|---|---|
| Version-History Markdown navigation | PASS |
| Android documentation section structure | PASS |
| Current Baseline boundary | PASS |
| Runtime boundary protection | PASS |
| Legacy README path integrity | **BLOCKED** |
| Progress Dashboard consistency | **BLOCKED** |
| Documentation physical migration | **WAIT** |

## Required next action

Before moving documentation into the target `docs/lithosite/` tree:

1. Normalize `lithosite/README_Lithosite.md` so it no longer points to the retired `lithosite/docs/` layout.
2. Decide whether that README remains a Mine Geologist developer document or is replaced by a clean canonical Lithosite product/runtime README. Do not mix the two roles.
3. Bring `05_Version-History/00_Progress_Dashboard.md` into consistency with the current Version-History index, preserving historical meaning rather than rewriting history.
4. Re-run this audit after those changes.
5. Only after the audit reaches PASS, execute Group A Product Documentation migration.

## Safety rule

No runtime code, Service Worker, manifest, Engine V2, Member App runtime, or Mine Geologist compatibility runtime was changed as part of this audit.
