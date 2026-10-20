# Graphic Donut Contract Audit

**Branch:** `v41-workspace`  
**Scope:** Equipment Status donut only; `ui/shared/graphicdonut.js`, `ui/shared/graphicdonut.css`, dashboard markup, and the dashboard's equipment status renderer.  
**Status:** FROZEN for the current Equipment Status implementation (2026-10-18). User visual check confirmed and the latest full suite passed. Do not expand the migration beyond Equipment Status.

## 1. Current ownership

### Dashboard module owns
- Reading the existing `state.equipment` data.
- Counting Active, Inactive, Retired, and unclassified equipment statuses.
- Updating the total, status counts, and adjacent horizontal status bars.
- Supplying segment values and colors to `LithositeGraphicDonut.render()`.

### Shared controller currently owns
- Resolving a target element by ID or DOM element.
- Summing positive finite segment values and converting them to conic-gradient stops.
- Applying the gradient to the target, adding an accessible role/label, and storing the computed total in a data attribute.
- Optionally updating a separate total element.
- Clearing the gradient and controller-owned attributes.

### Shared CSS currently defines
- Generic `.graphic-donut*` primitives for the ring, hole, center, total, and label.

## 2. Findings

1. **The controller is already called by Equipment Status.** `dashboard.js` calls `LithositeGraphicDonut.render()` with Active, Inactive, Retired, and Other status segments. This audit should not introduce a second data path.
2. **Shared CSS is loaded but its named primitives are not used by the current markup.** The dashboard markup still uses `.donut`, `.dcenter`, `.dtotal`, and `.dlabel`. The shared CSS targets `.graphic-donut`, `.graphic-donut__hole`, `.graphic-donut__center`, `.graphic-donut__total`, and `.graphic-donut__label`.
3. **There are two sources of ring appearance.** Dashboard CSS still supplies a default `conic-gradient` and a pseudo-element hole via `.donut:after`; the controller overwrites the background inline. The shared CSS does not currently own the live dashboard ring's sizing or hole.
4. **Total text is dashboard-owned.** The center total is updated by `setText('dashboardEquipmentTotal', total)`; the controller's optional `totalElement` is not passed. Keep the total calculation and displayed value under dashboard ownership unless the contract is deliberately changed.
5. **Unclassified statuses are represented as a gray segment.** They are calculated as `max(0, total - active - inactive - retired)`. The adjacent legend currently shows a gray dot without a label or count; do not alter that presentation in this stabilization pass without an explicit requirement.
6. **Zero-value and invalid segment handling is mostly defensive.** The controller ignores non-finite/non-positive values for segment angles and falls back to `emptyColor` if the total is zero. It still sets `role="img"` and an accessible label.
7. **Clear is narrow by design.** `clear()` removes the inline background, aria-label, and total data attribute; it does not remove markup or CSS classes.

## 3. Proposed public interface to freeze

```js
LithositeGraphicDonut.render({
  element,       // required: DOM element or element ID
  segments,      // optional array of { value, color, label? }
  label,         // optional accessible name
  emptyColor,    // optional background when total is zero
  totalElement,  // optional separate DOM element or ID
  formatTotal    // optional total formatter
});

LithositeGraphicDonut.clear(target);
```

- `render()` returns `false` if the target is missing and `true` when applied.
- Segment values are visual proportions only; the controller does not read RuntimeAdapter/A3 or infer equipment status.
- Business counting, status classification, labels, and colors remain dashboard-owned.
- Re-rendering updates the inline gradient and attributes; it must not add or duplicate DOM nodes.
- `clear()` returns `false` for a missing target and `true` after clearing controller-owned inline state.

## 4. Non-goals for this audit

- Do not migrate any other donut or chart.
- Do not change Equipment Status counts, colors, card dimensions, or modal behavior.
- Do not redesign the adjacent status bars or add new legend rows.
- Do not change RuntimeAdapter/A3 data ownership.
- Do not refactor the live markup and CSS in the same step as documenting the contract.

## 5. Frozen contract and validation record

The public controller interface in Section 3 is frozen for this stabilization pass. Keep the existing dashboard markup and CSS ownership unchanged; the currently unused `.graphic-donut*` CSS primitives are documented as a follow-up cleanup, not a blocker and not permission to migrate markup now.

### User visual confirmation (2026-10-18)

The user confirmed that both dashboard cards look normal. Equipment Status showed total `8`, with Active `6`, Inactive `1`, Retired `1`, and the gray unclassified marker. Material Movement retained its three date labels (`Oct 1`, `Oct 2`, `Oct 3`). This is a visual spot-check only; it does not replace automated tests for zero equipment or repeated refresh.

### Validation record and limits

- [x] Regression checks cover the shared controller API, Equipment Status data ownership, asset loading, and active/snapshot cache-key consistency.
- [x] User visually confirmed the Equipment Status donut and Material Movement chart look normal on 2026-10-18.
- [x] Full pytest suite passed: `845 passed in 109.84s` (user-reported local run, 2026-10-18).

**Freeze boundary:** preserve `LithositeGraphicDonut.render()` and `clear()` signatures, existing dashboard DOM IDs, dashboard-owned status counts, colors, center total, and ring geometry. The shared `.graphic-donut*` primitives remain unused by the live markup and are explicitly deferred; do not migrate markup or consolidate duplicate ring styling in this pass. Zero-equipment and repeated-refresh cases have not been separately reported as manually checked, so do not claim those edge cases were visually validated. Reopen this audit only for a demonstrated defect or explicitly approved scope change.
