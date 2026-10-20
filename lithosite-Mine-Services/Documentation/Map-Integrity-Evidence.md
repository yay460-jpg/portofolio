# Stage 20.8Q — Documentation & Map Integrity Evidence

## Status

**Stage:** V32 / Stage 20 — Map Integrity  
**Substage:** 20.8Q — Documentation & Map Integrity Evidence  
**Status:** COMPLETE  
**Scope:** Documentation, traceability, architecture/boundary evidence, Issue #22 update, and final regression evidence.

> Map Integrity is treated as a spatial-integrity layer. It must preserve coordinate authority, domain identity, marker integrity, and the separation between domain records and spatial representation.

---

## 1. Final Map Integrity Principle

The Stage 20 Map Integrity implementation establishes the following boundary:

```
Domain Record
    |
    | source_entity + source_id
    v
MapMarker
    |
    | explicit E / N / Elevation
    v
Map / Top View / 3D spatial representation
```

The MapMarker is a **spatial representation/reference** of a domain record. It is not a second HSE, Equipment, or WorkFront database.

### Coordinate authority

- **MapMarker** is authoritative for spatial coordinates: Easting, Northing, Elevation.
- **DomainRecord** remains authoritative for domain attributes.
- A domain `location` text field is **not** converted implicitly into coordinates.
- No coordinate is invented when an explicit spatial reference is absent.
- Marker interaction must not silently mutate the domain record.

---

## 2. 20.8 Traceability

### 20.8A — Baseline & Safety Check

Established the safety boundary for Map Integrity work.

Protected/stable behavior:

- Top View lighting/rendering
- Top View / 3D / 360 camera behavior
- coordinate system and coordinate picking
- measurement A→B
- A/B coordinate readout
- bearing and distance
- existing map rendering behavior

Map Integrity changes were kept separate from these stable mechanisms.

### 20.8B — Existing Architecture Audit

Confirmed that the map uses the shared spatial/rendering architecture rather than creating an independent coordinate engine.

Relevant map stack:

```
topo3d-engine.js
        |
        +-- geo-engine.js
        |
        +-- geo-adapter.js
        |
        +-- map-engine.js
        |
        +-- marker-location.js
```

The marker layer is integrated into the existing map rendering lifecycle.

### 20.8C — Central Marker Model

Established the central marker model:

```
marker_id
marker_type
label
easting
northing
elevation
source_entity
source_id
status
```

This model provides one common spatial representation for all marker types.

### 20.8D — Marker Rendering

Implemented the central marker render layer.

Rendering uses the shared map engine projection:

```
engine.projectCoordinate(easting, northing, elevation)
```

This keeps marker placement tied to the same spatial coordinate system used by the map.

### 20.8E — Marker Placement

Added explicit marker placement through:

- `setMarkerLocation()`
- `placeMarker()`

Placement requires explicit spatial coordinates.

No location string is treated as an implicit coordinate source.

### 20.8F — Marker Types

Established the central marker type definitions:

- HSE
- ASSET
- FACILITY
- WORKFRONT
- STOCKPILE
- DISPOSAL
- DRAINAGE
- WORKSHOP
- OTHER

Each marker type has a controlled visual definition.

### 20.8G — Marker Visibility

Implemented visibility filtering without deleting marker data.

Supported behavior includes:

- All
- type-specific filtering
- show all
- hide all

Changing visibility does not mutate marker coordinates or source references.

### 20.8H — Marker Interaction

Implemented marker selection and interaction:

- `selectMarker()`
- `clearSelectedMarker()`
- `getSelectedMarker()`
- `handleMarkerClick()`

Selection is UI state and does not mutate domain data.

### 20.8I — Domain Linking

Established the controlled domain mapping:

```
HSE        -> HSE
ASSET      -> Equipment
WORKFRONT  -> WorkFront
FACILITY   -> Facility
STOCKPILE  -> Stockpile
DISPOSAL   -> Disposal
DRAINAGE   -> Drainage
WORKSHOP   -> Workshop
OTHER      -> Other
```

The relationship is represented by:

```
source_entity + source_id
```

### 20.8J — HSE Spatial Record

Added HSE-specific spatial marker creation and lookup.

Important boundary:

- HSE spatial representation is linked through `source_entity/source_id`.
- Existing HSE domain schema remains authoritative for HSE attributes.
- No unsupported `equipment_id` field is assumed to exist in the current HSE schema.

### 20.8K — Runtime / Persistence

Established opt-in A.3 MapMarker persistence while preserving A.2 as the default runtime schema.

A.2 remains the default:

```
SCHEMA_VERSION = A.2
```

A.3 introduces the MapMarker entity with:

```
marker_id
marker_type
label
easting
northing
elevation
source_entity
source_id
status
```

The migration boundary is safe:

- source A.2 remains unchanged
- A.3 is an explicit target
- MapMarker is introduced as a separate entity
- no implicit coordinate fields are added to existing domain entities

Runtime/persistence validation covered CRUD, validation, import, snapshot/restore, audit behavior, and schema-aware handling.

### 20.8L — Domain → Spatial Marker Adapter

Established:

```
createDomainSpatialMarker(input)
```

Required spatial inputs:

- `source_entity`
- `source_id`
- `marker_type`
- `easting`
- `northing`
- `elevation`

The adapter rejects:

- missing explicit coordinates
- non-finite coordinates
- source_entity / marker_type mismatches

The adapter does not parse domain location text into coordinates.

### 20.8M — Runtime Behavior Validation

Runtime tests verified domain-to-marker creation for:

- Equipment → ASSET
- WorkFront → WORKFRONT
- HSE → HSE

Also verified:

