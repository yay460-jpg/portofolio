# Security Evolution

## Purpose

This page documents the global security evolution of the application security architecture.

This document is intentionally **version-neutral**. It describes the security boundary, threat model, validation layers, and defensive rendering principles as reusable application-wide standards.

---

## 1. Security Evolution — Before

```text
┌──────────────────────────────┐
│       External Map Package   │
│            .mg1map            │
└──────────────┬───────────────┘
               │
               ▼
        ┌──────────────┐
        │ JSON.parse() │
        └──────┬───────┘
               │
               ▼
      ┌──────────────────┐
      │ Package Validate │
      │                  │
      │ Struktur valid?  │
      └────────┬─────────┘
               │
              YES
               │
               ▼
       ┌────────────────┐
       │  SHA-256 Check │
       │   Integrity    │
       └───────┬────────┘
               │
              PASS
               │
               ▼
        ┌──────────────┐
        │   IndexedDB  │
        └──────┬───────┘
               │
               ▼
       ┌─────────────────┐
       │ Map Library /   │
       │ Map Renderer    │
       └────────┬────────┘
                │
                ▼
          ┌────────────┐
          │ innerHTML  │
          │ SVG href   │
          │ img src    │
          └─────┬──────┘
                │
                ▼
        ⚠️ TRUST BOUNDARY
                │
                ▼
       Potential DOM XSS
```

### Core weakness

Integrity verification answered whether a package was intact, but did not by itself establish that every persisted payload was safe to place into an HTML, SVG, or URL context.

```text
SHA-256 integrity
        ≠
content trust
```

---

## 2. Security Evolution — After

```text
┌──────────────────────────────┐
│       External Map Package   │
│            .mg1map            │
└──────────────┬───────────────┘
               │
               ▼
        ┌──────────────┐
        │ JSON.parse() │
        └──────┬───────┘
               │
               ▼
       ┌──────────────────┐
       │ SHA-256 Integrity│
       │                  │
       │ Package intact?  │
       └────────┬─────────┘
                │
              PASS
                │
                ▼
     ┌─────────────────────────┐
     │ Content Security        │
     │ Validation              │
     │                         │
     │ • Image URL             │
     │ • Tile dataUrl          │
     │ • Tile Identity         │
     │ • Tile Geometry         │
     │ • Package fields        │
     └───────────┬─────────────┘
                 │
          ┌──────┴──────┐
          │             │
        VALID         INVALID
          │             │
          ▼             ▼
    ┌──────────┐    ┌──────────┐
    │ IndexedDB│    │  REJECT  │
    └────┬─────┘    └──────────┘
         │
         ▼
 ┌─────────────────────┐
 │ Map Library         │
 │                     │
 │ Trusted rendering   │
 │ boundary            │
 └──────────┬──────────┘
            │
            ▼
 ┌──────────────────────┐
 │ Defensive Renderer   │
 │                      │
 │ Validate before DOM  │
 └──────────┬───────────┘
            │
       ┌────┴─────┐
       ▼          ▼
    HTML DOM    SVG DOM
       │          │
       ▼          ▼
      SAFE       SAFE
```

---

## 3. Stored XSS Protection Evolution

### Before

```text
ATTACKER
   │
   ▼
Malicious Payload
   │
   ▼
.mg1map
   │
   ▼
SHA-256 VALID
   │
   ▼
IndexedDB
   │
   ▼
Map Library
   │
   ▼
innerHTML / SVG
   │
   ▼
⚠️ Browser DOM
```

### After

```text
ATTACKER
   │
   ▼
Malicious Payload
   │
   ▼
.mg1map
   │
   ▼
SHA-256
   │
   ▼
Content Security Validator
   │
   ├───────────────┐
   │               │
 INVALID          VALID
   │               │
   ▼               ▼
 REJECT          IndexedDB
                   │
                   ▼
             Defensive Renderer
                   │
                   ▼
                Browser DOM
                   │
                   ▼
                  SAFE
```

---

## 4. Global Security Layers

