# V34 — Reports & KPI

## 1. Purpose

The **Reports & KPI** workspace is the reporting/presentation layer for Mine Services V34.

KPI is treated as a **report output**, not as a separate data-entry module and not as a separate sidebar screen.

The workspace currently provides the UI baseline for Equipment KPI while the underlying Event & Time History and KPI calculation engine remain separate pending work.

---

## 2. Navigation

- Sidebar label: **Reports & KPI**
- Internal screen key: **Reports**
- Existing shell/navigation structure is preserved.
- No separate **KPI** sidebar item is created.
- The Reports screen remains the single workspace for operational reporting and KPI presentation.

This preserves the stable V34 shell and avoids introducing a parallel KPI navigation path.

---

## 3. Existing Operational Reporting

The Reports & KPI screen continues to read operational data through the existing RuntimeAdapter.

Current read-only entities:

- Operations
- Equipment
- WorkFront
- Maintenance
- Issues
- Plans
- HSE

The existing **Operational Data Summary** remains available.

The current reporting module does not write directly to the database.

---

## 4. Equipment KPI Baseline

The Equipment KPI panel currently presents three core KPI concepts:

### PA — Physical Availability

Question:

> Apakah equipment tersedia?

V34 learning baseline:

PA = Available / Scheduled × 100%

Status:

- Concept locked
- Calculation is not yet activated
- Requires validated Event & Time History

### UA — Utilization of Availability

Question:

> Dari waktu available, apakah equipment digunakan?

V34 learning baseline:

UA = Used / Available × 100%

Status:

- Concept locked
- Calculation is not yet activated
- Requires validated Event & Time History

### EU — Effective Utilization

Question:

> Dari waktu used, apakah equipment digunakan secara efektif?

Status:

- Concept locked
- Final formula is **pending the official company/site SOP or KPI standard**
- Calculation is not yet activated

The EU denominator must not be hard-coded until the applicable official standard is available.

---

## 5. KPI Cascade

The V34 conceptual cascade is:

Scheduled → Available → Used → Effective

Therefore:

PA → UA → EU

Interpretation:

1. **PA** checks whether scheduled equipment time was available.
2. **UA** evaluates use only from time classified as available.
3. **EU** evaluates effectiveness only from time classified as used.

The next KPI layer must respect these prerequisites.

A downstream KPI is not evaluated when its prerequisite state is not met.

Examples:

- Not Available → UA = — → EU = —
- Available + Not Used → EU = —
- Available + Used → EU can be evaluated

— means the next KPI layer is not evaluated because its prerequisite was not met. It is not automatically a zero value.

---

## 6. Event & Time History Dependency

KPI values must **not** be calculated from raw record counts.

The intended foundation is a validated **Event & Time History** for each equipment unit.

Conceptually:

One Equipment → One Timeline → PA / UA / EU

A time event needs, at minimum, enough information to establish:

- equipment identity
- start time
- end time
- status
- reason/context
- source
- validation status

The same equipment timeline feeds the PA, UA, and EU layers.

The event database schema is intentionally not introduced by this Reports & KPI UI baseline. Existing Equipment, Operations, WorkFront, Maintenance, and related data structures must be reviewed first so the event model does not overlap or break stable data.

---

## 7. Data Validation Principle

Conflicting operational sources must not be silently converted into KPI values.

Example:

- Operator source: Operating
- Dispatcher/MCC source: Standby

Until the conflict is reconciled:

- preserve the source records
- mark the affected interval NEEDS_VALIDATION
- do not silently choose one source for KPI calculation

After validation, the reconciled event can become the KPI source.

---

## 8. Scope of V34 Equipment KPI

Current equipment KPI scope:

- Excavator
- Loader
- Dump Truck / Haul Truck
- Dozer
- Grader

Light Vehicle (LV) is outside the current KPI scope.

MCC/Dispatcher and checker/retase are operational/data-source roles, not KPI objects.

The KPI object is **Equipment**.

---

## 9. Current Implementation Status

### Implemented

- Reports screen retained in the existing shell
- Sidebar label changed to **Reports & KPI**
- Equipment KPI panel added
- PA concept and baseline formula displayed
- UA concept and baseline formula displayed
- EU concept displayed with final formula marked pending
- Read-only RuntimeAdapter reporting retained
- Contract tests added for the Reports & KPI workspace

### Not yet activated

- Event & Time History database/schema
- KPI calculation engine
- Automatic PA calculation
- Automatic UA calculation
- Automatic EU calculation
- MTBF
- MTTR

MTBF and MTTR remain on **HOLD** while the Event & Time History foundation is being designed.

---

## 10. Boundary of This Document

This document records the V34 **Reports & KPI workspace baseline**.

It does not define an official company/site KPI standard.

Where an official company/site SOP or KPI standard exists, that source has higher authority than the V34 learning baseline, particularly for:

- Scheduled Time
- Available Time
- Operating/Used Time
- Effective Time
- EU formula
- site-specific classification rules

No official company/site definition should be invented or assumed from this UI.

---

## 11. Next Foundation Step

The next design step is to inspect the existing stable data structures and determine:

1. what existing data can already feed Event & Time History;
2. what information is still missing;
3. how a minimum event model can be introduced without overlapping existing structures.

Only after that review should the Event & Time History schema and KPI calculation engine be considered.

---

## 12. Source Implementation References

Current V34 implementation references:

- Artifact: Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v34-STAGE22.html
- Reports module: ui/modules/reports/reports.js
- Reports styling: ui/modules/reports/reports.css
- Contract test: tests/test_stage22_reports_kpi_ui.py

The Reports & KPI workspace is therefore a presentation/reporting baseline; it is not yet the final KPI calculation layer.
