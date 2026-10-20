# Graphic Bar Contract Audit

**Branch:** `v41-workspace`  
**Scope:** `ui/shared/graphicbar.js`, `ui/shared/graphicbar.css`, and the Material Movement - Last 7 Days chart only.  
**Status:** FROZEN for the current Material Movement implementation (2026-10-18). No further chart migration is authorized by this audit.

## 1. Current responsibility boundary

### Dashboard module owns
- Reading Operations data through the existing dashboard state and status context.
- Filtering validated operations and applying shift/date rules.
- Normalizing material names and calculating Ore, OB, Quarry, Top Soil, Retase, and classified-material totals.
- Choosing the dates to display and formatting displayed values.
- Passing already-prepared chart data to `LithositeGraphicBar.renderMaterialMovement()`.

### Shared Graphic Bar owns
- Creating bar-group elements and date-label elements from supplied data.
- Creating the legend rows and their separate name/value columns.
- Applying accessible labels to bars.
- Updating the provided total element.
- Clearing chart-owned DOM and CSS classes when explicitly requested.

### Shared CSS owns
- Generic bar primitives and the Material Movement presentation primitives.
- Bar-group layout, x-axis date-label row, axis baseline, and legend alignment.
- Keeping date labels inside the chart's available height and visible below the axis.

The shared controller must not read RuntimeAdapter/A3 data, query dashboard state, calculate production totals, or decide business filtering rules.

## 2. Public JavaScript interface to preserve

```js
LithositeGraphicBar.render(options)
LithositeGraphicBar.renderMaterialMovement(options)
LithositeGraphicBar.clear(target)
```

### `render(options)`
- Accepts `element` as an element ID or DOM element.
- Accepts `values` as numbers or objects with `value` and optional `label`.
- Renders proportional bars, uses zero for invalid/non-positive values, adds accessible labels, and returns `true` on success or `false` when the target is missing.

### `renderMaterialMovement(options)`
- Required targets: `element` and `legendElement`; both may be IDs or DOM elements.
- Input fields: `groups`, `maximum`, `legendItems`, optional `totalElement`, `totalText`, and `emptyMessage`.
- Each group uses `label` and `values`; each value may supply `value`, `label`, `className`, and `title`.
- Each legend item may supply `label`, `value`, `colorClass`, and `extraClass`.
- The controller renders supplied values only; it does not infer dates, materials, units, or totals.
- Missing required targets return `false`; a valid render returns `true`.
- Empty groups render a readable empty-state message and still update the legend/total targets.

### `clear(target)`
- Accepts an ID or DOM element.
- Clears chart-owned children and removes `graphic-bar` and `graphic-bar--material` classes.
- Returns `false` if the target is missing and `true` when cleared.

## 3. Visual and regression invariants

1. Date labels supplied in `groups[].label` remain visible below the x-axis baseline; they must not be clipped by the chart container or card boundary.
2. The plot area and the date-label row both fit inside the chart body below the panel header.
3. The right-side material summary/legend remains readable and does not overlap the plot or date labels.
4. Legend names and values remain in separate aligned columns; long values such as `Coming Soon` remain legible.
5. The four material colors remain consistent between bars and legend: Ore, OB, Quarry, and Top Soil. Retase and S/R retain their separate legend semantics.
6. Chart rendering is repeatable: subsequent calls replace prior chart and legend content rather than accumulating duplicate nodes.
7. Empty or zero-valued data must not produce invalid heights, NaN styles, or invisible/overlapping labels.
8. Existing card dimensions, dashboard layout, business calculations, and unrelated chart/UI behavior are out of scope.

## 4. CSS ownership finding

The current shared stylesheet includes both generic primitives and Material Movement-specific rules, including selectors scoped to `#dashboardScreen`. This is acceptable for the current two-chart scope, but it is **not yet a fully generic chart skin**. Do not migrate other charts or broaden the CSS API as part of this stabilization.

The dashboard stylesheet still owns the Material Movement summary placement (including `.chartnote`). The shared stylesheet owns the bar plot/date-label geometry. Keep these responsibilities explicit and avoid duplicate competing rules.

## 5. Cache-key and test policy

- When shared CSS changes, update the cache key in both the active Operations artifact and the version-history UI snapshot.
- Tests should verify the required asset is loaded and the two HTML artifacts remain consistent; avoid pinning a specific cache-key string in multiple unrelated assertions unless that exact version is the subject of the test.
- Do not bump cache keys or edit artifacts merely to make a brittle test pass when the actual contract has not changed.
- Validate locally with the full pytest suite and inspect the rendered chart at the real dashboard card size.

