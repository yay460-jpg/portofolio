# V40 — Work Control Plan vs Actual Integration Plan

**Status:** INITIAL DIALOG PRESENT · BUSINESS SEMANTICS HOLD  
**Workspace:** `v40-workspace`  
**Date:** 2026-10-12

## 1. Purpose and boundary

Add Plan vs Actual summary cards to the Work Control dashboard without rebuilding the existing Target Plan calculations, changing the locked V39 baseline, or disturbing existing dashboard panels and filters.

This document records the initial integration and its technical boundaries. The global Target vs Actual decision reminder in `Documentation/README.md` is authoritative: business formulas and date/shift comparison behavior are on HOLD until owner direction. This document must not be interpreted as approval to implement every listed metric/filter contract.

## 2. Current source findings

| Concern | Existing source | Verified behavior | Integration decision |
|---|---|---|---|
| Dashboard runtime reads | `ui/modules/dashboard/dashboard.js` | Loads Equipment, WorkFront, Operations, Issues, and Maintenance through `LithositeRuntimeClient.request({ operation: 'READ', entity })`. | Reuse the dashboard's existing runtime client and loaded data. Avoid direct XLSX or parallel persistence access. |
| Dashboard context | `ui/modules/dashboard/dashboard-status.js` | Existing dashboard behavior: `ALL_DAYS` returns all Operations; `TODAY` filters by local transaction date and selected shift. Shift resets to ALL when scope is ALL_DAYS. | Preserve existing dashboard controls. Do not validate or extend Plan vs Actual date/shift semantics until owner direction. |
| Target Plan source | `ui/modules/plans/plans.js` | Target Plan rows include start/end date, period, domain, work_front_id, activity, target_quantity, measurement, and status. | Read Target Plan through the same RuntimeAdapter READ boundary. Do not derive targets from fixed demo values. |
| Actual production source | `ui/modules/plans/plans.js` | Only Operations with status `VALIDATED` contribute. Matching uses plan date bounds, domain, Work Front when specified, activity, and measurement; quantities must be finite and non-negative. | Reuse the same matching semantics in a shared pure helper or a narrowly scoped dashboard adapter; do not create a second, drifting formula. |
| Existing calculations | `ui/modules/plans/plans.js` and `tests/test_v39_target_plan_vs_actual.py` | Variance = Actual − Target; achievement = Actual / Target × 100 only when Target > 0; remaining = max(Target − Actual, 0). Missing/unavailable inputs display as unavailable, not zero. | Preserve formulas and unknown-data behavior. Target Plan tests remain regression guards. |
| Existing Reports comparison | `ui/modules/reports/reports.js`, daily/weekly/monthly report modules | Reports has period-aware Plan vs Actual aggregation, ambiguity protection, and explicit exclusion of ambiguous actuals to prevent double counting. | Treat Reports as a separate report-period contract; do not silently replace its date semantics with dashboard Today/Shift semantics. |
| Dashboard visual hierarchy | Stage 29 artifact and `ui/modules/dashboard/dashboard.css` | Five KPI cards occupy the top strip; the main region is already split between Site Map/tables and Equipment Status/Material Movement. | Add a compact dedicated summary area only after a geometry plan confirms no existing panel is displaced or clipped. Keep responsive behavior intact. |

## 3. Provisional metric reference — NOT APPROVED FOR EXPANSION

The items below describe existing Target Plan conventions and the initial prototype only. They are not approval to apply one universal Target vs Actual formula across all material categories or RKAB periods. Keep them provisional until the owner defines the business model.

For the currently displayed initial reference only:

1. **Target** — aggregate applicable Target Plan quantities using the same plan applicability and measurement definitions as the Target Plan register.
2. **Actual** — sum only matching `VALIDATED` Operations, respecting date/shift context and the same domain, Work Front, activity, and measurement mapping.
3. **Variance** — `Actual - Target`.
4. **Achievement** — `Actual / Target * 100`; unavailable when Target is missing, invalid, or zero.
5. **Remaining** — `max(Target - Actual, 0)`; unavailable when either input is unavailable.

