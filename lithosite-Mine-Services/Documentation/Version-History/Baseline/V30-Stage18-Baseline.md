# V30 — Stage 18 Baseline

## 1. Baseline Identity

- Version: **V30**
- Stage: **Stage 18**
- Baseline artifact: `Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v30-LOCKED.html`
- Locked baseline artifact SHA: `c91b0d1dd337fc496b3e486da749f7c0f57a6f57`
- V31 Stage 19 was created from this locked baseline.
- V30-LOCKED is the protected baseline and must not be modified during Stage 19.

## 2. Changes Completed in V30

### 2.1 Module CSS separation and migration

V30 completed the dedicated CSS separation for ten application modules:

1. Dashboard
2. Operations
3. Equipment
4. WorkFront
5. Maintenance
6. Issues
7. Plans
8. HSE
9. Data Management
10. Reports

Validation completed:

- All ten stylesheet links are present exactly once.
- CSS brace balance was checked.
- Cross-module `#...Screen` selector leakage was checked.
- Remaining JavaScript style injection from migrated module CSS was removed.
- The obsolete empty Equipment Stage 9 style block was removed.

### 2.2 Centralized Data Synchronization

New shared module:

`ui/shared/data-sync.js`

The synchronization bus:

- allows modules to register a refresh function;
- listens for runtime mutation events;
- refreshes registered modules after successful mutations;
- queues refresh batches;
- skips the originating module because it already refreshes itself after its own mutation.

Registered persistent modules:

- Dashboard
- Operations
- Equipment
- WorkFront
- Maintenance
- Issues
- Plans
- HSE
- Reports

Data Management is not a persistent screen subscriber; its IMPORT/RESTORE mutations still trigger refreshes for registered screens and reports.

### 2.3 Runtime mutation event

Updated:

`ui/shared/runtime-client.js`

After a mutation returns `COMMITTED`, the runtime dispatches:

`lithosite:runtime-mutated`

Event detail:

- `operation`
- `entity`
- `entity_id`
- `request_id`

Covered mutation operations:

- CREATE
- UPDATE
- DELETE
- IMPORT_XLSX
- RESTORE

The event is emitted only after a successful `COMMITTED` result.

### 2.4 V30 integration

V30 loads:

- `runtime-client.js`
- `data-sync.js`
- `shell-navigation-v30.js`
- Dashboard
- Operations
- Equipment
- WorkFront
- Maintenance
- Issues
- Plans
- HSE
- Data Management
- Reports JavaScript modules

Module cache-busting versions were updated for the V30 integration. HSE remains at the contract-required `?v=20261002`.

### 2.5 Runtime synchronization smoke harness

New test:

`tests/runtime_sync_harness.js`

The harness executes the production `data-sync.js` and `runtime-client.js` in a browser-like Node.js VM.

Covered:

- CREATE → event → refresh
- UPDATE → event → refresh
- DELETE → event → refresh
- IMPORT_XLSX → event → refresh
- RESTORE → event → refresh
- REJECTED mutation → no refresh event
- originating module → no duplicate central refresh

Result:

`RUNTIME_SYNC_TEST_PASS`

## 3. Browser Runtime Verification

V30 was verified against the running Desktop Host/runtime on port 8765.

### CREATE — PASS

A temporary Equipment record was created through RuntimeAdapter.

Observed:

- Equipment count: 3 → 4.
- Dashboard Total Equipment: 3 → 4 without browser refresh.

### UPDATE — PASS

The same temporary Equipment record was updated.

Observed:

- Owner Name: `SYNCTEST` → `SYNCTEST UPDATED`.
- Dashboard remained synchronized without browser refresh.

### DELETE — PASS

The temporary Equipment record was deleted.

Observed:

- Equipment count: 4 → 3.
- Dashboard Total Equipment: 4 → 3 without browser refresh.

### RESTORE — PASS

A backup was created and restored through Data Management.

Observed:

`Restore committed and audited successfully.`

The temporary test record had already been deleted, leaving the working Equipment count at 3.

## 4. Test Results

Full Python test suite:

```
103 passed in 2.39s
```

Runtime synchronization harness:

```
RUNTIME_SYNC_TEST_PASS
```

Browser verification:

- CREATE: PASS
- UPDATE: PASS
- DELETE: PASS
- RESTORE: PASS

## 5. Baseline and Version Handling

- V30 Stage 18 was completed and locked.
- V30-LOCKED is the protected baseline artifact.
- V29 Stage 17 was superseded and removed from the Artifacts workspace.
- V31 Stage 19 was created from V30-LOCKED.
- Stage 19 changes must be made only in `v31-STAGE19.html`.
- V30-LOCKED must remain unchanged.
