# Operations module file map and extension guide

This document records the Operations module's feature ownership and the dedicated entry points for small supporting features. Keep each feature's caller, styling, and behavior in its own file where practical.

## Core Operations Graphics

| File | Responsibility | Loaded by |
|---|---|---|
| `operations.js` | Operations data/runtime flow, modal launch points, and page interactions | `Artifacts/Mine-Services-Operations.html` |
| `operations-graphics.js` | Operations Graphics data shaping, chart rendering, Unit Timeline, and Fleet Utilization calculation | `Artifacts/Mine-Services-Operations.html` |
| `operations.css` | Main Operations page and Operations Graphics layout styling | `Artifacts/Mine-Services-Operations.html` |

## Small modal support guide

| File | Responsibility | Loaded by |
|---|---|---|
| `modalsupport.js` | Delegated open/close actions for the compact Operations Graphics User Guide; Escape key closes it | `Artifacts/Mine-Services-Operations.html` |
| `modalsupport.css` | Only the compact User Guide modal's dimensions, content, and responsive styling | `Artifacts/Mine-Services-Operations.html` |
| `documentation.md` | This file map and the convention for registering future module features | Maintainer reference; not loaded by the browser |

### Why the guide uses delegated events

The guide markup is near the end of `Mine-Services-Operations.html`, after the page's JavaScript includes. A direct `getElementById(...).addEventListener(...)` during script startup can run before the guide button exists and silently skip binding. `modalsupport.js` listens on `document`, so clicks work even when the target markup is parsed later.

### Adding a future feature

For each new feature, follow these steps:

1. Create a feature-owned JavaScript file for behavior and a feature-owned CSS file for presentation when both are needed.
2. Give the files a clear, unique name under `ui/modules/operations/` (or the owning module folder).
3. Add explicit `<script src>` and/or `<link rel="stylesheet">` references in `Artifacts/Mine-Services-Operations.html`, with a cache-busting version key.
4. Keep the feature's responsibilities scoped to its owning module. Avoid putting unrelated feature behavior into a large shared module.
5. Add the feature, its files, dependencies, load order, and relevant test/verification steps to this document.
6. Add or update tests for behavior and asset-reference contracts when applicable. Run focused tests first, then the full `python -m pytest` suite.
7. Do not change the Dashboard or shared modal behavior unless the task explicitly requires it.

## Verification checklist

- [ ] The feature's CSS and JavaScript are referenced in the correct HTML artifact.
- [ ] JavaScript works when its target markup appears after the script include.
- [ ] Open, close, and Escape behavior are checked where relevant.
- [ ] No unrelated layout or data source has changed.
- [ ] Focused tests and the full test suite are run and their results recorded.

## Partnerships card and modal

| File | Responsibility | Loaded by |
|---|---|---|
| `partnerships.js` | Delegated open/close behavior for the optional Mitra Operasional Tambang modal; Escape and backdrop close are supported | `Artifacts/Mine-Services-Operations.html` |
| `partnerships.css` | Scoped styling for the compact card and its modal | `Artifacts/Mine-Services-Operations.html` |

Three compact partnership cards are intentionally available for the initial client slots: Partnership 1 inside the Material Movement card in Operations Graphics, and Partnership 2 and Partnership 3 inside Equipment Total Unit in Equipment Graphics. These are separate client entry points, not accidental duplicates; each trigger opens the same reusable partnership modal. Keep all three cards for now. Future client slots (Partnership 4, 5, and onward) may be added deliberately when needed, with client-specific branding/logos replacing the temporary Unicode handshake icon when assets are available. The modal presents partnership, vendor/supplier, and advertising opportunities. No contact email is fabricated; the modal explicitly notes that the official email has not yet been configured. The feature is opt-in and can be reused by adding `data-partnerships-open` to a selected trigger. It does not auto-attach to other modals.
