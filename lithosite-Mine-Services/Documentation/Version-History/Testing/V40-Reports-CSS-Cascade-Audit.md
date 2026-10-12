# V40 Workspace — Reports CSS Cascade Audit

> **Historical record — scope closed.** V40 was subsequently locked and promoted to `main`. This audit records the cleanup history only; its earlier “final review” wording about the overall V40 lock is superseded by [V40 Baseline Lock](../Baseline/V40-Baseline-Lock.md). Do not reopen validated CSS cleanup without evidence of regression or duplication.

**Repository:** `yay460-jpg/portofolio`  
**Branch:** `v40-workspace`  
**Audit target:** `ui/modules/reports/reports.css`  
**Baseline before Cleanup #17:** `8caae4efd446d463a7f80d9e6fe7dc8b7f88e7b6`  
**Cleanup #17 CI:** [Full Pytest #418](https://github.com/yay460-jpg/portofolio/actions/runs/38194213397) — PASS for the CSS deletion; [#419](https://github.com/yay460-jpg/portofolio/actions/runs/38194222077) — PASS for the focused cascade assertion.  
**Cache synchronization:** [Full Pytest #424](https://github.com/yay460-jpg/portofolio/actions/runs/38194246205) — PASS.  
**Latest confirmed CI:** [Full Pytest #435](https://github.com/yay460-jpg/portofolio/actions/runs/38228307699) — PASS on exact HEAD `ea0a96332a4b42b23414d7b7f3a1818df5cbc280` (Full test suite, Python 3.13), including the version-neutral audit test contract.
**Current work:** finish conservative selector inventory and final release review.  
**Status:** Inventory in progress; not a final release sign-off.

## 1. Current validation baseline

- Cleanup #16 (`footer.status` consolidation): [Full Pytest #412](https://github.com/yay460-jpg/portofolio/actions/runs/38193856107) — PASS.
- Cleanup #17 CSS deletion: [Full Pytest #418](https://github.com/yay460-jpg/portofolio/actions/runs/38194213397) — PASS.
- Cleanup #17 focused cascade test: [Full Pytest #419](https://github.com/yay460-jpg/portofolio/actions/runs/38194222077) — PASS.
- Cache synchronization to `20261012-cascade-owner-17`: [Full Pytest #424](https://github.com/yay460-jpg/portofolio/actions/runs/38194246205) — PASS.
- Full Pytest #432 validates exact HEAD `f7ace5f8d83522ed9b2fda226b76569d640386f2`, including the latest audit-document changes and workflow adjustment.
- #410 failed because a legacy Stage 36 test still expected `.equipment-kpi-list` to own scrolling. The test was updated to assert that `.equipment-kpi-scroll` owns vertical scrolling; #411 passed.
- No new CSS change is authorized by this inventory document alone.

## 2. Scope and method

The stylesheet contains 347 lines. A source-level scan identified 239 rule blocks and 213 distinct selector strings after whitespace normalization. This is a mechanical inventory, not a browser-computed cascade proof: at-rules, selector specificity, source order, `!important`, and viewport conditions must be considered before deleting declarations.

**Rule:** repeated selectors are not automatically duplicates. Responsive and state-specific overrides are retained unless their effect is demonstrably dead in the same cascade context.

## 3. Completed cleanup register

The following work is treated as validated based on the existing branch history and targeted tests:

1. Redundant KPI panel declarations.
2. `.report-summary` overflow declaration overridden by the canonical owner.
3. Partial `.report-body` rules that were superseded by the canonical rule.
4. Redundant base `.report-body` layout declarations.
5. KPI summary card font-size override.
6. Redundant `.kpi-summary` gap/padding declarations.
7. Redundant `.kpi-summary-card` padding.
8. Redundant `.kpi-summary-card span` margin-top.
9. `.kpi-history` base padding override.
10. `.kpi-exclusions` base rule whose declarations were all overridden.
11. Equipment KPI summary strong rule consolidation.
12. `.kpi-lineage` rule consolidation.
13. Equipment KPI mobile grid: removed grid-template declarations from later spacing-only rules so the 900px media override remains effective. Verified by Full Pytest #409.
14. Equipment KPI list: removed overridden `overflow:auto` and `padding:0 7px 4px` from the earlier list rule; retained flex sizing and scrollbar hiding. Scrolling remains owned by `.equipment-kpi-scroll`. Verified by Full Pytest #411.

Do not reopen these items without concrete regression evidence.

## 4. Repeated-selector inventory

| Selector family | Observed pattern | Decision | Reason |
|---|---|---|---|
| `#reportsScreen .boundary` | Base rule owns display/flex direction/overflow; redundant middle rule with `height:100%` removed; final rule keeps `height:auto !important` | **REMOVE — DONE (#17)** | CSS deletion passed #418 and the focused assertion passed #419. Base rule and final height override remain intact. |
| `#reportsScreen .filters` | Base, flex sizing, desktop columns, 1200px columns, 900px columns | **KEEP** | Distinct layout and breakpoint responsibilities. |
| `#reportsScreen .equipment-kpi-row` | Desktop, intermediate-width, mobile single-column grids | **KEEP** | Responsive behavior. |
| `#reportsScreen .kpi-toolbar .kpi-baseline` | Base placement, mobile full width, truncation | **KEEP** | Mobile and overflow behavior. |
| `#reportsScreen .kpi-summary-card`, `b`, `span` | Base decoration/content styling plus later flex/ellipsis behavior | **KEEP / REVIEW** | Different properties may have separate ownership; do not delete whole rules based on selector repetition. |
| `#reportsScreen .kpi-equipment-head` | Base grid and later geometry-only declaration | **KEEP** | The later rule intentionally no longer overrides the responsive grid. |
| `#reportsScreen .equipment-kpi-detail summary` | Base grid, 900px grid override, later spacing-only declaration | **KEEP** | Mobile column contract must remain effective. |
| `#reportsScreen .kpi-history` | Border plus later height/spacing/overflow | **KEEP** | Separate property ownership. |
| `#reportsScreen .kpi-toolbar` | Base toolbar plus mobile wrapping | **KEEP** | Responsive behavior. |
| `#reportsScreen .report-body`, `.report-body > .report-panel` | Desktop layout and mobile stacking/min-height | **KEEP** | Responsive behavior and scroll geometry. |
| `#reportsScreen .kpi-summary` | Six-column base and two-column breakpoint | **KEEP** | Responsive behavior. |
| `#reportsScreen .equipment-kpi-list` | Earlier rule's `overflow:auto` and padding were removed in Cleanup #15; scrolling stays on `.equipment-kpi-scroll` | **REMOVE — DONE** | Full Pytest #411 passed after the legacy scroll assertion was aligned. |
| `footer.status` | Base visual/overflow styling plus a later `bottom:0` declaration, now consolidated | **REMOVE — DONE (#16)** | Full Pytest #412 passed after moving `bottom:0` into the canonical rule. |
| `#reportsScreen .reports-console-dialog` | Desktop dimensions and mobile dimensions | **KEEP** | Viewport-specific dimensions. |
| `#reportsScreen .reports-timeline-row` | Desktop columns and mobile single-column layout | **KEEP** | Responsive behavior. |
| `#reportsScreen .report-preview-kpis` | Four-column base and two-column mobile layout | **KEEP** | Responsive behavior. |
| `#reportsScreen` | Base workspace sizing plus later height/overflow and final height/flex declarations | **KEEP** | Later declarations preserve locked workspace/footer geometry; do not merge without layout evidence. |
| `#reportsScreen #reportsFleetStatus` | Base text wrapping plus later font-size/weight/line-height | **KEEP** | Separate readability and compact KPI value responsibilities. |
| `#reportsScreen .kpi-toolbar-right` | Base toolbar group layout plus mobile full-width override | **KEEP** | Mobile wrapping and control visibility. |
| `#reportsScreen .reports-console-dialog` | Desktop width/max-height plus mobile viewport-relative dimensions | **KEEP** | Intentional viewport-specific dialog sizing. |
| `#reportsScreen .reports-timeline-row` | Desktop evidence columns plus mobile single-column layout | **KEEP** | Responsive evidence readability. |
| `#reportsScreen #reportPdfReaderModal.is-closing .user-guide-reader-dialog` | Close animation plus reduced-motion override | **KEEP** | State and accessibility behavior; reduced-motion override must remain. |
| `#reportsScreen #reportsApplyConsole` | Base action styling plus later primary-action styling | **KEEP** | Later rule supplies the primary action's visual treatment; the selector repetition is not a dead declaration. |
| `#reportsScreen .report-preview-table th`, `td` | Shared table cell/header styling plus compact-table padding override | **KEEP** | Generic preview table rules define typography/nowrap/borders; compact/equipment-specific rules refine padding and fit. |
| `#reportsScreen .equipment-performance-table th`, `td` | Equipment Performance-specific typography/overflow layered over generic preview table | **KEEP** | Intentional specialization; retain fixed-layout 10-column fit contract and do not introduce horizontal scrolling. |

## 5. Next controlled step

**Cleanup #15 passed #411, Cleanup #16 passed #412, Cleanup #17 passed #418/#419, cache synchronization passed #424, and Full Pytest #435 passed on exact HEAD `ea0a96332a4b42b23414d7b7f3a1818df5cbc280`.** The full suite completed successfully in GitHub Actions on Python 3.13. The expanded repeated-selector inventory, CI workflow adjustment, and version-neutral audit test contract are included in this validated commit. No additional CSS deletion is authorized by the inventory alone; `KEEP / REVIEW` remains deliberate where ownership or computed geometry is not proven.

Before any further CSS edit:
1. Check all declarations and source order for the selector in the same media/state context.
2. Confirm ownership in the active HTML and relevant tests.
3. If geometry or scroll behavior may change, preserve the existing Equipment Performance no-horizontal-scroll contract.
4. Add or update only a focused test that expresses the intended behavior, not a brittle whole-block snapshot.
5. Run Full Pytest and accept only a confirmed PASS. If there is no evidence a rule is dead, classify it `KEEP` or `REVIEW` rather than deleting it.

## 6. Remaining release gates

- Record the identified repeated-selector families with explicit `REMOVE`, `KEEP`, or `REVIEW` decisions; the current inventory includes the responsive/state families listed in Section 4.
- `.boundary` intermediate rule is resolved: redundant declarations removed in Cleanup #17; base layout and final `height:auto !important` override remain.
- Do not change Equipment Performance column widths or introduce horizontal scrolling.
- Final full test suite must pass on the exact release HEAD.
- Update the version history / test evidence only after CI confirms the final commit.

**Historical release status: CSS CASCADE CLEANUP CLOSED.** Full Pytest #435 passed on exact HEAD `ea0a96332a4b42b23414d7b7f3a1818df5cbc280`, validating the version-neutral audit test contract. Cleanup #15–#17 and cache synchronization remain validated. Remaining `REVIEW` entries are deliberately retained without deletion. The later V40 Baseline Lock records the overall release decision and explicitly defers operational A3 runtime acceptance rather than claiming it passed.
