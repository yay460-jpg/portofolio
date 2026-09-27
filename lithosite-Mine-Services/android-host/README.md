# Mine Services Android Host

This directory is the concrete Android host implementation boundary for Mine Services Stage 6.

## Runtime

- Android application
- Chaquopy 17.0.0
- Python 3.13
- Mine Services RuntimeAdapter
- offline XLSX persistence
- A.1 database seed from ../Database/Mine-Services-Database.xlsx

## Build Preconditions

- Android Studio with a compatible Android Gradle Plugin toolchain
- JDK 17
- Python 3.13 available to Gradle as py -3.13
- Android SDK API 37

## Boundary

Android UI calls the host bridge. The bridge invokes android_entry.py, which constructs the real Mine Services RuntimeAdapter and points PersistenceStore at the application's private database copy.

The Android layer does not implement validation, transaction, audit, import, restore, or domain rules.

## Stage 6 Status

Host project scaffold: IMPLEMENTED
Real RuntimeAdapter invocation path: IMPLEMENTED
Seed-copy bootstrap: PENDING
End-to-end Android build/test: PENDING

Do not mark Stage 6 PASS until the project is built and executed locally on an Android target.
