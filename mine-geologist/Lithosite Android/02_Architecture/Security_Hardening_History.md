# Security Hardening History

**Project:** Lithosite Android  
**Document type:** Security hardening history and implementation status  
**Document status:** Living engineering document  
**Current documented security stage:** Step 20 — Security Boundary Audit  

---

## 1. Purpose

Dokumen ini mencatat evolusi **implementasi security yang spesifik terhadap tahap pengembangan**.

Dokumen ini **bukan** pengganti `02_Architecture/Security_Evolution.md`.

`Security_Evolution.md` tetap menjadi dokumen global dan version-neutral yang mendefinisikan:

- security boundary;
- threat model;
- integrity dan content trust;
- content validation;
- defensive rendering;
- security test model;
- prinsip keamanan yang berlaku lintas versi.

Dokumen ini hanya mencatat **audit, pekerjaan hardening, status implementasi, validasi, dan pekerjaan berikutnya**.

---

## 2. Document Relationship

```text
02_Architecture/
└── Security_Evolution.md
       │
       │ Global security architecture
       │ Version-neutral contract
       ▼
05_Version-History/
└── Security_Hardening_History.md
       │
       │ Stage-specific implementation record
       ▼
   Audit → Hardening → Validation → Lock
```

---

## 3. Security Stage Status

| Stage | Scope | Status | Evidence / Note |
|---|---|---|---|
| Step 20 | Security Boundary Audit | **PASS — Audit Complete** | Attack-surface review completed; runtime code was not changed by the audit artifact. |
| Step 21A | Remaining XSS Hardening | **PLANNED** | Candidate dynamic HTML/status/error sinks identified; implementation and runtime validation not yet completed. |
| Step 21B | Resource Boundary Hardening | **PLANNED** | Resource-exhaustion surfaces identified for map packages, KML, GeoTIFF, and image/photo inputs. |
| Step 21C | Dependency Hardening | **PLANNED** | Floating CDN dependencies identified for review and pinning. |
| Step 21D | Session Hardening | **PLANNED** | Client-side session credential exposure identified for review; backend query-string contract remains separate technical debt. |

> **Important:** A stage is not `LOCKED` merely because a design or patch proposal exists. `LOCKED` requires implementation, static validation, runtime validation, and documentation of the resulting baseline.

---

## 4. Step 20 — Security Boundary Audit

### Scope

The audit reviewed the application's principal security surfaces, including:

- dynamic HTML rendering and potential XSS sinks;
- imported `.mg1map` package processing;
- KML parsing;
- GeoTIFF processing;
- image and photo handling;
- client-side session credential storage and transport;
- external CDN dependencies;
- dynamic code execution patterns;
- prototype-pollution indicators;
- `postMessage` handling;
- redirect handling.

### Findings

#### 4.1 XSS / Dynamic Rendering

Potential hardening targets remain in several UI paths where dynamic values can reach HTML templates or status/error messages.

The existence of `innerHTML` by itself is not treated as an exploit. Each sink must be evaluated according to the source of the interpolated value and the DOM context in which it is used.

#### 4.2 Resource Exhaustion

The following input classes require explicit resource-boundary review:

```text
.mg1map package
KML
GeoTIFF
map images / tile payloads
TP photos / profile photos
```

The audit identified places where large or malformed input may cause substantial parsing, decoding, allocation, or canvas work.

#### 4.3 Session Credential Exposure

The audit identified client-side bearer-token handling that deserves hardening, including storage in browser storage and use in request construction.

Any change must preserve the existing backend authentication contract unless a direct dependency requires coordinated backend work.

#### 4.4 Dependency / Supply Chain

The frontend currently references external browser dependencies from CDN origins. Floating versions require review because the executed dependency can change independently of the application source revision.

#### 4.5 Areas Without a Confirmed Exploit

The audit did not establish a confirmed application-level exploit for:

- arbitrary `eval` / `new Function` execution;
- input-driven open redirect;
- application-level `postMessage` abuse;
- a confirmed prototype-pollution path.

These findings are recorded as audit results, not as a guarantee that future code cannot introduce such issues.

---

## 5. Hardening Order

The planned hardening order is:

```text
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

Each stage must follow:

```text
Source Audit
    ↓
Owner / Dependency Check
    ↓
Minimal Change
    ↓
Static Validation
    ↓
Runtime Validation
    ↓
Documentation
    ↓
Lock
```

---

## 6. Protected Architecture

Security hardening must not incidentally redesign unrelated runtime architecture.

The following areas remain protected unless a direct security dependency is demonstrated:

```text
Engine V2
Device Profiler
Tile Engine
Map Lifecycle
Map Library
GeoReference / Coordinate Contract
DTM + STR Parser
Topo3D Engine
Save / Restore V2
```

A security patch must identify its direct dependency before crossing one of these boundaries.

---

## 7. Baseline Rule

The global security contract remains:

```text
External / Imported Data
        ↓
Integrity Check
        ↓
Content Validation
        ↓
Persistence
        ↓
Defensive Rendering
        ↓
DOM
```

Persisted data is not automatically trusted merely because it came from local storage or IndexedDB.

The implementation history may evolve by stage, but the global security principle remains version-neutral in `Security_Evolution.md`.

---

## 8. Lock Criteria

A security stage may be marked **LOCKED** only when all applicable conditions are satisfied:

- source change has a defined owner and dependency boundary;
- the change is minimal and scoped;
- syntax/static validation passes;
- relevant security tests pass;
- functional regression passes;
- runtime smoke test passes where applicable;
- Service Worker/cache version is updated when runtime files change;
- the resulting baseline is documented;
- no unrelated protected architecture was changed incidentally.

---

## 9. Current Position

At this documentation cleanup point:

```text
Global Security Architecture
        = Security_Evolution.md

Security Implementation History
        = Security_Hardening_History.md

Latest documented security stage
        = Step 20 — Audit Complete

Step 21A–21D
        = Planned / Not Locked
```

No future stage should be recorded as `LOCKED` until the implementation and validation evidence exists.
