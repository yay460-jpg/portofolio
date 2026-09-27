# Documentation Link & Reference Audit

## Scope

Audit target: current `main` after the Lithosite repository-boundary foundation and documentation-reference normalization.

Audit focus:

- Markdown relative-link integrity.
- References to retired or compatibility runtime paths.
- References to the old `docs/` documentation location.
- Cross-section navigation for the Android / Mine Geologist technical documentation.
- Baseline → Version-History relationships.
- Architecture → Engine relationships.
- Guide → runtime references.
- Archive → current-baseline boundaries.
- README navigation and status consistency.

No runtime files were changed by this audit.

## Result

**Status: PASS**

The documentation reference blockers identified in the initial audit have been normalized.

The Version-History index contains 31 Markdown navigation links and all resolve to existing files in the current repository tree.

The legacy developer README now points to the current Android documentation package rather than the retired `lithosite/docs/` layout.

The Progress Dashboard is synchronized with the current V24.5 locked position and V25 next-stage scope.

## Resolved findings

### 1. Legacy root README

**File:** `lithosite/README_Lithosite.md`

Resolved:

- Security Architecture reference now targets `Lithosite Android/02_Architecture/Security_Evolution.md`.
- Backend split guide now targets `Lithosite Android/06_Guides/Backend_Split_8Files.md`.
- Member Android partition guide now targets `Lithosite Android/06_Guides/Member_Android_Partition.md`.
- GeoPDF guide now targets `Lithosite Android/06_Guides/GeoPDF_Coordinate_Engine.md`.

Relative-link validation: **PASS**.

### 2. Progress Dashboard

**File:** `lithosite/Lithosite Android/05_Version-History/00_Progress_Dashboard.md`

Resolved:

- Current position aligned to V24.5 Map Package / Storage / Recovery — Final Release Locked.
- Protected V24.2 baseline retained as locked.
- V25 identified as the next stage.
- V24.5 scope is recorded as completed.
- Native in-app Share Sheet remains explicitly deferred rather than being represented as a stable capability.

This is a current-status correction; historical version documents were not rewritten.

### 3. Root product README

**File:** `lithosite/README.md`

Current relative references remain valid while Product documentation physically resides under `lithosite/00_Product/`.

These references are intentionally recorded as a migration dependency for the later Group A documentation move to `docs/lithosite/00_Product/`.

### 4. Version-History index

**File:** `lithosite/Lithosite Android/05_Version-History/00_Index.md`

All 31 Markdown navigation links resolve.

The historical `LITHOSITE_VERSION_DOCS/` tree shown inside the document is retained as historical source-layout context and is not treated as the current repository tree.

## Boundary validation

The following runtime boundaries remain unchanged:

- `lithosite/index.html`
- `lithosite/manifest.json`
- `lithosite/sw.js`
- `lithosite/member-app/`
- `lithosite/shared/`
- `lithosite/scripts/`
- `lithosite/modules/`
- `lithosite/assets/`
- `lithosite/style/`
- `mine-geologist/` compatibility runtime

No documentation change introduced a runtime dependency on documentation files.

## Gate Decision

| Gate | Result |
|---|---|
| Version-History Markdown navigation | PASS |
| Android documentation section structure | PASS |
| Current Baseline boundary | PASS |
| Runtime boundary protection | PASS |
| Legacy README path integrity | PASS |
| Progress Dashboard consistency | PASS |
| Documentation physical migration | **READY FOR NEXT GATE** |

## Next gate

The Documentation Link & Reference Audit is now **PASS**.

The next controlled step is **Group A — Product Documentation migration**:

`lithosite/00_Product/` → `docs/lithosite/00_Product/`

That migration must:

1. move the Product documentation as one controlled group;
2. preserve exactly one authoritative copy;
3. update navigation and relative references after the move;
4. leave runtime files untouched;
5. re-run documentation link validation after the move;
6. keep Mine Geologist Android documentation as a separate controlled migration group;
7. keep Mine Services documentation separate from Mine Geologist implementation.

No physical runtime relocation is implied by this gate.

## Safety rule

No runtime code, Service Worker, manifest, Engine V2, Member App runtime, or Mine Geologist compatibility runtime was changed as part of this audit.