- domain record immutability
- rejection of source/type mismatch
- rejection of WorkFront.location as a coordinate source

### 20.8N — Spatial Link Integrity

Established:

```
resolveDomainSpatialLink()
```

Supported integrity states:

- `MISSING_MARKER`
- `ORPHAN`
- `UNVERIFIED`
- `VALID`
- `BROKEN`

Orphan/broken markers are retained and reported. They are not silently deleted or rewritten.

### 20.8O — Domain Spatial Sync Contract

Established:

```
buildDomainSpatialSyncPlan()
```

The sync plan is explicitly read-only.

It records:

- marker identity
- domain identity
- marker state
- domain record
- spatial authority
- domain authority
- `NO_SPATIAL_MUTATION`

The contract prevents accidental writes from map interaction back into domain records.

### 20.8P — Runtime Spatial Synchronization Boundary

Final boundary tests enforce:

- spatial sync is read-only
- no domain write operation is exposed through the sync boundary
- no domain coordinate fields are injected by the sync plan
- BROKEN and ORPHAN states are preserved
- the central API remains the single marker/spatial boundary

---

## 3. Current Data Model Boundary

The current A.2 domain schemas do **not** contain Easting/Northing/Elevation fields for Equipment, WorkFront, or HSE.

Therefore the safe model is:

```
Equipment / WorkFront / HSE
        |
        | domain identity
        v
source_entity + source_id
        +
explicit spatial coordinate source
        |
        v
MapMarker
```

### Explicit spatial input example

```js
{
  source_entity: "Equipment",
  source_id: "EQ-001",
  marker_type: "ASSET",
  easting: 53364.669,
  northing: 397465.680,
  elevation: 51.571
}
```

This example demonstrates the contract only. It does not imply that those coordinates belong to a production domain record.

---

## 4. Visual / Browser Evidence

Map Integrity was visually validated during Stage 20:

### Projection

- Top View marker projection: PASS
- 3D marker projection: PASS
- 360/camera behavior: PASS
- marker and A/B measurement coexistence: PASS

### Marker identity / selection

The marker selection API was exercised with a test marker and returned its complete spatial/domain reference:

```
marker_id: DEV-MARKER-001
marker_type: HSE
label: TEST HSE
easting: 53364.669
northing: 397465.68
elevation: 51.571
source_entity: HSE
source_id: DEV-HSE-001
status: ACTIVE
```

### Visibility

The following behavior was validated:

```
setMarkerVisibilityFilter(["HSE"])
setMarkerVisibilityFilter([])
getMarker("DEV-MARKER-001")
showAllMarkers()
```

The marker remained intact after visibility changes.

### Type visualization

Validated visual distinction:

- HSE → red
- ASSET → orange
- WORKFRONT → green

The type visualization changes appearance only; spatial coordinates remain unchanged.

### Top View lighting

Top View lighting remained stable during marker integration.

No regression was introduced to the previously stable map lighting behavior.

---

## 5. Regression Evidence

The final Stage 20 Map Integrity regression result reached:

```
212 passed in 4.49s
```

The regression includes the Map Integrity implementation and the final runtime spatial synchronization boundary tests.

Key progression checkpoints included:

```
190 passed
193 passed
197 passed
202 passed
207 passed
212 passed
```

The final 212-test result is the evidence used for completion of Stage 20.8Q.

---

## 6. Architecture Boundary — Final

### Domain side

Domain entities remain responsible for domain information:

- Equipment
- WorkFront
- HSE
- other operational entities

### Spatial side

MapMarker remains responsible for:

- marker identity
- marker type
- label
- Easting
- Northing
- Elevation
- source entity
- source record identity
- spatial marker status

### Prohibited implicit behavior

The implementation must not:

- infer coordinates from a free-text location
- invent coordinates
- overwrite domain records from marker movement
- create a second HSE spatial database
- silently convert domain fields into spatial fields
- delete orphan/broken markers automatically

### Required explicit behavior

A spatial relationship must be based on:

```
source_entity
+
source_id
+
explicit E/N/Elevation
```

---

## 7. Issue #22 Evidence

Issue #22:

**Stage 20.8K MapMarker runtime persistence validation**

Issue tracking was used throughout the Map Integrity implementation to record the runtime/persistence boundary and subsequent MapMarker/domain-link validation.

The final Stage 20.8Q evidence records the completion of the broader Map Integrity sequence through 20.8P and the final regression result of **212 passed**.

---

## 8. Final Stage 20.8Q Acceptance

| Area | Result |
|---|---|
| Central MapMarker model | PASS |
| Central rendering layer | PASS |
| Explicit coordinate placement | PASS |
| Marker type definitions | PASS |
| Visibility filtering | PASS |
| Marker selection | PASS |
| Domain source linking | PASS |
| HSE spatial reference | PASS |
| A.2 default schema preserved | PASS |
| A.3 opt-in MapMarker schema | PASS |
| Runtime persistence boundary | PASS |
| Domain → spatial adapter | PASS |
| Spatial link integrity | PASS |
| Read-only spatial sync boundary | PASS |
| Top View projection | PASS |
| 3D projection | PASS |
| 360/camera coexistence | PASS |
| Measurement coexistence | PASS |
| Top View lighting stability | PASS |
| Final regression | **212 passed** |

---

## 9. Stage 20.8Q Conclusion

**Stage 20.8Q is COMPLETE.**

Map Integrity documentation and evidence now establish a complete traceability chain from domain identity to explicit spatial representation while preserving the existing map coordinate/rendering system and domain-data authority.

The Stage 20.8 implementation is therefore considered **documented and evidenced**.

The next work should be feature/value oriented rather than another contract-only Map Integrity substage.