### Data integrity rules

- Do not count draft, rejected, blank-status, or otherwise non-VALIDATED Operations.
- Do not convert an unavailable runtime read into a legitimate numeric zero.
- Ignore non-finite or negative quantities consistently with the existing Target Plan register.
- Keep measurement categories separate; never sum unlike units into a single total.
- If multiple Target Plans can match the same Operations row, establish and test an unambiguous aggregation policy before implementation. Do not double-count actuals across plans.
- Preserve the existing Dashboard scope and shift controls, but HOLD validation of how Plan vs Actual should interpret date/shift selection. Do not assume that dashboard filtering automatically defines the approved business comparison period.
- No hard-coded example quantities in production rendering.

## 4. Existing initial implementation — preserve; do not expand while on HOLD

1. Preserve the isolated dialog and RuntimeAdapter READ boundary already implemented.
2. Preserve independent error handling so a Plans read failure does not break existing dashboard panels.
3. Preserve Site Map, Equipment Status, Material Movement, Recent Operations, and Issues & Alerts.
4. Do not broaden formulas, category coverage, date/shift semantics, or Target Plan page integration until the owner supplies the business definition.
5. Keep all changes on `v40-workspace`; do not alter V39 baseline artifacts.

## 5. Required focused tests

- Actual includes only VALIDATED Operations; draft/rejected/blank statuses do not contribute.
- Existing matching safeguards (domain, Work Front, activity, measurement, date bounds, and ambiguity exclusion) remain covered by regression tests; do not interpret these as approval of a universal business rule.
- **HOLD:** tests that would lock Plan vs Actual date/shift semantics or all-category formulas are deferred until owner direction.
- Target missing/zero, Operations read failure, and no matching rows are represented without false zero claims.
- Variance, achievement, and remaining follow the exact Target Plan definitions.
- Different measurement units are not combined.
- Ambiguous plan-to-operation matching cannot double-count quantities.
- Dashboard runtime failure/loading does not break the existing KPI, map, Equipment Status, Material Movement, Recent Operations, or Issues & Alerts panels.
- Responsive layout remains usable and no pre-existing panel is clipped or removed.

## 6. Acceptance and release gates

- Focused tests PASS.
- Full pytest PASS on exact feature HEAD in GitHub Actions and local environment.
- Manual runtime check against the operational A.3 workbook remains separate from CI's isolated A3 fixture.
- Visual acceptance confirms existing dashboard panels, context controls, and navigation remain operational.
- Update the V40 release-gate snapshot only with evidence-backed results.

**Current decision:** the initial dialog is present and retained. Business semantics and broader integration are **HOLD** pending owner direction. This is not a feature-completion declaration or V40 baseline lock.


## 7. Initial implementation notes

The first implementation adds an isolated dialog launched from the Work Control header, preserving the existing dashboard grid and panels. Target Plan is loaded separately through RuntimeAdapter so a Plans read failure does not block other dashboard data. The calculator is in `ui/modules/dashboard/dashboard-plan-actual.js`.

Ambiguous matches are excluded, units remain separate, multi-day targets are not prorated in Today scope, and shift-level comparison is unavailable until the Target Plan contract defines shift allocation. Focused test contract: `tests/test_v40_dashboard_plan_actual.py`.

**Status:** implementation committed; full pytest and runtime/manual visual acceptance pending.


## 8. Owner decision hold — 2026-10-12

Follow the version-neutral global reminder in `Documentation/README.md`. Preserve the initial Plan vs Actual button/dialog and the stable dashboard panels. Do not validate or lock date/shift behavior, universal material-category formulas (Ore, OB, Limonite, etc.), annual RKAB-to-monthly allocation, or full integration across Target Plan and Dashboard until the owner gives explicit direction. The current displayed values are examples from the current record, not an approved business formula. This HOLD does not prevent unrelated V40 release-gate work.
