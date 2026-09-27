# LITHOSITE Icon System V24.5

**Project:** MG1 / Lithosite Android  
**Version:** V24.5  
**Category:** UI / Icon System  
**Status:** Contract Draft — Phase 2  
**Last Updated:** 2026-09-17

## 1. Source of Truth

The official icon source is:

`mine-geologist/assets/icons/lithosite/`

The repository README defines this pack as **Lithosite Icon Pack V1.0 — Vector Native**, derived from the Lithosite master icon sheet. Each asset is an SVG containing vector geometry and no embedded PNG/base64 image. The pack contains 43 icons selected for the current Lithosite core UI. `duplicate.svg` is intentionally absent.

## 2. Runtime Rule

All new Lithosite UI icons must enter through one central icon adapter. Feature files must not introduce a second icon library for an action already covered by the official pack.

Temporary Lucide fallback is permitted only for functions that do not yet have an approved Lithosite asset mapping. Such fallbacks must be tracked in the migration table below.

## 3. Confirmed Mapping From Current Runtime

| Current runtime icon | Lithosite asset | Decision | Notes |
|---|---|---|---|
| `plus` | `add.svg` | MIGRATE | Direct semantic match |
| `info` | `info.svg` | MIGRATE | Direct semantic match |
| `layers` | `layers.svg` | MIGRATE | Direct semantic match |
| `map` | `map.svg` | MIGRATE | Direct semantic match |
| `map-pin` | `location.svg` | MIGRATE | Location/pin semantic family |
| `trash-2` | `delete.svg` | MIGRATE | Direct semantic match |
| `download` | `download.svg` | MIGRATE | Direct semantic match |
| `alert-triangle` | `warning.svg` | MIGRATE | Warning semantic family |
| `file-text` | `document.svg` | MIGRATE | Document semantic family |
| `ruler` | `measure.svg` | REVIEW | Verify whether `ruler.svg` is intended for measurement UI |
| `upload` | `import.svg` | REVIEW | Current actions are import/save-to-app flows; do not blindly rename asset semantics |
| `search` | — | REVIEW | Official pack asset availability must be confirmed from repository inventory |
| `save` | — | REVIEW | No confirmed official `save.svg` from the repository screenshot |
| `navigation` | — | REVIEW | GPS/navigation semantics need explicit asset decision |
| `shapes` | — | REVIEW | KML geometry/layer semantics need explicit asset decision |
| `minus` | — | KEEP TEMP | Map zoom control; no confirmed official equivalent |
| `x` | — | KEEP TEMP | Generic close control; not yet represented by confirmed Lithosite asset |
| `chevron-right` | — | KEEP TEMP | Structural navigation glyph, not an action icon |
| `user` | — | REVIEW | User/profile asset needs repository confirmation |
| `user-round` | — | REVIEW | User/profile asset needs repository confirmation |
| `circle-alert` | `warning.svg` | REVIEW | Could map to warning, but current UI meaning must be checked |
| `calendar-x` | `calendar.svg` | REVIEW | Current Cuti action is not a direct calendar-x asset |
| `clipboard-list` | — | KEEP TEMP | No confirmed official asset |
| `flask-conical` | — | KEEP TEMP | Domain-specific assay action; no confirmed official asset |
| `message-circle-more` | — | KEEP TEMP | Chat/message semantics need repository confirmation |
| `send` | — | KEEP TEMP | No confirmed official asset |
| `shield-alert` | `shield.svg` | REVIEW | Safety icon can use shield family; alert treatment should remain contextual |
| `check` | — | KEEP TEMP | Status glyph; avoid creating `check.svg` without master-sheet confirmation |
| `check-circle-2` | — | KEEP TEMP | Status glyph; same rule as above |
| `clock` | `clock.svg` | MIGRATE | Direct semantic match |
| `crosshair` | — | KEEP TEMP | Map targeting control; no confirmed official asset |
| `map-pin-off` | — | KEEP TEMP | No confirmed official asset |
| `log-in` | — | KEEP TEMP | Authentication action; no confirmed official asset |
| `eye` / `eye-off` | — | KEEP TEMP | Password visibility controls; not part of confirmed core mapping |
| `image-plus` | `image.svg` | REVIEW | `image.svg` exists; plus treatment must not be fabricated |

## 4. Size Contract

These are runtime presentation sizes, not intrinsic SVG dimensions.

| Token | CSS size | Intended use |
|---|---:|---|
| `icon-xs` | 16px | dense metadata / secondary controls |
| `icon-sm` | 18–20px | normal compact action |
| `icon-md` | 22–24px | standard UI action |
| `icon-lg` | 28–32px | prominent action / modal action |
| `icon-xl` | 40px+ | empty state / hero visual only |

Default target: **24px** for normal Lithosite action icons.

Do not use 42px or similarly oversized action icons merely because the original SVG has a larger intrinsic canvas.

## 5. Style Contract

1. Prefer official Lithosite SVG geometry.
2. Do not mix emoji, Unicode symbols, random inline SVGs, and a second icon library for the same action.
3. Do not alter official SVG geometry per screen.
4. Size is controlled by the adapter/container, not by editing the SVG files.
5. Color treatment must not distort the official asset. If an asset contains its own background/glyph colors, preserve them unless a future monochrome variant is explicitly approved.
6. Delete actions use `delete.svg`; the label/button treatment supplies the destructive color. Do not add a second trash glyph beside the same label.
7. Structural glyphs such as close/chevron may remain outside the core action pack until explicitly standardized.

## 6. Duplicate Action

`duplicate.svg` is intentionally absent from the official pack. Do not create a new duplicate SVG or silently substitute an unrelated icon.

The UI mapping for **Duplikat** remains `REVIEW` until an approved existing Lithosite asset is selected.

## 7. Migration Strategy

### Phase 1 — Adapter

Create one central `lithositeIcon()` adapter. Feature files continue to call `icon()` so the migration does not require mass edits.

### Phase 2 — Confirmed assets

Migrate only mappings marked `MIGRATE` after verifying the SVG path exists in the repository.

### Phase 3 — Review queue

Resolve all `REVIEW` items from the actual repository asset inventory and UI semantics.

### Phase 4 — Cleanup

Remove Lucide usage only after all direct `data-lucide` calls and fallback mappings have been migrated or explicitly exempted.

## 8. Acceptance Criteria

- One official Lithosite icon source.
- No duplicate icon implementation for the same action.
- Default action icon size is 24px.
- Modal action icons normally stay within 24–32px.
- No oversized A↓Z/sort icon regression.
- Delete action uses one delete icon only where an icon is intentionally required; the current Hapus confirmation design may remain text-only.
- Android and laptop use the same icon geometry and sizing contract.
- Console remains clean after migration.
- Existing V24.5 engine/runtime behavior is unchanged.
