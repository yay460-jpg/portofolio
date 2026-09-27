# Compatibility Runtime Audit

## Scope

Audit the legacy `mine-geologist/` tree before any compatibility cleanup or retirement decision.

This audit is read-only with respect to runtime behavior. It does not approve deletion, renaming, or modification of the compatibility runtime.

## Current Role

`mine-geologist/` is the compatibility / rollback runtime.

The canonical production runtime is `lithosite/`.

The canonical documentation is `docs/lithosite/`.

## Findings

At the audited `main` tree:
- `mine-geologist/` contains 206 tree entries and 182 files.
- 64 files are Markdown documentation, including the legacy `Lithosite Android/` package.
- The runtime surface closely corresponds to `lithosite/`.

Path/blob comparison:
- canonical `lithosite/`: 121 files
- compatibility `mine-geologist/`: 182 files
- common corresponding files: 120
- byte-identical common files: 114
- differing common files: 6
- additional compatibility files: 62

The 62 additional files are the legacy Android documentation package, not a second runtime implementation.

## Six Runtime Differences

1. `README_Lithosite.md`: canonical copy describes `lithosite/`; compatibility copy retains the historical `mine-geologist/` deployment description. Intentional.
2. `index.html`: production PWA URL is `/portofolio/lithosite/` versus `/portofolio/mine-geologist/`. Required identity difference.
3. `manifest.json`: PWA `id` is scoped to the corresponding runtime root. Required identity difference.
4. `member-app/manifest.json`: PWA `id` is scoped to the corresponding member-app root. Required identity difference.
5. `sw.js`: cache namespaces are separate: `lithosite-build-rename-20260927a` versus `mine-geologist-build-20260904a`. Required isolation.
6. `member-app/index.html`: one parent-path comment differs. Comment-only.

## Reference Finding

Repository code search returned no results for:
- `lithosite/Lithosite Android`
- `lithosite/02_Mine-Services`
- `lithosite/00_Product`

The canonical documentation tree is therefore separated from the runtime locations audited here.

## PWA / Service Worker Boundary

The compatibility runtime retains its own dashboard and member-app manifests and Service Workers. The canonical runtime has corresponding independent identities and cache namespace. No shared Service Worker scope is introduced by this arrangement.

## Decision

**Compatibility Runtime Audit: PASS for preservation.**

This is not a retirement approval.

The compatibility runtime currently has a clear technical purpose:
1. preserve rollback capability;
2. preserve the old PWA identity;
3. preserve the old Service Worker/cache boundary;
4. retain a byte-close runtime counterpart to the canonical runtime.

## Next Gate

Before retirement:
1. controlled rollback rehearsal;
2. verify both runtime entry points locally;
3. verify Service Worker isolation;
4. verify manifest identity isolation;
5. verify canonical runtime remains the production/source-of-truth target;
6. record rollback results;
7. only then decide whether retirement is safe.

No runtime deletion is authorized by this document.
