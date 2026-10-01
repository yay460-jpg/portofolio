# Stage 20.9 — Domain → Map Interaction Evidence (PASS)

**Project:** Mine Services / V32 Stage 20  
**Focus:** Map Integrity  
**Stage:** 20.9 — Domain → Spatial Map Interaction  
**Status:** PASS / LOCKED  
**Evidence date:** 2026-10-02

## 1. Objective

Validate the first visible domain-to-map workflow without changing the established spatial authority model:

`Equipment / WorkFront / HSE` → `source_entity + source_id` → `MapMarker` → `Dashboard / Site Map`

The interaction must use an existing explicit spatial marker. It must not infer coordinates from domain text such as `WorkFront.location`, and it must not mutate the domain record.

## 2. Implemented behavior

### 2.1 Central interaction API

`MineServicesMarkerLocation.showDomainRecordOnMap(sourceEntity, sourceId)`

Behavior:

- validates the domain reference;
- searches MapMarker records by `source_entity + source_id`;
- returns `SPATIAL_LOCATION_NOT_ASSIGNED` when no spatial marker exists;
- when a marker exists, selects that marker;
- navigates to Dashboard and scrolls to the Site Map;
- returns `SHOWN_ON_MAP` with the resolved marker;
- does not generate coordinates;
- does not write or mutate the domain record.

### 2.2 Domain screens

The following screens expose **Show on Map**:

- Equipment
- Work Front
- HSE

When no explicit spatial marker exists, the screen reports:

`Spatial location not assigned for <Entity> <ID>.`

No marker is silently created in this case.

## 3. Browser visual validation

### Equipment

Validated with explicit marker:

- source entity: `Equipment`
- source ID: `EQ-20260930-SCI8`
- marker type: `ASSET`
- E: `53364.669`
- N: `397465.680`
- Elevation: `51.571`

Observed:

- marker rendered at the expected map position;
- marker label `TEST DT-001` visible;
- `showDomainRecordOnMap('Equipment', 'EQ-20260930-SCI8')` returned `SHOWN_ON_MAP`;
- `getSelectedMarker()` returned the corresponding marker.

### WorkFront

Validated with explicit marker:

- source entity: `WorkFront`
- source ID: `WF-20260930-EGB1`
- marker type: `WORKFRONT`
- E: `53364.669`
- N: `397465.680`
- Elevation: `51.571`

Observed:

- green WorkFront marker rendered;
- `getSelectedMarker()` returned the corresponding marker after the Show on Map interaction;
- domain `location` text was not converted into coordinates.

### HSE

Validated with explicit marker:

- source entity: `HSE`
- source ID: `HSE-20260930-80M8`
- marker type: `HSE`
- E: `53364.669`
- N: `397465.680`
- Elevation: `51.571`

Observed:

- HSE marker rendered with the HSE visual identity;
- marker selection was confirmed through `getSelectedMarker()`;
- marker lookup by HSE source reference returned the expected marker.

### Missing spatial location behavior

Equipment, WorkFront and HSE records without an explicit MapMarker displayed the spatial-location-not-assigned message.

This confirms that the interaction does not invent coordinates.

## 4. Regression validation

Latest user-run regression:

`216 passed in 4.43s`

The Stage 20.9 implementation and the subsequent Dashboard expand-table CSS correction were validated in the current main line.

## 5. Dashboard expand-table correction included before lock

A small non-spatial regression was found during final visual validation:

- the Expand Tables button changed state but the table content remained hidden;
- root cause: CSS expected `.expanded-tables` under `#dashboardScreen`, while JavaScript applies it to the top-level `.app`;
- selector scope was corrected to `.app.expanded-tables #dashboardScreen ...`.

The final visual state was validated:

- collapsed state hides table bodies;
- expanded state shows Recent Operations and Issues & Alerts;
- expansion overlays the lower map area instead of pushing/reflowing the map;
- collapse restores the compact map layout.

## 6. Integrity boundaries preserved

Stage 20.9 does **not**:

- add coordinate fields to the existing A.2 Equipment, WorkFront or HSE schemas;
- convert `WorkFront.location` into coordinates;
- write domain records from MapMarker;
- create spatial markers automatically when a record has no location;
- modify Top View / 3D / 360 camera behavior;
- modify measurement A→B behavior;
- create a second HSE spatial database.

Spatial authority remains:

- **DomainRecord:** domain/business attributes and identity;
- **MapMarker:** explicit spatial E/N/Elevation representation.

## 7. Stage 20.9 scope boundary

The following workflow is intentionally **not yet implemented**:

`MapMarker click → Domain Record detail → return to map`

Stage 20.9 locks only the validated **Domain → Map** direction.

## 8. Lock decision

**Stage 20.9 PASS / LOCKED.**

No additional contract-only work is required for this stage.

Next work should provide visible product value and remain isolated from the stable Top View / 3D / 360 / measurement foundation.