## 6. Audit findings and next steps

- **Resolved in the current baseline:** the Oct 1–3 date labels are visible below the x-axis after the latest CSS adjustments. The user's latest full-suite run after both shared chart assets were aligned reported `845 passed` in `109.84s`.
- **Regression risk:** the chart's height and label visibility depend on nested percentage heights and fixed 16px/18px offsets. Any future geometry change must verify the actual rendered card, not only CSS string assertions.
- **Regression risk:** cache-key assertions have repeatedly failed after legitimate asset-key changes. Consolidate these assertions around artifact consistency and required asset loading.
- **Boundary improvement for later:** the shared controller's Material Movement classes and CSS are still dashboard-specific. Do not refactor that boundary during this stabilization pass unless a test demonstrates a concrete defect.

### Freeze decision and validation record

- [x] Public API and dashboard/shared-controller responsibility boundary reviewed and documented.
- [x] Existing tests cover the Material Movement legend, data preparation boundaries, date-label CSS structure, asset loading, and active artifact cache key presence.
- [x] Active artifact and version-history snapshot use matching shared chart asset references after the latest fix.
- [x] Full suite passed: `845 passed in 109.84s` (user-reported local run, 2026-10-18).
- [x] User manually confirmed the Equipment Status and Material Movement cards look normal, including visible `Oct 1`, `Oct 2`, and `Oct 3` labels.

**Freeze boundary:** preserve `LithositeGraphicBar.render()`, `renderMaterialMovement()`, and `clear()` signatures and current Material Movement rendering. Do not refactor the dashboard-specific CSS, change geometry, or migrate other charts in this stabilization pass. The current test suite primarily checks source contracts and rendered UI was manually spot-checked; it is not a browser-driven geometry test. Reopen this audit only for a demonstrated defect or an explicitly approved scope change.


## 7. Approved scope extension — Rainfall history records (2026-10-18)

The original freeze remains in force for the Material Movement chart: its public methods, dashboard calculations, legend, date-label geometry, and rendering must not be changed as part of the Rainfall migration.

A separate `LithositeGraphicBar.renderRainfallRecords(options)` renderer is now added for the horizontal history bars in the Rainfall Simulation records view. The Hydrology panel remains responsible for reading `RainfallSimulation` through RuntimeAdapter, filtering invalid rows, sorting newest first, and limiting the display to 30 records. The shared renderer owns the row DOM, date/value labels, proportional fill, accessible track label, and empty state. The shared stylesheet owns the corresponding `.graphic-bar__record-*` styles; Hydrology CSS retains only the slide view and panel-specific behavior.

This is a narrow, explicitly approved scope extension, not authorization to migrate any additional charts.

### Rainfall records contract

- Hydrology owns the `RuntimeAdapter` request for `RainfallSimulation`, response validation, row filtering, newest-first sorting, and the 30-record display cap.
- The shared `renderRainfallRecords(options)` renderer owns record-row markup, scenario/date/value labels, proportional fill, accessible track labels, and the empty-state message.
- Shared styles are limited to the `.graphic-bar--rainfall-records` / `.graphic-bar__record-*` primitives. Hydrology CSS owns the slide-view shell, panel-specific behavior, and scrollbar presentation.
- Do not change the Rainfall Records layout, remove the current no-visible-scrollbar behavior, or alter the A3 read path as part of unrelated chart work.
- No other chart migration is authorized by this extension.

### Rainfall extension validation and freeze

- [x] Rainfall records render through `LithositeGraphicBar.renderRainfallRecords({element:recordsChart,rows:rows})`.
- [x] The records view reads saved `RainfallSimulation` data, filters invalid rows, sorts newest first, and limits display to 30 rows.
- [x] User visually confirmed the records view is back to normal and the scrollbar is no longer visible (2026-10-18).
- [x] User-reported full pytest suite passed: `846 passed in 110.60s` (2026-10-18), after the stylesheet cache-key test was made resilient.
- [x] Shared Graphic Bar cache references and active artifact/snapshot consistency are covered by the current tests.

**Final freeze boundary:** preserve the three current public render paths—`render()`, `renderMaterialMovement()`, and `renderRainfallRecords()`—plus `clear()`. Do not migrate additional charts, redesign the shared CSS, or change Equipment Status / Material Movement / Rainfall Records geometry without an explicit scope decision. Any future change must include targeted contract tests, active artifact and snapshot consistency, a full local pytest run, and visual confirmation at the real rendered size.
