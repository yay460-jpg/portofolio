# Stage 12 — Issues Gate

## Workspace
- Artifact: `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v24-STAGE12.html`
- Shell: `ui/shared/shell-navigation-v24.js`
- Module: `ui/modules/issues/issues.js`
- Baseline predecessor: V23 Stage 11 Final Lock

## Scope
Stage 12 introduces the **Issues** operational workspace inside the Desktop Master shell.

## Authoritative Data Contract
- Entity: `Issues`
- PK: `issue_id`
- Date: `issue_date`
- Optional FK: `work_front_id -> WorkFront.work_front_id`
- Optional FK: `equipment_id -> Equipment.equipment_id`
- Controlled vocabulary: `domain`, `severity`, `status`
- Closure rule: `Closed` requires `closed_at`; non-Closed records must keep `closed_at` blank.

## Architecture
```
Issues UI
  -> V24 Shell Navigation
  -> issues.js
  -> RuntimeAdapter
  -> Validation
  -> Transaction
  -> XLSX Persistence
  -> AuditLog
```

## Functional Gate
- [ ] Issues screen is reachable from the V24 shell.
- [ ] Runtime READ loads Issues and authoritative _Lists.
- [ ] Work Front and Equipment references resolve to human-readable labels.
- [ ] CREATE commits through RuntimeAdapter and produces audit evidence.
- [ ] UPDATE commits through RuntimeAdapter and produces audit evidence.
- [ ] DELETE commits through RuntimeAdapter and produces audit evidence.
- [ ] Invalid FK is rejected.
- [ ] Invalid controlled value is rejected.
- [ ] Closed without `closed_at` is rejected.
- [ ] Non-Closed with `closed_at` is rejected.
- [ ] UI regression confirms no unintended changes to V23 baseline screens.

## Lock Rule
V23 remains untouched and locked. Stage 12 changes are confined to V24 and new Stage 12 module/test/documentation files.
