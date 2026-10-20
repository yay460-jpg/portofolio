# Stage 6 Baseline

## Status

- Stage 6: HOST SCAFFOLD IMPLEMENTED — NOT BASELINED
- Stage 5: PASS — BASELINED
- Database schema: A.1
- Database mode: OFFLINE
- Phase A: LOCKED

## Implementation State

A concrete Android host project now exists under:

- `lithosite-Mine-Services/android-host/`

The host uses:

- Android application module;
- Chaquopy 17.0.0;
- Python 3.13;
- the existing Mine Services Python package;
- the real Stage 5 RuntimeAdapter;
- the existing A.1 XLSX workbook as the packaged seed;
- application-private runtime storage.

The Android UI reaches Mine Services through `MineServicesBridge`. The bridge invokes `android_entry.py`, which constructs the real RuntimeAdapter and PersistenceStore.

## Locked Decisions

- Mine Services remains offline.
- A.1 remains authoritative.
- Android does not implement a second validation engine.
- Android does not own a second authoritative Mine Services database.
- UI calls the bridge; the bridge calls RuntimeAdapter.
- Runtime mutations remain behind the existing application/transaction/audit boundaries.
- Stage 6 cannot be marked PASS from documentation or scaffolding alone.

## Verification Pending

The following must still be executed on a development machine with Android Studio/SDK and Python 3.13:

1. Gradle configuration/build.
2. Chaquopy Python packaging.
3. Android application installation.
4. Database seed bootstrap.
5. RuntimeAdapter healthcheck.
6. Real CREATE/READ/UPDATE/DELETE path.
7. IMPORT_XLSX.
8. BACKUP and DRY_RUN RESTORE.
9. Full RESTORE.
10. Offline/no-network verification.
11. Security boundary verification.
12. Full Python regression suite.

## Acceptance

Stage 6 becomes PASS only after the real Android host is built and the end-to-end integration tests pass locally.

Until then:

**Stage 6 = NOT BASELINED.**
