# Mine Services — CSS Audit & Cleanup Roadmap

**Status snapshot:** 2026-10-12  
**Branch:** `v40-workspace`  
**Latest validated workspace commit:** `aa7e8809` (Checker CSS contract baseline restored)  
**Latest Full Pytest:** [#344 — PASS](https://github.com/yay460-jpg/portofolio/actions/runs/38171599304) on `aa7e8809`  
**Latest validated UI code commit:** `25717ec8` (Dashboard Issues column fit; Full Pytest #331 — PASS)  
**Scope:** 26 CSS files under `lithosite-Mine-Services/ui/`

## 1. Counting rule — do not mix files, findings, and audit packages

These are three different counters:

| Counter | Current value | Meaning |
|---|---:|---|
| Stylesheet inventory | 26 / 26 | All CSS files have a recorded static, dynamic, or compatibility/test ownership classification. |
| Confirmed cleanup items completed | 32 / 32 | Cleanup items listed in Section 2 are applied in the current code and covered by passing full-suite baseline Full Pytest #264. |
| Remaining cross-check packages | 0 unclassified | All 16 top-level packages have a recorded decision. R16 has one unresolved ownership follow-up: the unlinked Checker stylesheet is still referenced by legacy CSS contract tests. |
| Open ownership follow-ups | 1 | Checker CSS test-contract migration must be decided before `checker.css` can be removed safely. |\n| Remaining confirmed fixes | **Not yet known** | A package may produce zero, one, or several valid fixes. Do not treat audit packages as bugs. |

The first-pass scanner surfaces repeated selectors, but repeated selectors are not defects by themselves. A repeated declaration may be an intentional media-query override, state modifier, animation/reduced-motion rule, module-specific geometry, or an ownership boundary. No cleanup should be performed until the rule context and cascade are checked.

## 2. Confirmed cleanup register — completed

All items below are part of the passing code baseline. Their goal is to remove proven repetition without changing the owning feature's behavior.

| ID | Area | Completed cleanup | Verification guard |
|---|---|---|---|
| C01 | Global Delete Confirmation | Removed local title typography duplicated by the shared modal shell. | Shared shell remains the title typography owner. |
| C02 | Global Delete Confirmation | Removed duplicate base footer layout. | Shared shell owns base footer layout; responsive footer wrap remains local. |
| C03 | Global Delete Confirmation | Removed local button geometry duplicated by shared button CSS. | Shared `.control` geometry remains present. |
| C04 | Global Delete Confirmation | Removed repeated font sizing from warning `strong` and paragraph text. | Parent warning owns font size; paragraph margin and line-height remain. |
| C05 | Global Delete Confirmation | Removed repeated font size from the main delete message. | Message inherits `.modalbody` typography; margin and color remain local. |
| C06 | Global Delete Confirmation | Reused shared `.control.danger` styling instead of repeating danger colors and border. | Button classes and action handler remain intact. |
| C07 | Global Delete Confirmation | Delegated duplicate max-width/max-height bounds to the shared modal shell. | Dialog-specific 665px width remains; shell owns viewport limits. |
| C08 | Target Plan | Removed duplicate modal title typography. | Shared modal shell owns base title typography. |
| C09 | Target Plan | Removed duplicate footer `gap:8px`. | Shared shell owns base gap; small-screen wrapping remains. |
| C10 | Target Plan | Removed local Clear button geometry. | Shared Clear contract owns dimensions; filter grid and handler remain. |
| C11 | Global Capacity | Removed duplicate modal title typography. | Shared modal shell owns base title typography. |
| C12 | Global Capacity | Removed duplicate `gap:6px` from the first `.controls` rule. | Margin remains in the first rule; flex layout owns the single gap declaration. |
| C13 | Shared Buttons | Simplified `.control.mini` to override only its font size. | Base height, padding, and radius come from `.control`. |
| C14 | Global Delete Confirmation | Removed local `font-size:10px` after the modal controls use the shared `.control.mini` variant. | All three modal buttons retain both `control` and `mini` classes. |
| C15 | Dashboard | Moved effective header typography weight `650` into the base `.tablegrid.head` rule and removed the later duplicate weight override. | Regression test verifies one effective weight declaration and preserves expanded-table display state. |
| C16 | Dashboard | Moved effective pill typography weight `700` into the base `.pill` rule and removed the later duplicate weight override. | Regression test verifies the effective weight and retains critical/high/medium/open status color variants. |
| C17 | Data Management | Removed an identical #stage15DataModal .dm-card viewport rule from @media (max-width:1100px). | Base already owned width:750px and max-width:calc(100vw - 108px); sidebar-expanded sizing and the distinct max-width:900px override remain. Full Pytest #247 PASS after making the whitespace assertion robust. |
| C18 | Reports — core layout | Removed an ineffective mobile .report-body single-column override that was overwritten later in source order. | The effective max-width:900px rule containing one-column layout, scroll, and panel minimum height remains. Full Pytest #249 PASS. |
| C19 | Reports — KPI summary | Removed the overridden max-width:1400px three-column summary rule. | The later base rule owns six columns and the active max-width:1200px override owns two columns; Full Pytest #250 PASS. |
| C20 | Reports — Equipment KPI list | Removed the older base list rule that duplicated/was fully overridden by later list layout rules. | Final flex direction, gap, padding and visibility are defined by the final list rule; independent scroll viewport remains on `.equipment-kpi-scroll`. Full Pytest #252 PASS. |
| C21 | Reports — Equipment KPI list | Removed the obsolete padding/overflow/max-height rule for the list. | Later list rules set `max-height:none`, final padding, and `overflow:visible`; scroll remains owned by the wrapper. Full Pytest #252 PASS. |
| C22 | Reports — Equipment KPI detail | Consolidated the final `margin-top:5px` into the base detail rule and removed the later one-property override. | Effective spacing unchanged; Full Pytest #252 PASS. |
| C23 | Reports — KPI history | Consolidated final `padding:3px 0` and `font-size:7px` into the base history-row rule. | Effective typography/spacing unchanged; Full Pytest #252 PASS. |
| C24 | Reports — KPI event | Consolidated final desktop column widths and padding into the base rule; removed the later duplicate and an ineffective mobile one-column rule. | Effective cascade unchanged; regression test confirms one base rule remains. Full Pytest #252 PASS. |
| C25 | Reports — filter grid | Removed the inactive initial template and obsolete desktop/1200px column rules; one base desktop grid now owns 300px + three 145px tracks + actions. | Active ≤1200px and ≤900px overrides remain; Full Pytest #254 PASS. |
| C26 | Reports — legacy Report Center | Removed 25 style rules/declarations for old Report Center markup absent from the active HTML and runtime JS. | Preserved active `.report-filter-actions`, `.report-filter-buttons`, notice/status, and preview KPI mobile styling. Full Pytest #255 PASS. |
| C27 | Reports — progress bars | Removed unscoped `.report-bar` and `.report-bar i` declarations already superseded by the active `#reportsScreen` rules. | Effective 7px bar height, track colors, fill gradient, and runtime-created bars remain; Full Pytest #257 PASS. |
| C28 | Reports — preview legacy styles | Removed unused `.report-preview-section` and `.report-preview-source` styles absent from active HTML/JS. | Kept live `.report-preview-block`, preview tables/body, and PDF reader close/reduced-motion contract; Full Pytest #257 PASS. |
| C29 | Global Capacity | Merged split `#capacityModal .tablehead` declarations into one rule. | Effective `height:38px`, `padding:0 11px`, and `justify-content:flex-end` retained; Full Pytest #259 PASS. |
| C30 | Global Capacity | Merged split `#capacityModal .controls` declarations into one rule. | Effective flex layout, center alignment, `gap:6px`, and `margin-bottom:10px` retained; Full Pytest #259 PASS. |
| C31 | Map Engine — Topo3D toolbar | Removed an ineffective `right:10px` declaration under `max-width:900px` while the toolbar remains `position:static`. | Kept the responsive `topo3d-status` width override and all absolute offsets belonging to actual map overlays; Full Pytest #262 PASS. |
| C32 | Map Engine — Marker location panel | Removed the duplicate `width:300px` declaration from the `max-width:900px` rule; the base panel rule remains the width owner. | Preserved mobile `right:6px` positioning; regression test confirms base width and absence of duplicate mobile width; Full Pytest #264 PASS. |

## 3. Remaining audit roadmap — 16 cross-check packages

Every package must end in one of three states: **FIX** (a proven redundant declaration is patched with a regression test), **KEEP** (the repeated selector is intentional), or **PASS** (no actionable duplicate found). A package is not counted as a cleanup unless a real fix is made.

| Package | Files / selectors to cross-check | Initial hypothesis only | Required decision |
|---|---|---|---|
| R01 | `checker.css`: `.boundary`, `.filters` | **KEEP — cross-check complete.** `.boundary` changes padding from 20px to 18px at `max-width:1400px`; `.filters` drops the trailing `auto` column and adds `row-gap:10px` at the same breakpoint. Both are intentional responsive adaptations. | No CSS patch. Evidence: the two base declarations and their overrides are grouped in `@media(max-width:1400px)` at the end of `checker.css`; the filter grid changes column count behavior for narrower screens. |
| R02 | `equipment.css`: `.boundary`, `.filters` | **KEEP — cross-check complete.** At `max-width:1400px`, boundary padding intentionally reduces from 20px to 18px; filter columns switch from the module's seven-track template to four equal tracks and add `row-gap:10px`. | Both overrides are within the same responsive media query and change the narrow-layout behavior; removing them would regress the responsive layout. No CSS patch. |
| R03 | `issues.css`: `.boundary`, `.filters` | **KEEP — cross-check complete.** At `max-width:1400px`, boundary padding intentionally reduces from 20px to 18px; the filter grid changes from `1.1fr + five flexible columns + auto` to four equal columns and adds `row-gap:10px`. | Both changes are explicit narrow-screen adjustments in one media query. No CSS patch; retain responsive filter usability. |
| R04 | `operations.css`: `.boundary`, `.filters`, timeline summary columns | **KEEP — cross-check complete.** Screen boundary padding and filter columns adapt at `max-width:1400px`; Timeline summary columns step from six to three at `max-width:900px`, then two at `max-width:560px`. | Every repeated selector is attached to a responsive breakpoint and changes layout intentionally. No CSS patch; preserve desktop density and tablet/mobile fit. |
| R05 | `dashboard.css`: table body, table-grid header, pill, chart bar/value and chart key | **FIX — cross-check complete.** Consolidated `font-weight:650` for `.tablegrid.head` and `font-weight:700` for `.pill` into their base rules; removed the later typography override block. | Full Pytest #244 PASS on commit `5c63884b`; regression test protects final weights, expanded-table display state, and reduced-motion behavior. Other state/animation repetitions remain protected. |
| R06 | `data-management.css`: `.dm-card` and keyframe `from/to` rules | **FIX — cross-check complete.** Removed only the identical max-width:1100px .dm-card sizing block. | Full Pytest #247 PASS on commit a33bc1eb; sidebar-expanded bound, max-width:900px bound, slide in/out keyframes and reduced-motion behavior remain. |
| R07 | `reports.css`: layout, KPI, controls, preview and reader | **FIX — complete.** All five subpackages reviewed; four focused cleanups and one legacy-style pruning pass validated. | Full Pytest #249, #250, #252, #254, #255, and #257 PASS across the affected code commits; responsive rules and PDF reader motion/reduced-motion behavior preserved. |
| R08 | `plans.css`: delete confirmation body and note | **KEEP — cross-check complete.** Body gap/padding, footer wrapping/height/overflow, and note flex-basis changes are all scoped to `@media(max-width:620px)`. | Intentional mobile adaptation; no CSS patch. Existing tests protect the responsive footer/note behavior. |
| R09 | `global-capacity.css`: `.tablehead` and `.controls` | **FIX — cross-check complete.** Merged split `.tablehead` height/padding/alignment and `.controls` flex/gap/margin into one rule each. | Effective values/order unchanged; Full Pytest #259 PASS on `a8691eb1`. |
| R10 | `map-engine.css`: Topo3D toolbar and status width/position | **FIX — cross-check complete.** Removed `right:10px` from the `max-width:900px` rule for `.topo3d-toolbar` because its owning rule uses `position:static`, so the offset had no effect. | Toolbar flow remains unchanged; the Topo3D status `max-width:55%` mobile override is retained. Full Pytest #262 PASS on `21415172`. |
| R11 | `marker-location.css`: marker base, focus-blink state, panel position/width, field labels | **FIX — cross-check complete.** Removed the duplicate mobile panel width while retaining the base `width:300px` and mobile `right:6px`. | Full Pytest #264 PASS on `26375cae`; marker panel width ownership and mobile positioning are covered by a regression assertion. |
| R12 | `evidence.css`: evidence layout columns and PDF viewport height | **KEEP — cross-check complete.** The two-column evidence layout switches to one column at `max-width:900px`; PDF preview height changes from `52vh` to `42vh` at that breakpoint while retaining `min-height:300px` and flex sizing. These are intentional responsive viewport adjustments, not duplicate declarations in the same context. | No CSS patch. Keep desktop/mobile layout and PDF preview sizing intact; inspected `ui/shared/evidence/evidence.css` and the shared Evidence viewer implementation. |
| R13 | `app-info.css`: launcher transition and keyframes | **KEEP — cross-check complete.** The launcher hover transition, its `prefers-reduced-motion` transition override, modal `appInfoFadeIn`/`appInfoFadeOut` keyframes, and the reduced-motion animation override serve separate interaction/accessibility contracts. The two keyframes are distinct, not duplicate definitions. | No CSS patch. Preserve selective fade behavior and reduced-motion handling. |
| R14 | `user-guide.css`: launchers/items, reader modal/dialog sizes, reduced-motion behavior | Base/mobile/reduced-motion rules are mixed. | Verify each override's at-rule and preserve keyboard/mobile reader behavior. |
| R15 | `screen-header.css` and `modal-shell-contract.css`: title size and short-viewport header/footer rules | **KEEP — cross-check complete.** Shared `.title h1` typography has a deliberate `max-width:1400px` reduction from 21px to 20px. Module `.head` heights remain module-owned geometry. The modal shell's `max-height:560px` rules intentionally reduce header/footer dimensions and adapt shell max-height; these are not duplicates of the default rules. The reduced-motion rule does not duplicate any animation because this contract defines no keyframes or animation declarations. | No CSS patch. Existing `test_shared_screen_header_css.py` and `test_shared_modal_geometry_css.py` guard shared ownership and short-viewport behavior. |
| R16 | Shared ownership/order pass: shared contracts, module link order, and unlinked stylesheet ownership | **KEEP — shared contract ownership is sound; Checker stylesheet disposition remains HOLD.** The active artifact loads 24 static stylesheets in intentional order. `checker.css` is not loaded and no `#checkerScreen` / `#checkerModal` markup exists in the artifact, but legacy CSS contract tests still read its declarations. `checker.js` remains loaded as the `LithositeCheckerSupport` data/evidence integration and is not proof that the old Checker screen CSS is active. | No app CSS patch. Preserve the file until its legacy test contracts are deliberately migrated or retired. Record one open ownership follow-up; do not describe R16 as fully closed. |

### R07 Reports subpackages — internal work plan

These subpackages roll up into top-level package R07 and do not change the top-level remaining-package counter. Each will end with a recorded FIX / KEEP / PASS decision before R07 can close.

| Subpackage | Scope | Initial review boundary | Status |
|---|---|---|---|
| R07-A | Core layout & filters | #reportsScreen, .boundary, .report-body, .report-summary, filter grid, responsive breakpoints | FIX — complete |
| R07-B | KPI summary & cards | .kpi-summary, .kpi-summary-card, .report-kpi-status and summary value typography | FIX — complete |
| R07-C | Equipment KPI details & history | .equipment-kpi-row, .equipment-kpi-detail, .kpi-event, .kpi-history-row, list/scroll containers | FIX — complete |
| R07-D | Report Center controls | .report-center-head, controls, actions, filter action/status/notice, desktop/mobile header variants | FIX — complete |
| R07-E | Preview & reader panels | .report-preview-*, preview tables, PDF reader close-motion and reduced-motion rule | FIX — complete |

### Package completion log

| Package | Status | Evidence / note |
|---|---|---|
| R01 | **KEEP — complete** | Checker boundary/filter declarations are intentional `max-width:1400px` responsive overrides; no redundant cleanup warranted. |
| R02 | **KEEP — complete** | Equipment boundary padding and filter grid change only at `max-width:1400px`; both are intentional responsive overrides. |
| R03 | **KEEP — complete** | Issues boundary padding and filter grid switch only at `max-width:1400px`; both are intentional responsive overrides. |
| R04 | **KEEP — complete** | Operations boundary/filter overrides and Timeline summary 6/3/2-column variants are explicitly responsive. |
| R05 | **FIX — complete** | Dashboard typography weights consolidated; Full Pytest #244 PASS. Expanded-table state and reduced-motion rules retained. |
| R06 | **FIX — complete** | Duplicate .dm-card max-width/width rule removed; Full Pytest #247 PASS. |
| R07-A | FIX — complete | Ineffective Reports mobile body-grid override removed; Full Pytest #249 PASS on 73a57f76. Final responsive grid, scroll, and panel-height rules remain. |
| R07-B | FIX — complete | Ineffective Reports KPI-summary 1400px three-column rule removed; Full Pytest #250 PASS on d16d7971. Six-column base and 1200px two-column override remain. |
| R07-C | FIX — complete | Removed two stale equipment-kpi-list rules, consolidated detail/history styles, and reduced kpi-event to one effective base rule; Full Pytest #252 PASS on 08762920. The wrapper keeps scroll behavior. |
| R07-D | FIX — complete | Consolidated Reports filter grid ownership and removed unreferenced legacy Report Center styles; Full Pytest #254 and #255 PASS. Active search/action/filter and preview controls remain. |
| R07-E | FIX — complete | Removed unscoped bar styles and unused preview section/source styles; Full Pytest #257 PASS on 02c2557e. Live preview block/table and PDF reader motion remain. |
| R07 | **FIX — complete** | R07-A through R07-E are all closed. Reports cascade review completed with Full Pytest #257 PASS. |
| R08 | **KEEP — complete** | Plans delete-confirm body/footer/note changes are intentional `max-width:620px` responsive overrides. |
| R09 | **FIX — complete** | Global Capacity `.tablehead` and `.controls` selector ownership consolidated; Full Pytest #259 PASS. |
| R10 | **FIX — complete** | Removed ineffective static toolbar offset; preserved status width responsiveness. Full Pytest #262 PASS. |
| R11 | **FIX — complete** | Removed duplicate mobile marker-panel width; base width remains the owner and mobile right offset remains. Full Pytest #264 PASS. |
| R12 | **KEEP — complete** | Evidence layout and PDF preview height changes are intentionally responsive at `max-width:900px`; no CSS patch. |
| R13 | **KEEP — complete** | Launcher transitions, separate modal fade-in/fade-out keyframes, and reduced-motion overrides are intentional; no CSS patch. |
| R14 | **KEEP — complete** | User Guide launcher and reader declarations serve distinct purposes: launcher/item hover transitions, focus-visible state, reduced-motion overrides, reader-specific sizing, Reports-shell containment, and the mobile shell-safe geometry. Repeated `.user-guide-item` blocks split semantic base styles from button reset; not duplicate behavior. | Inspected `ui/shared/user-guide.css` alongside shared button contract. No CSS patch; preserve reader viewport, iframe fill, keyboard focus, and reduced-motion behavior. |
| R15 | **KEEP — complete** | Shared title breakpoint and modal short-viewport header/footer overrides are intentional; existing screen-header and modal-geometry regression tests cover the ownership and geometry. No CSS patch. |
| R16 | **PARTIAL — HOLD follow-up** | Shared ownership and static stylesheet order are reviewed. `checker.css` is not loaded by the active artifact and its screen markup is absent, but legacy CSS tests in eight test files still read its rules. `checker.js` remains active for the `LithositeCheckerSupport` integration. Keep the stylesheet until test contracts are migrated/retired in a dedicated change. `app-info.css` remains dynamically injected by `shell-navigation.js`. |

## 4. Complete stylesheet inventory — 26 files

### Module stylesheets (14)

1. `ui/modules/checker/checker.css`
2. `ui/modules/dashboard/dashboard.css`
3. `ui/modules/data-management/data-management.css`
4. `ui/modules/equipment/equipment.css`
5. `ui/modules/hse/hse.css`
6. `ui/modules/issues/issues.css`
7. `ui/modules/maintenance/maintenance.css`
8. `ui/modules/map-engine/map-engine.css`
9. `ui/modules/map-engine/marker-location.css`
10. `ui/modules/operations/operations.css`
11. `ui/modules/plans/plans.css`
12. `ui/modules/reports/reports.css`
13. `ui/modules/workfront/global-capacity.css`
14. `ui/modules/workfront/workfront.css`

### Shared stylesheets (12)

15. `ui/shared/app-info.css`
16. `ui/shared/button.css`
17. `ui/shared/delete-confirm-contract.css`
18. `ui/shared/evidence/evidence.css`
19. `ui/shared/form-field.css`
20. `ui/shared/interactive-feedback.css`
21. `ui/shared/modal-shell-contract.css`
22. `ui/shared/screen-header.css`
23. `ui/shared/screen-transition.css`
24. `ui/shared/table.css`
25. `ui/shared/toast.css`
26. `ui/shared/user-guide.css`

## 5. Execution order and release gates

1. Work through R01–R06, one package at a time; assign FIX or KEEP with a short evidence note.
2. Split R07 Reports into small subpackages because it has the densest cascade and responsive behavior.
3. Work through R08–R15. Responsive, animation, focus, disabled, modal, map-marker, and reader behavior must not be simplified without context.
4. Complete R16: check CSS ownership and link order across the active HTML artifact.
5. Run the full pytest suite on the final code/documentation state. Review relevant visual behavior only for changed areas; do not repeat already-PASS checks without a change or regression.
6. Publish final counts: confirmed cleanup fixes, packages marked KEEP/PASS, any fixes still open, and full-suite result.

## 6. Definition of done

The audit is complete only when all 16 packages have an explicit FIX / KEEP / PASS decision, all actual fixes have regression tests, the active artifact cache keys and load order agree, and the final full test suite is green.

## 7. Final audit closure

**Status: COMPLETE — Full Pytest #276 PASS.**

- Branch: `v40-workspace`
- Validated audit commit: `e872557f5cfeffb64ea851ae046717ad0f44ca22`
- Workflow: [Mine Services Full Pytest #276](https://github.com/yay460-jpg/portofolio/actions/runs/38160970498)
- Stylesheets inventoried: 26 of 26
- Top-level packages decided: 16 of 16
- Confirmed cleanup fixes: 32
- Packages classified KEEP: R01–R04, R08, R12–R16 (R16 has one HOLD follow-up)
- Packages classified FIX: R05–R07, R09–R11
- Unclassified audit packages: 0\n- Open ownership follow-ups: 1 (Checker CSS test-contract migration)
- Additional cleanup confirmed in R12–R16: 0
- Remaining cleanup count outside the reviewed scope: not inferred; future findings require evidence and a new audit entry.

R07 is closed through subpackages R07-A–R07-E. R12–R16 have recorded decisions; however, R16 now carries one explicit HOLD follow-up for Checker stylesheet/test ownership. The 32 count represents confirmed cleanup fixes, not an estimate of all possible duplication across the repository.

This closure originally recorded the successful #276 validation of the completed audit state. A post-closure visual follow-up was then raised for the Maintenance table's View action, which appeared wider than the Operations reference. The follow-up is documented below; it does not reopen R01–R16 or change the 32 confirmed cleanup-fix count.

### Post-closure visual follow-up — Maintenance View action

- Scope: `ui/modules/maintenance/maintenance.css`, the stylesheet cache key in `Artifacts/Mine-Services-Operations.html`, and the related regression tests.
- Fix: added one scoped rule for `#maintenanceScreen .row-actions .control.view` to constrain the Maintenance register action to 42 px width and 30 px height. Operations and timeline-modal button rules were left intact.
- Cross-check: the scoped selector appears once; the existing timeline-modal `.mini` rule remains a separate owner; no broad shared button rule was replaced.
- Cache key: updated to `20261012-compact-view`; the stale cache-key expectation in `test_css_duplicate_rules.py` was updated to match.
- Regression coverage: `tests/test_maintenance_view_button_geometry.py` checks dimensions, scope, uniqueness, and cache-key synchronization.
- GitHub validation: [Full Pytest #281 — PASS](https://github.com/yay460-jpg/portofolio/actions/runs/38161546589), commit `b770bea7c44b34b8bb60535bbc2f7f9f0026e837`.
- Local validation: `python -m pytest -q` — **545 passed in 54.91s** on the same pulled commit, as reported by the workspace owner.
- Visual evidence: user-provided screenshot after pulling `b770bea7` shows the Maintenance View buttons at the intended compact width, consistent with the Operations reference.

This follow-up is validated on code commit `b770bea7`. The roadmap record itself is updated after that validation; the workflow for the documentation-only update must pass before that newer documentation commit is considered the latest fully validated state.


## 8. Post-audit Report Preview follow-up — 2026-10-12

**Status: CLOSED — CSS ownership cross-check PASS, visual layout PASS, and mouse-wheel behavior manually confirmed by the workspace owner.**

- Branch: `v40-workspace`
- Code baseline: `244a7ae5c067b44d65d7ab6ef598658aa8146a9b`
- Full-suite evidence: [Mine Services Full Pytest #316 — PASS](https://github.com/yay460-jpg/portofolio/actions/runs/38164889673)
- The Report Preview modal remains bounded by `#reportsScreen #reportPreviewModal` with `inset:64px 0 34px`; the dialog retains `width:min(720px,calc(100vw - 48px))`, `max-height:calc(100% - 24px)`, and `overflow:hidden`. The modal/header/footer geometry was not changed in the scrollbar follow-up.
- The close header remains a non-shrinking row (`flex:0 0 auto;min-height:44px`). The body is the sole vertical content scroller (`overflow:auto;overscroll-behavior:contain`) and its visual scrollbar is hidden using Firefox `scrollbar-width:none` plus the Chromium/WebKit scrollbar pseudo-element. Wheel scrolling remains supported by retaining `overflow:auto`.
- The Equipment Performance table's `table-layout:fixed;width:100%;min-width:0` rule is intentionally more specific than the generic preview-table `min-width:760px` rule. This is a scoped override, not a duplicate to delete. Ten column tracks remain explicit and the user screenshot shows the table fitting without a horizontal scrollbar.
- Cross-file check: the active HTML has one Reports stylesheet cache key, `reports.css?v=20261012-preview-wheel-scroll`; the Report Preview geometry test checks the modal, body-scroll and scrollbar rules, table geometry, and cache key. Related CSS duplicate and report-reader/stage integration tests reference the same active cache key.
- No additional cleanup item is counted: this was a UI/scroll behavior follow-up, not removal of a confirmed redundant declaration. The confirmed cleanup counter therefore remains **32** and the top-level audit package counter remains **16 / 16 decided**.
- Manual validation completed by the workspace owner after pulling `244a7ae5`: mouse-wheel scrolling works; the extra vertical scrollbar is not visible; the Close header remains visible; modal dimensions remain unchanged; the shell footer remains unobstructed; all 10 Equipment Performance columns and 8 KPI rows are visible.
- Local full-suite evidence on the same code baseline: `python -m pytest -q` — **548 passed in 57.65s**.
- Documentation CI evidence: [Full Pytest #317 — PASS](https://github.com/yay460-jpg/portofolio/actions/runs/38165414056), documentation commit `7cac6d8`.
- Closure decision: Report Preview scrollbar and Equipment Performance layout follow-up is **CLOSED**. No extra cleanup fix is counted; confirmed cleanup remains **32**, and top-level audit package decisions remain **16 / 16**.


## 9. Work Control dashboard date columns — 2026-10-12

**Status: CLOSED — visual PASS, regression coverage PASS, and Full Pytest PASS.**

- Scope is limited to the dashboard `Recent Operations` and `Issues & Alerts` tables; Site Map, KPI cards, panel dimensions, shell geometry, and other module behavior are intentionally untouched.
- Recent Operations now shows `Date | Time | Activity | Work Front | Equipment | Qty`, using the source `transaction_date` field.
- Issues & Alerts now shows `Date | Priority | Issue | Status`, using the source `issue_date` field. No current-date fallback is synthesized for missing source dates.
- The dashboard grid tracks were adjusted for the additional columns. The issue table keeps a compact four-column grid and its existing status-pill alignment.
- Regression coverage added in `tests/test_dashboard_date_columns.py`; existing dashboard typography test cache expectation was synchronized. HTML stylesheet/script cache keys are both `20261012-date-columns`.
- Full-suite evidence: [Full Pytest #326 — PASS](https://github.com/yay460-jpg/portofolio/actions/runs/38166933289), commit `a94e7455`. The workspace owner's screenshots confirmed both tables show source dates; Recent Operations remains readable after adding Date, and the subsequent Issues fit follow-up is separately closed below with its own CSS ownership and CI evidence.
- This is a targeted UI enhancement, not a CSS cleanup deletion. Do not increment the confirmed cleanup counter or reopen any of the 16 decided audit packages.


### Dashboard Issues & Alerts column fit follow-up — 2026-10-12

**Status: CLOSED — visual PASS, CSS cross-file ownership PASS, Full Pytest CI PASS.**

- Scope is limited to `#dashboardScreen .tablegrid.issue` in `ui/modules/dashboard/dashboard.css`; Recent Operations grid and dashboard panel geometry remain unchanged.
- Reduced the Status grid track from 82px to 58px. The 52px status pill remains fixed-width, leaving 6px of track allowance instead of 30px and returning 24px to the Issue column. The workspace owner's latest screenshot confirms the Issue text is fully visible and the Status pill remains intact.
- Removed the redundant issue-row grid declaration and the later `!important` grid override. Cross-file inspection confirms exactly one authoritative issue-grid track declaration; the stale 82px track and `!important` override are absent. The two remaining last-child rules only align/size the status pill and are not duplicate grid owners.
- Updated the active stylesheet cache key in `Artifacts/Mine-Services-Operations.html` to `20261012-issues-alerts-fit` exactly once. The dashboard JS cache key remains `20261012-date-columns` exactly once because JS did not change. `tests/test_dashboard_date_columns.py` and `tests/test_css_duplicate_rules.py` reference the active CSS key.
- Regression coverage checks the 58px status track, uniqueness of the authoritative grid declaration, removal of the stale 82px track/override, and cache-key synchronization.
- CI evidence: [Full Pytest #331 — PASS](https://github.com/yay460-jpg/portofolio/actions/runs/38167663019), commit `25717ec8`. The workflow's full test suite completed successfully.
- Visual evidence: latest workspace screenshot confirms `Recent Operations` remains readable and unchanged, while `Issues & Alerts` shows the complete issue text with a compact Status column and no previous right-side gap.
- No cleanup counter increment: this is a targeted layout refinement, not a confirmed duplicate-declaration deletion. Confirmed cleanup remains 32 and top-level audit decisions remain 16/16.


### Dashboard chart and expanded-table cascade cross-check — 2026-10-12

**Decision: KEEP — static cross-file review complete; no CSS patch warranted.**

- Reviewed `ui/modules/dashboard/dashboard.css` with the active dashboard markup in `Artifacts/Mine-Services-Operations.html` and the chart updater in `ui/modules/dashboard/dashboard.js`.
- The two `.chartkey` declarations own different properties (base text color versus flex row layout); they are not duplicate declarations. The later `.bars` rule intentionally removes the native bottom border because `#dashboardMaterialBars::after` draws the x-axis baseline above the date labels. The later `.chartnote{top:40%}` intentionally supersedes the earlier base position to keep the material legend clear of the panel edge.
- The expanded-table state intentionally changes `.bottom` from a 36px collapsed strip to an absolutely positioned 154px overlay and reveals `.tablebody`/headers. Repeated grid values in that state preserve the same two-panel geometry; do not remove them without a computed-style/browser regression showing they are unnecessary.
- `prefers-reduced-motion:reduce` explicitly neutralizes transforms/opacity for dashboard visual elements; the hover transform on map tools is a separate interaction state. Preserve these motion/accessibility contracts.
- Cross-file cache check: active dashboard CSS key is `20261012-issues-alerts-fit`; dashboard JS key is `20261012-date-columns`. No source file changed during this review, so no cache-key bump is needed.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32**; the original 16 top-level audit packages remain decided. Run Full Pytest after this roadmap-only entry before treating the new documentation state as validated.


### Dashboard main grid and panel geometry cross-check — 2026-10-12

**Decision: KEEP — targeted CSS ownership review complete; no layout patch warranted.**

- Cross-checked `ui/modules/dashboard/dashboard.css` against the active `Artifacts/Mine-Services-Operations.html` shell and existing dashboard/table tests.
- The main dashboard split is owned by one base `#dashboardScreen .main` rule (`minmax(0,2.05fr) minmax(270px,.95fr)`, 8px gap); the right-side panels use one two-row grid owner; and `.panelhead` has one fixed 35px header contract. No competing active shell rule was found for these module-specific selectors.
- The `.left` base grid plus its expanded-state grid override are intentional: expanded tables overlay the lower 154px region while retaining the map row. The matching `.bottom` state rules intentionally switch from the collapsed 36px strip to the overlay. Do not collapse these into one rule without browser-level regression evidence; they represent distinct UI states, not accidental duplicates.
- The five KPI cards remain a single five-column grid. No changes were made to card dimensions, Site Map geometry, status panels, chart behavior, or shell dimensions.
- Existing tests cover dashboard table dates/status-column fit, material-movement data and legend layout, shared shell primitives, and duplicate CSS rules. This pass did not find a concrete regression requiring new CSS or a new test.
- No source code changed; active dashboard cache keys remain `dashboard.css?v=20261012-issues-alerts-fit` and `dashboard.js?v=20261012-date-columns`.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32** and the original top-level audit decisions remain **16/16**. Full Pytest is required for this new roadmap entry to become validated.


### Dashboard context controls and KPI strip ownership cross-check — 2026-10-12

**Decision: KEEP — ownership and state-flow cross-check complete; no patch warranted.**

- Cross-checked the active dashboard markup, `ui/modules/dashboard/dashboard.css`, `dashboard.js`, and `dashboard-status.js`.
- The two date/shift controls are owned by the dashboard module through `.dashboard-context-control` and its scoped select rules; the shared shell only supplies the generic `.controls` flex row and icon primitive. No competing declaration was found for the dashboard-specific control skin.
- The KPI strip has one five-column grid owner and one base card/icon treatment. Fleet KPI content uses its dedicated `.fleet-kpi*` selectors, so it does not need to be merged with the four operational KPI cards' internal layout.
- State behavior is explicit: All Day resets shift to ALL and disables the shift control; Today permits ALL/DAY/NIGHT; operation filtering uses transaction date plus selected shift, while issues use issue date. KPI and table updates consume the shared dashboard-status filters. This difference is intentional because issue rows do not use the operation shift field.
- The active artifact loads dashboard CSS once with cache key `20261012-issues-alerts-fit`; dashboard JS uses `20261012-date-columns`; dashboard status uses `20261101`. No source changed, so no cache-key bump is required.
- No CSS change or new regression test was justified by this review. Existing date-column, table-fit, material-chart, and CSS-duplicate tests remain the relevant regression coverage.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32**; top-level audit decisions remain **16/16**. Full Pytest is required to validate this additional roadmap-only entry.


### Dashboard Site Map / Topo3D toolbar CSS ownership cross-check — 2026-10-12

**Decision: KEEP — cross-file ownership is separated by responsibility; no patch warranted.**

- Compared the active Site Map toolbar markup in `Artifacts/Mine-Services-Operations.html` with `ui/modules/map-engine/map-engine.css` and `ui/modules/dashboard/dashboard.css`.
- `map-engine.css` owns toolbar structure, button/file-label appearance, hover/focus-visible states, hidden file input, and active-mode styling. `dashboard.css` contributes only the toolbar's placement beside the Site Map title via `margin-left:8px;margin-right:auto`. These declarations have distinct responsibilities, not duplicate ownership.
- The toolbar remains within the existing 35px panel header; no markup or shell geometry was changed. The right-aligned OFFLINE MAP label remains a separate sibling, so moving or merging toolbar rules would risk title/action alignment without evidence of a defect.
- Active artifact cache keys remain `dashboard.css?v=20261012-issues-alerts-fit` and `map-engine.css?v=20261011-topo3d-offset-dedupe`; neither stylesheet changed, so no cache-key update is needed.
- No source change or additional regression test was justified by this ownership review. Preserve the current toolbar behavior unless a visual or computed-style regression is demonstrated.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32**; top-level audit decisions remain **16/16**. Full Pytest is required to validate this roadmap-only entry.


### Dashboard Equipment Status and Material Movement CSS ownership cross-check — 2026-10-12

**Decision: KEEP — cross-file ownership review complete; no source patch warranted.**

- Cross-checked the active dashboard markup in `Artifacts/Mine-Services-Operations.html`, `ui/modules/dashboard/dashboard.css`, and the render/update logic in `ui/modules/dashboard/dashboard.js`.
- Equipment Status has a clear division of responsibility: `dashboard.css` owns the donut, status rows, labels, and bar geometry; `dashboard.js` computes equipment counts and writes the donut's conic-gradient and percentage widths. The runtime style updates are data-driven and are not duplicate CSS declarations.
- Material Movement uses the scoped `.chart`, `.bars`, `.chart-material-bar`, `.chartnote`, and `.chartkey*` selectors. The base and later `.bars`/ `.chartnote` rules serve distinct chart states/geometry; the x-axis baseline is deliberately drawn by the chart pseudo-element above date labels. The two `.chartkey` declarations own different properties (base color versus flex-row layout), not duplicate declarations.
- The existing material chart layout and legend classes are present in the active artifact and updated by the dashboard module. No competing shell selector or cross-file style owner was found that justifies moving or deleting rules.
- No source CSS or JavaScript changed; active cache keys remain `dashboard.css?v=20261012-issues-alerts-fit` and `dashboard.js?v=20261012-date-columns`. No cache-key bump is warranted.
- No new regression test is justified for this KEEP-only review; existing dashboard chart/data and CSS-duplicate tests remain applicable. Preserve the current status donut, proportional bars, material legend, chart baseline, and reduced-motion behavior.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32** and the original top-level audit decisions remain **16/16**. Full Pytest is required to validate this roadmap-only entry.


### Reports — Equipment Performance preview table fit and shell ownership cross-check — 2026-10-12

**Decision: KEEP — existing fit fix and regression guards are consistent; no source patch warranted.**

- Cross-checked the active artifact stylesheet/script references, `ui/modules/reports/reports.css`, `ui/modules/reports/reports.js`, and `tests/test_report_preview_shell_geometry.py`.
- The Equipment Performance table has a scoped `.report-preview-table.equipment-performance-table` rule with `table-layout:fixed;width:100%;min-width:0`, plus explicit column widths for Equipment, Unit, Date, Scheduled, Available, Used, PA/UA/EU, and Status. This scoped override intentionally defeats the shared preview table's `min-width:760px` so this compact table can fit the modal without introducing a horizontal scrollbar.
- The column-fit styling is scoped to Equipment Performance; the shared preview table rule remains available for other report tables. Existing regression tests assert the scoped rule and its uniqueness, representative column widths, cell sizing, and active CSS/JS cache keys.
- The report preview dialog's existing width (`min(720px,calc(100vw - 48px))`), max-height constraint, and work-area inset (`64px 0 34px`) remain unchanged. The body retains internal scrolling; no modal geometry adjustment is needed for the table-fit fix.
- Active cache keys are `reports.css?v=20261012-preview-wheel-scroll` and `reports.js?v=20261012-preview-column-grid`, each referenced by the artifact and asserted by the existing test. No source changed, so no cache-key bump is warranted.
- No new test or CSS patch was justified: `test_report_preview_equipment_table_has_explicit_column_geometry` and `test_report_preview_column_rules_are_scoped_to_equipment_performance_table` already protect the relevant behavior. Preserve modal width/height and shared preview-table behavior.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32** and the original top-level audit decisions remain **16/16**. Full Pytest is required to validate this additional roadmap-only entry.


### Shared table stylesheet and module override cross-check — 2026-10-12

**Decision: KEEP — shared table primitives and module-specific geometry have distinct responsibilities; no source patch warranted.**

- Cross-checked the active artifact's stylesheet load order, `ui/shared/table.css`, and the Operations, Equipment, Issues, WorkFront, HSE, Plans, Maintenance, and Dashboard module stylesheets.
- The shared table stylesheet is loaded once, at the end of the artifact's stylesheet list, with cache key `table.css?v=20261011-filter-layout`. It owns common cell clipping/ellipsis, table-header baseline and sticky behavior, table title-bar geometry, table-panel flex/overflow constraints, shared grid scrolling, and filter-bar base layout.
- Module CSS retains local responsibilities where needed: individual column tracks, local padding/typography, responsive filter templates, dashboard's separate `.tablegrid` structures, and module-specific table states. These are not blanket duplicates of the shared primitive contract.
- Dashboard's Recent Operations and Issues & Alerts use the distinct `.tablegrid`/ `.tablegrid.issue` grid system, so the shared register-table `.cell`/ `.th` rules do not own their date-column geometry. The Report Preview table is likewise scoped under `#reportsScreen` and remains outside the shared register-table selectors.
- The artifact cache-key assertions in `tests/test_css_duplicate_rules.py` cover affected module keys, while existing duplicate-rule tests cover representative module ownership. The shared stylesheet itself was not modified in this audit.
- No selector deletion or cache-key bump is justified by the evidence. Preserve shared clipping and scrolling behavior; only change a module-specific rule when a concrete visual regression and targeted test demonstrate the need.
- This is a KEEP decision, not a cleanup deletion. Confirmed cleanup remains **32**; top-level audit decisions remain **16/16**. Full Pytest is required to validate this new roadmap entry.


### Active HTML stylesheet links and inventory reconciliation — 2026-10-12

**Status: PARTIAL PASS — static links and dynamic loading are reconciled; Checker CSS remains KEEP/HOLD because test contracts still depend on its module rules.**

- Active artifact: `Artifacts/Mine-Services-Operations.html`. The artifact contains **24 static stylesheet link elements**. All href values are unique, all include a `?v=` cache parameter, and every referenced relative CSS path resolves to a tracked file.
- `ui/shared/app-info.css` is dynamically injected by `ui/shared/shell-navigation.js` with cache key `app-info.css?v=20261011-fade`; it remains KEEP.
- `ui/modules/checker/checker.css` is not directly linked by the active artifact, and the retired standalone Checker screen markup is absent. However, multiple existing CSS contract tests explicitly inspect Checker module rules for shared-control, field-label, runtime-error, screen-header, table-header, and table-layout ownership.
- A removal attempt in commits `54d680ca` / `e565b2b7` caused **14 test failures / 508 passes**. Failures included 13 dependent CSS contract reads plus a type error in the replacement test. This confirms that the asset cannot be removed as a simple orphan cleanup.
- Decision: restore `checker.css` and the pre-existing passing Checker CSS contract test. Classify the stylesheet as **KEEP / HOLD** until the Checker CSS contracts are deliberately retired or migrated in a separate, fully scoped change. Preserve `checker.js` and Operations evidence integration.
- No active application CSS declarations or cache keys are to be changed in this recovery. Confirmed cleanup remains **32**; inventory remains **26 / 26**. R16 is not fully closed: Checker stylesheet ownership requires a dedicated dependency decision.
- Validation: Full Pytest must pass on the recovery commit before it becomes the current validated baseline.


### Checker stylesheet dependency reconciliation — 2026-10-12

**Status: HOLD — safe to keep; not eligible for deletion in this cleanup pass.**

Evidence cross-check on `aa7e8809`:

- `Artifacts/Mine-Services-Operations.html` loads 24 static stylesheet files and does **not** link `ui/modules/checker/checker.css`. The artifact has no `#checkerScreen` or `#checkerModal` markup.
- `ui/modules/checker/checker.js` does not inject or reference `checker.css`; it exports `window.LithositeCheckerSupport` for Checker evidence creation/backfill from Operations. Preserve this JS integration.
- The stylesheet is still read by CSS contract tests across eight test files: `test_css_duplicate_rules.py`, `test_shared_field_control_css.py`, `test_shared_field_label_css.py`, `test_shared_runtime_error_css.py`, `test_shared_screen_header_css.py`, `test_shared_screen_primitives_css.py`, `test_shared_table_header_css.py`, and `test_shared_table_layout_css.py`.
- The attempted removal at `54d680ca` / `e565b2b7` produced 14 failures / 508 passes. Recovery commit `aa7e8809` restored `checker.css` and the prior CSS contract test; Full Pytest #344 is PASS.
- Correct classification: **unlinked legacy stylesheet with live test-contract dependencies**. This is not evidence that the Checker screen is currently mounted, and it is not safe to delete while tests continue to depend on the file.
- Next scoped task: inventory each Checker-specific test assertion and decide whether to (a) migrate the contract to an active shared/module stylesheet, or (b) explicitly retire obsolete Checker-screen assertions while retaining coverage for `LithositeCheckerSupport` and Operations evidence. Do not remove the stylesheet in the same change that migrates the tests.
- No application source or stylesheet cache key changed in this audit. Confirmed cleanup count stays **32**; CSS inventory stays **26 / 26**; unclassified packages stay **0**; open ownership follow-ups are now accurately recorded as **1**.
