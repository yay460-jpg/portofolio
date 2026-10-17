# Refresh and First-Paint Visibility Contract

**Status:** Required shared UI contract for the active Desktop Master artifact.  
**Scope:** `v41-workspace`; this is not permission to modify `main`.

This contract groups the five related pieces that stopped the refresh regression. They must be reviewed and validated together. Do not delete or simplify an individual piece merely because the Python suite passes; the browser-visible behavior includes the first paint, before all JavaScript has initialized.

## The five required pieces

### 1. Early screen bootstrap in the HTML artifact

File: `Artifacts/Mine-Services-Operations.html`  
Element: `script#lithosite-initial-screen-bootstrap`

The inline script must remain in the document head, before `<body>`. It reads `sessionStorage['lithosite-active-screen']`, validates the saved name against the known screen map, hides the screens that are not selected, establishes the initial selected screen layout, and aligns the navigation item's first-paint treatment. This exists because `shell-navigation.js` runs later than the browser's initial HTML/CSS rendering.

Do not remove the script or move it below the body without a replacement that proves the same first-paint contract in a real browser.

### 2. Shell cleanup after normal navigation restoration

File: `ui/shared/shell-navigation.js`

The initialization sequence must first call `setScreen(readInitialScreen(), false)`. Only after that call has applied `hidden`, `aria-hidden`, `.active`, and the navigation state may it remove `#lithosite-initial-screen-guard` and the `data-lithosite-initial-screen` attribute.

Do not remove this cleanup block independently. The bootstrap styles are temporary and must hand control to the established shell navigation contract.

### 3. Versioned cache key for shell navigation

File: `Artifacts/Mine-Services-Operations.html`  
Current reference: `shell-navigation.js?v=20261017-first-paint-restore`

Keep a versioned asset reference. When the served navigation script changes, update the cache key and its matching assertion in `tests/test_screen_title_transition.py` in the same change. Do not revert to an older cache key while relying on the new initialization sequence.

### 4. Bootstrap regression test

File: `tests/test_release_readiness.py`  
Test: `test_active_artifact_restores_saved_screen_before_first_paint`

This test protects the source-level integration contract: bootstrap location before the body, stored screen lookup, hide/show rules, and cleanup after the shell restores the selected screen. It must remain beside the implementation so an accidental deletion or structural change is caught by CI.

This is a static contract test; it does not replace browser validation of visual timing.

### 5. Closed-modal first-paint fix

Files:
- `ui/shared/modal-shell-contract.css`
- `Artifacts/Mine-Services-Operations.html`
- `tests/test_release_readiness.py`

Keep the rule `.modalback:not(.show):not(.open){display:none!important}` so closed modal backdrops are hidden before `modal-show-contract.js` initializes. Keep the cache-busted stylesheet reference `modal-shell-contract.css?v=20261017-closed-modal-first-paint` and the regression test `test_closed_modals_are_hidden_before_modal_contract_initializes`.

This fix is distinct from screen selection but is part of the same observed refresh glitch: closed forms must not flash over the restored workspace during the initial paint.

## Change and validation rule

Any change to these five pieces must be done on the authorized workspace branch and reviewed as one contract. Before accepting it:

1. Run the targeted tests in `tests/test_release_readiness.py` and `tests/test_screen_title_transition.py`.
2. Run the full `python -m pytest -q` suite.
3. In the running Desktop Host, refresh from at least HSE and Reports using F5, Ctrl+F5, and Ctrl+Shift+R. Confirm the selected layout stays selected, the sidebar highlight agrees, no closed modal/form flashes, and no blank/default Dashboard appears.
4. Record the commit and results. A green pytest run alone does not prove the browser first-paint behavior.

**Do not remove any of the five pieces without a single-change experiment, targeted CI, and owner confirmation of browser behavior.** `main` remains reference-only unless separately approved.