```text
                 APPLICATION SECURITY
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   INTEGRITY         CONTENT          RENDERER
   SECURITY          SECURITY         SECURITY
        │               │                │
        ▼               ▼                ▼
    SHA-256        Payload Rules      Safe DOM
        │               │                │
        │        ┌──────┼──────┐         │
        │        ▼      ▼      ▼         │
        │      Image   Tile   Geometry   │
        │        │      │       │        │
        └────────┴──────┴───────┴────────┘
                         │
                         ▼
                  IndexedDB / Runtime
                         │
                         ▼
                  Map Library / Map
                         │
                         ▼
                    SAFE RENDER
```

---

## 5. Security Boundary

The security boundary is:

```text
External / Imported Data
        │
        ▼
Integrity Check
        │
        ▼
Content Validation
        │
        ▼
Persistence
        │
        ▼
Defensive Rendering
        │
        ▼
DOM
```

Persisted data must remain treated as untrusted when it is read back. Storage is not a trust boundary by itself.

---

## 6. Validation Rules

### Image data

Allowed application image payloads:

```text
data:image/png;base64,...
data:image/jpeg;base64,...
data:image/webp;base64,...
```

Rejected examples:

```text
data:text/html,...
data:image/svg+xml,...
javascript:...
http://...
https://...
blob:...
```

### Tile identity

Tile identity follows the canonical structure:

```text
L<factor>_X<x>_Y<y>
```

The tile identity is validated against its expected grammar rather than being treated as arbitrary text.

### Tile geometry

Tile geometry must be:

- finite;
- numerically valid;
- non-negative where applicable;
- integer-based for tile coordinates;
- bounded by the level/tile dimensions;
- consistent with the expected tile size.

---

## 7. Integrity vs Content Trust

These are separate controls:

```text
Package
   │
   ├── SHA-256
   │      └── "Is the package intact?"
   │
   └── Content Validation
          └── "Is the payload acceptable?"
```

A valid hash does not make arbitrary package content trusted.

Both controls are required before imported content becomes persistent application data.

---

## 8. Defensive Rendering Principle

Avoid treating persisted or imported values as trusted HTML.

Preferred pattern:

```text
Text
  → textContent / value

URL
  → validate scheme and content
  → assign to DOM property

Tile identity
  → validate canonical grammar

HTML/SVG
  → generate only from validated/trusted components
```

The objective is not to remove every `innerHTML` use. The objective is to prevent untrusted data from reaching dangerous DOM contexts without the required validation or encoding.

---

## 9. Protected Architecture

Security hardening is isolated from the application's core operational architecture.

The following areas remain independent of the security boundary:

```text
Engine V2
Device Profiler
Quality Selection Policy
Safety / Authority Guard
Tile Queue
Map Lifecycle
Tile Identity architecture
GeoReference
Storage architecture
UI / Shell Boundary
```

Security changes should not be used as a reason to redesign these components unless a direct security dependency is demonstrated.

---

## 10. Security Test Model

Security validation uses benign, non-destructive payloads to verify rejection behavior.

Required tests:

```text
Valid PNG/JPEG/WebP              → ACCEPT
Valid application package        → ACCEPT

data:text/html                   → REJECT
data:image/svg+xml               → REJECT
javascript:                      → REJECT
Invalid tile identity            → REJECT
Malformed tile geometry          → REJECT
Malformed tile payload           → REJECT
```

Functional regression must also preserve:

```text
Import Map
    ↓
Map Library
    ↓
Activate
    ↓
Render
    ↓
Backup / Export
```

---

## 11. Security Design Outcome

The architectural evolution is:

```text
BEFORE

Integrity
   ↓
Storage
   ↓
Render


AFTER

Integrity
   ↓
Content Validation
   ↓
Storage
   ↓
Defensive Validation
   ↓
Render
```

The resulting principle is:

> **Never convert external or persisted data directly into executable or interpreted browser content without an appropriate security boundary.**

This is a global security architecture principle and is intentionally independent of application release/version naming.
