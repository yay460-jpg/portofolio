# Lithosite --- Security Hardening History

## Purpose

This document records the implementation history of the security
hardening stages beneath the global, version-neutral security
architecture defined in `02_Architecture/Security_Evolution.md`.

It is a version-history record and does not replace or redefine the
global Security Evolution contract.

## 1. Documentation Position

``` text
02_Architecture/
└── Security_Evolution.md
    = Global security architecture
    = Version-neutral
    = Canonical security contract

05_Version-History/
└── Security_Hardening_History.md
    = Security implementation history
    = Stage validation and baseline record
```

## 2. Security Hardening Track

``` text
Step 20
Security Boundary Audit
        ↓
Step 21A
Remaining XSS Hardening
        ↓
Step 21B
Resource Boundary Hardening
        ↓
Step 21C
Dependency Hardening
        ↓
Step 21D
Session Hardening
```

The stages above have progressed through implementation, static
validation, runtime validation, and baseline documentation.

## 3. Security Stage Status

  ---------------------------------------------------------------------------
  Stage             Scope             Status            Evidence / Note
  ----------------- ----------------- ----------------- ---------------------
  Step 20           Security Boundary **PASS --- Audit  Attack-surface review
                    Audit             Complete**        completed. The audit
                                                        artifact itself did
                                                        not modify runtime
                                                        code.

  Step 21A          Remaining XSS     **LOCKED**        Implementation,
                    Hardening                           static validation,
                                                        runtime validation,
                                                        and resulting
                                                        baseline
                                                        documentation
                                                        completed.

  Step 21B          Resource Boundary **LOCKED**        Resource-exhaustion
                    Hardening                           boundaries
                                                        implemented and
                                                        validated for the
                                                        identified
                                                        map-package, KML,
                                                        GeoTIFF, image, and
                                                        photo input surfaces.

  Step 21C          Dependency        **LOCKED**        Dependency hardening
                    Hardening                           implemented,
                                                        statically validated,
                                                        runtime validated,
                                                        and documented in the
                                                        resulting baseline.

  Step 21D          Session Hardening **LOCKED**        Session credential
                                                        handling hardening
                                                        implemented,
                                                        statically validated,
                                                        runtime validated,
                                                        and documented; the
                                                        existing backend
                                                        query-string contract
                                                        remains a separately
                                                        documented technical
                                                        boundary.
  ---------------------------------------------------------------------------

### Lock Rule

A stage is recorded as **LOCKED** only after implementation, static
validation, runtime validation, and resulting documentation have been
completed.

Therefore:

``` text
21A = LOCKED
21B = LOCKED
21C = LOCKED
21D = LOCKED
```

## 4. Step 21A --- Remaining XSS Hardening

### Scope

Hardening of remaining dynamic HTML, identity, status, and error
rendering paths identified during the Step 20 security boundary audit.

### Objective

Prevent untrusted or externally influenced values from reaching
dangerous HTML contexts without the required escaping or defensive
rendering treatment.

### Status

**LOCKED**

### Validation

-   Implementation completed.
-   Static validation completed.
-   Runtime validation completed.
-   Resulting security baseline documented.

The hardening remains within the existing renderer/security boundary. It
does not redesign the core map, Topo3D, Tile Engine, Map Library, or
persistence architecture.

## 5. Step 21B --- Resource Boundary Hardening

### Scope

Resource-exhaustion protection for identified file and payload surfaces,
including:

-   `.mg1map` package input;
-   KML input;
-   GeoTIFF input;
-   map image input;
-   TP/photo image input.

### Objective

Prevent oversized or structurally excessive input from consuming
uncontrolled browser memory, parsing, raster, or DOM resources.

### Status

**LOCKED**

### Validation

-   Resource boundaries implemented.
-   Static validation completed.
-   Runtime validation completed.
-   Resulting baseline documented.

The hardening is treated as a resource boundary, not as a redesign of
the Topo3D DTM/STR engine or the existing map lifecycle.

## 6. Step 21C --- Dependency Hardening

### Scope

Hardening of externally loaded frontend dependencies, particularly
floating CDN dependency references.

### Objective

Reduce supply-chain uncertainty caused by dependencies whose version or
delivered content can change independently of the application source
baseline.

### Status

**LOCKED**

### Validation

-   Dependency hardening implemented.
-   Static validation completed.
-   Runtime validation completed.
-   Resulting baseline documented.

Local PDF.js architecture remains unchanged unless directly required by
the dependency hardening contract.

## 7. Step 21D --- Session Hardening

### Scope

Client-side session credential handling and the boundary between
frontend credential storage and the existing backend session contract.

### Objective

Reduce unnecessary exposure of the member session credential on the
client while preserving the existing authentication/session workflow.

### Status

**LOCKED**

### Validation

-   Session hardening implemented.
-   Static validation completed.
-   Runtime validation completed.
-   Resulting baseline documented.

The existing backend query-string session contract is recorded as a
separate technical boundary rather than being silently rewritten as part
of the frontend hardening stage.

## 8. Current Security Baseline

``` text
Security Evolution
(Global Architecture)
        │
        ▼
Step 20
Security Boundary Audit
        │
        ▼
Step 21A
XSS Hardening
LOCKED
        │
        ▼
Step 21B
Resource Boundary
LOCKED
        │
        ▼
Step 21C
Dependency Hardening
LOCKED
        │
        ▼
Step 21D
Session Hardening
LOCKED
```

This is the security hardening baseline represented by this document.

## 9. Protected Architecture

Security hardening does not imply ownership transfer or redesign of
unrelated application subsystems.

The following remain protected unless a direct dependency is
demonstrated:

``` text
Engine V2
Device Profiler
Quality Selection Policy
Safety / Authority Guard
Tile Queue
Map Lifecycle
Tile Identity
GeoReference
Map Library
Save / Restore V2
DTM + STR
Topo3D
Coordinate Bridge
UI / Shell Boundary
```

Security changes should remain bounded to the demonstrated security
dependency.

## 10. Engineering Record Rule

Future security work follows the same engineering lifecycle:

``` text
Source Audit
    ↓
Threat / Boundary Identification
    ↓
Owner / Dependency Map
    ↓
Minimal Implementation
    ↓
Static Validation
    ↓
Runtime Validation
    ↓
Regression Validation
    ↓
Documentation
    ↓
LOCK
```

A future security stage must not be marked `LOCKED` from a proposal
alone.

## 11. Relationship to Security Evolution

`Security_Evolution.md` remains the global, version-neutral security
architecture.

This history document records how that architecture is progressively
implemented and hardened in concrete application stages.

``` text
Security_Evolution.md
    = What the security architecture means
    = Global principles and boundaries

Security_Hardening_History.md
    = What was implemented
    = What was validated
    = Which stage is locked
```

Neither document replaces the other.
