# Stage 6 — Host Bridge Decision

## Decision

The existing Lithosite Mine Geologist runtime is a browser/PWA application, while Mine Services runtime is Python. The repository currently contains Android architecture/documentation material but does not contain a native Android Gradle/Kotlin application host.

Therefore Stage 6 must not claim an end-to-end Android integration yet.

The selected target host architecture is:

    Lithosite Android Host
        |
        +--> Lithosite UI
        |
        +--> Mine Services Bridge
        |
        v
    Embedded Python Runtime
        |
        v
    Mine Services RuntimeAdapter
        |
        v
    Offline PersistenceStore

For the Android host, the implementation target is an embedded Python runtime using Chaquopy. Chaquopy provides Android Studio/Gradle integration and APIs for calling Python from Java/Kotlin. The current upstream documentation identifies Chaquopy 17.0 as the current release and supports Python 3.14; the project must pin a tested toolchain rather than tracking an unpinned moving version. See the official documentation: https://chaquo.com/chaquopy/documentation/ 

## Why Embedded Python

Mine Services is already implemented and tested as a Python runtime. Embedding that runtime keeps the authoritative domain, validation, transaction, audit, import, backup, restore, and persistence logic in one implementation.

The Android host therefore becomes an integration shell rather than a second implementation of Mine Services.

This avoids:

- duplicating the A.1 data model in Kotlin;
- creating a second validation engine;
- introducing Android-side persistence which could diverge from the offline contract;
- translating domain rules into a separate UI database;
- replacing the Stage 5 RuntimeAdapter with ad-hoc UI calls.

## Host Flow

    Lithosite Android UI
        |
        v
    Mine Services Bridge
        |
        v
    RuntimeAdapter
        |
        v
    ApplicationService / Import / Snapshot
        |
        v
    Offline PersistenceStore
        |
        v
    Mine-Services-Database.xlsx runtime store

## Bridge Responsibilities

The bridge is not allowed to implement Mine Services domain logic.

The bridge only:

- builds the request envelope;
- preserves request_id;
- invokes the embedded RuntimeAdapter;
- returns the runtime response;
- maps host/runtime transport failures to stable host errors;
- prevents direct UI access to repositories and persistence.

## Offline Rule

Mine Services remains fully offline.

The Android host must not replace Mine Services persistence with:

- IndexedDB;
- localStorage;
- Google Apps Script;
- a remote API;
- a second Android database containing a parallel Mine Services schema.

The existing Mine Geologist browser/PWA network backend is a separate concern and must not be used as the Mine Services persistence layer.

## Android Implementation Gate

A real Android host implementation may proceed only when a native Android Gradle project is present or explicitly created.

Required host components:

1. Android application module.
2. Web/UI host or native UI surface.
3. Mine Services bridge.
4. Embedded Python runtime.
5. RuntimeAdapter invocation layer.
6. Application-private offline data path.
7. Request/response serialization boundary.
8. Host integration tests.
9. Security review of Python/runtime file access.
10. End-to-end test against the real runtime.

Until these exist and are tested, Stage 6 remains NOT BASELINED.

## Toolchain Rule

The Chaquopy version, Android Gradle Plugin version, Gradle version, Kotlin version, minSdk, targetSdk, and Python runtime version must be pinned in the Android host project and recorded in the Stage 6 baseline.

No toolchain version is considered locked merely because it is current upstream.

## Reference

Official Chaquopy documentation: https://chaquo.com/chaquopy/documentation/

## Status

Host architecture selected: PASS

Native Android host present in repository: NO

Embedded Python strategy selected: PASS

RuntimeAdapter integration implemented: PENDING

End-to-end Android execution: PENDING

Stage 6 baseline: NOT READY
