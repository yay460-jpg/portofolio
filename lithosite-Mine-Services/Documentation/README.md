# Documentation

Start here: [`dokumentasi.md`](./dokumentasi.md), the consolidated version-history index and baseline record.

Global Mine Services documentation.

Global UI labels, shared navigation, and reusable contracts use stable, version-neutral names. Version-specific implementation summaries belong directly under Version-History; stage/baseline evidence belongs under Version-History/Baseline.


## Version History

- [V39 Workflow and Maintenance Enhancements](./Version-History/Workflow-and-Maintenance-Enhancements.md) — version-specific record of workflow navigation, Maintenance ↔ Operations traceability, and related V39 behavior.

## Workflow Guides

- [V38 Dump Truck Hauling Workflow & Timeline Guide](./Hauling-Workflow-and-Timeline-Guide.md) — end-to-end guide from Global Capacity and Work Front / Console through Equipment, Checker Retase, Operation, Work Timeline, accumulated progress, and reporting.

## Reports CSS Cascade Audit

- [V40 Reports CSS Cascade Audit](Testing/Reports-CSS-Cascade-Audit.md) — cleanup register, repeated-selector decisions, and remaining release gates. Cleanup #15 validated by #411; Cleanup #16 by #412; Cleanup #17 validated by #418/#419; cache sync validated by #424; Full Pytest #435 passed on exact HEAD `ea0a96332a4b42b23414d7b7f3a1818df5cbc280`, including the version-neutral audit test contract. Reports CSS cascade cleanup is closed; the overall V40 workspace remains open pending its separate release gates.

## Global Decision Reminder — Target vs Actual

**Status: HOLD — business definition pending owner direction.** This is a cross-version business decision, not a version-specific feature commitment.

Keep the existing Plan vs Actual button and dialog as an initial reference implementation for now. Do not expand the calculation rules, make date/shift behavior authoritative, or integrate a finalized Target vs Actual model throughout the Target Plan page and Dashboard until the owner provides the business definition.

### Business models under consideration

1. **Material-category comparison**
   - Ore Target vs Actual Ore
   - OB Target vs Actual OB
   - Limonite Target vs Actual Limonite
   - Each category may need its own target, actual, variance, and achievement. Measurement units and calculation rules must follow the definition approved later.

2. **Annual RKAB to monthly targets**
   - Use annual RKAB as the reference and derive monthly targets for comparison with actual output in the corresponding period.
   - The monthly allocation method is not decided. Do not assume equal monthly distribution or invent a proration formula.

These models are possibilities, not an approved combined design. They may eventually coexist, but do not assume that without further direction.

### Work rules while on HOLD

- Preserve the existing initial dialog and stable dashboard panels.
- Do not implement or lock a universal Target vs Actual formula yet.
- Keep validation of date filters, shift filters, and their comparison semantics on hold.
- Do not treat the current sample values (Target 500 ton, Actual 330 ton, variance -170 ton, achievement 66%, remaining 170 ton) as an approved business formula or universal rule; they only describe the currently displayed record.
- Do not close or lock a project baseline solely on the strength of this initial dialog.
- Resume this work only after the owner defines the target categories, source data, period allocation, and intended behavior for the Target Plan page and Dashboard.

This reminder is intentionally global and version-neutral. When the business definition is approved, update the relevant shared contract and the affected module documentation rather than binding the decision to a particular release number.

