# Stage 7 — Desktop UI Architecture & Navigation Contract

**Status:** DRAFT / REVIEW REQUIRED  
**Module:** Lithosite Mine Services  
**Master UI:** Desktop  
**Baseline UI:** Operations Dashboard V19 LOCKED  
**Database Contract:** Schema A.1  
**Runtime Boundary:** RuntimeAdapter  
**Offline Target:** Full offline runtime

---

## 1. Purpose

This contract defines the desktop navigation structure, screen ownership, data boundaries, and UI-to-runtime rules for Mine Services.

It does not change the V19 Desktop Master visual baseline.

V19 remains a locked reference. Any future visual or functional change is implemented as a new revision.

---

## 2. Desktop Master Rule

The desktop application is the master interface for Mine Services.

- Minimum target viewport: desktop / 14-inch class and above.
- V19 dashboard is the visual baseline.
- Android is a follower client and is not allowed to redefine desktop navigation or data contracts.
- Desktop UI must not create a second persistence system.
- Desktop UI must not directly manipulate XLSX storage.

---

## 3. Navigation Contract

The primary navigation order is:

1. Dashboard
2. Operations
3. Equipment
4. Work Front
5. Maintenance
6. Issues
7. Plans
8. HSE
9. Reports
10. Import Data
11. Backup / Restore
12. Settings

The sidebar is collapsed by default and follows the V19 locked shell.

### Navigation behavior

- Selecting a navigation item changes the active screen.
- The active item must have a clear visual state.
- Navigation must not reload or recreate the database.
- Navigation must preserve the active runtime/session context.
- Navigation must not require network access.
- A screen may request data only through the defined runtime boundary.

---

## 4. Screen Ownership

| Screen | Primary A.1 source | Write capability |
|---|---|---|
| Dashboard | Multi-domain read | Read-only |
| Operations | Operations | CRUD |
| Equipment | Equipment | CRUD |
| Work Front | WorkFront | CRUD |
| Maintenance | Maintenance | CRUD |
| Issues | Issues | CRUD |
| Plans | Plans | CRUD |
| HSE | HSE | CRUD |
| Reports | Multi-sheet read | Read-only |
| Import Data | XLSX import pipeline | Import only |
| Backup / Restore | Snapshot manager | Controlled snapshot operations |
| Settings | _System / _Lists | Controlled configuration |

---

## 5. Runtime Boundary

Desktop UI → RuntimeAdapter → ApplicationService → Validation / Transaction / Audit / Persistence

The following direct paths are prohibited:

- Desktop UI → IndexedDB as a second database
- Desktop UI → localStorage for business data
- Desktop UI → XLSX mutation
- Desktop UI → Google Sheets
- Desktop UI → Google Apps Script
- Desktop UI → cloud database
- Desktop UI → external REST API for normal CRUD
- Desktop UI → Python internals bypassing RuntimeAdapter

The runtime remains the single source of truth for business operations.

---

## 6. Screen-to-Operation Mapping

### Dashboard

Read-only operational overview.

Must consume runtime read operations and calculate presentation state without changing the database.

### Operations

Primary transaction screen.

Uses:
- Operations
- WorkFront
- Equipment

Must respect validation and audit contracts.

### Equipment

Master equipment records.

Uses:
- Equipment

Status and effective-date rules remain governed by Schema A.1 and validation contracts.

### Work Front

Operational work-front records.

Uses:
- WorkFront

### Maintenance

Maintenance event records.

Uses:
- Maintenance
- Equipment

### Issues

Issue lifecycle.

Uses:
- Issues
- WorkFront
- Equipment

### Plans

Planning records.

Uses:
- Plans
- WorkFront

### HSE

HSE event records.

Uses:
- HSE
- WorkFront

### Reports

Read-only presentation layer.

Reports may combine multiple runtime reads but must not create duplicate business records.

### Import Data

Uses the Stage 2 XLSX Import Contract.

Flow:

File → Staging → Schema Check → Validation → Atomic Commit → Audit

No partial commit is allowed.

### Backup / Restore

Uses the existing snapshot contract.

Restore must remain:
- checksum validated
- atomic
- baseline protected
- audited

### Settings

Provides controlled access to system/list configuration.

Business data must not be edited through Settings.

---

## 7. UI State Rules

Each screen has these standard states:

- Loading
- Ready
- Empty
- Validation Error
- Runtime Error
- Offline Ready

The UI must not silently interpret an error as an empty dataset.

For destructive operations, confirmation is required.

For successful mutations, the UI must provide a clear result and refresh the affected view from runtime data.

---

## 8. Offline Contract

Normal Mine Services runtime operation must not require internet access.

Internet may be used during development for:

- Git operations
- development tooling
- dependency acquisition
- source distribution
- external documentation

Internet must not be required for:

- opening the application
- reading database records
- CRUD
- validation
- import
- backup
- restore
- audit
- reports
- normal dashboard operation

All runtime assets required for normal operation must be local or embedded.

---

## 9. Data Integrity Rules

The desktop UI must never redefine Schema A.1.

Primary keys, foreign keys, enumerations, numeric constraints, conditional rules, and audit requirements remain governed by the existing database and validation contracts.

UI validation is allowed as a user-experience layer, but runtime validation remains authoritative.

---

## 10. Implementation Order

Implementation proceeds in this order:

1. Navigation shell integration
2. Operations
3. Equipment
4. Work Front
5. Maintenance
6. Issues
7. Plans
8. HSE
9. Reports
10. Import Data
11. Backup / Restore
12. Settings
13. Desktop integration regression
14. Offline audit

Each screen is tested before the next screen is treated as baseline.

---

## 11. Lock / Change Policy

V19 is locked.

Do not modify:

- V19 layout
- V19 visual hierarchy
- V19 dashboard composition
- V19 shared icon usage
- V19 animation behavior

New requirements are implemented as new revisions.

The first functional revision after V19 is therefore a separate screen/application revision and does not overwrite the locked V19 artifact.

---

## 12. Acceptance Criteria for Stage 7

Stage 7 can be marked PASS when:

- all 12 navigation destinations are defined;
- each destination has an A.1 ownership mapping;
- RuntimeAdapter is the only application integration boundary;
- no browser-side duplicate persistence is introduced;
- offline runtime requirements are explicit;
- screen implementation order is fixed;
- V19 remains untouched and locked.

**Next implementation stage:** Stage 8 — Operations Screen.
