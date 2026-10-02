# Marker Location — Global Spatial & Domain-Link Contract

## Purpose

Marker Location is the centralized spatial reference gateway for Mine Services. It represents a location on the map using explicit Easting, Northing, and Elevation and may optionally be linked to a domain record.

The Marker Location model is intentionally broader than the domain tables. A marker may be:
1. Domain-linked — spatial marker is explicitly associated with a domain record.
2. Global spatial — spatial marker is a standalone map reference and does not require a domain record.

This distinction is part of the Stage 20 baseline contract.

## 1. Marker Classes

### 1.1 Domain-linked spatial markers

Only these three marker types require a domain source:

| Marker Type | Source Entity | Source ID | Purpose |
|---|---|---|---|
| HSE | HSE | Required | Spatial reference to a specific HSE record/event |
| Asset / Equipment | Equipment | Required | Spatial reference to a specific equipment record |
| WorkFront | WorkFront | Required | Spatial reference to a specific WorkFront record |

For these three types:
- source_entity is required.
- source_id is required.
- The source entity must match the marker type.
- Active duplicate source links are rejected.
- Equipment, WorkFront, and HSE source records are selected from runtime records in the Marker Location UI.
- The selected source record supplies Source ID and an automatic label.
- Spatial coordinates remain authoritative for the map location; the domain record does not replace E/N/Z.

### 1.2 Global spatial markers

These types are intentionally global spatial and do not require a domain source:

| Marker Type | Maximum ACTIVE spatial markers | Typical use |
|---|---:|---|
| Facility | 3 | Medical/clinic, site office, employee mess/camp |
| Workshop | 2 | Main equipment workshop, light/support vehicle workshop |
| Stockpile | 3 | Main, secondary, temporary stockpile |
| Disposal | 5 | Waste disposal, OB disposal, topsoil disposal, in-pit dump, temporary disposal |
| Drainage | 3 | Main/critical drainage or dewatering spatial references |
| Other | 3 | Canteen, security post, and other site-specific locations |

For global spatial markers:
- source_entity is empty.
- source_id is empty and not required.
- label is manually entered by the operator.
- E/N/Z remain required.
- marker_id remains available for explicit identification and otherwise may be auto-generated.
- The marker itself is the spatial reference.
- Global markers are not treated as broken/orphaned domain links; their link status is NOT_LINKED.

## 2. Spatial Marker Limits

Limits are operational spatial-location limits, not domain-record limits.

| Marker Type | ACTIVE limit |
|---|---:|
| Equipment / Asset | 5 |
| WorkFront | 5 |
| HSE | 5 |
| Facility | 3 |
| Workshop | 2 |
| Stockpile | 3 |
| Disposal | 5 |
| Drainage | 3 |
| Other | 3 |

The limit is counted only for markers with status = ACTIVE.
INACTIVE and REMOVED markers do not consume capacity.

A domain may therefore contain more records than its spatial marker limit. Example: 20 equipment records may exist while only 5 Equipment spatial markers are active.

The UI displays capacity as active / limit.

## 3. Duplicate Rules

### Domain-linked types

One ACTIVE spatial marker may be assigned to one domain source.

Example:
Equipment + EQ-20261001-YCP0

may have only one ACTIVE spatial marker.

A second marker using the same active source pair is rejected.

If the previous marker becomes INACTIVE or REMOVED, the source is no longer locked by that marker and may be spatially assigned again.

### Global spatial types

Global spatial markers do not use source_id uniqueness because there is no domain source.

Distinct global locations are identified by their marker ID and label/spatial coordinates.

Example:
- Main Stockpile
- Secondary Stockpile
- Temporary Stockpile

are valid separate global spatial markers up to the Stockpile limit.

## 4. UI Behavior

### Domain-linked flow

Marker Type → Source Entity → Source Record dropdown → automatic label → Pick on Map → Add Marker

The operator does not need to leave the Site Map to search for the domain ID.

### Global spatial flow

Marker Type → Global Spatial → manual label → Pick on Map → Add Marker

Source ID is explicitly shown as not required.

This avoids artificial dependencies on domain tables that do not provide a meaningful source record for the spatial location.

## 5. Central Marker Data Model

The marker remains centralized:
- marker_id
- marker_type
- label
- easting
- northing
- elevation
- source_entity
- source_id
- status

The source fields are optional at the model level but mandatory for the three domain-linked marker types created through the domain spatial adapter.

Spatial coordinates remain explicit and authoritative for Marker Location.

## 6. Domain Spatial Adapter Boundary

createDomainSpatialMarker remains intentionally strict.

It is used for:
- HSE
- Equipment
- WorkFront

It requires:
- source entity
- source ID
- marker type matching the source entity
- explicit E/N/Elevation

Global spatial markers bypass this domain adapter and use the central createMarker path with empty source fields.

This preserves one centralized marker store while keeping domain traceability and global spatial referencing semantically separate.

## 7. Persistence Boundary

Stage 20 does not change the default A.2 domain schemas.

Marker Location remains an in-memory spatial marker model at this stage.

Persistent MapMarker/A.3 migration remains an explicit opt-in boundary and is not silently enabled by the global spatial marker contract.

## 8. Operational Examples

### Equipment
DT-TEST-001 → EQ-20260930-SCI8 → spatial coordinates

### WorkFront
Pit Test Area → WorkFront source record → spatial coordinates

### HSE
Inspection → HSE source record → spatial coordinates

### Facility
Site Office → global spatial → spatial coordinates

### Workshop
Main Equipment Workshop → global spatial → spatial coordinates

### Stockpile
Main Stockpile → global spatial → spatial coordinates

### Disposal
In-Pit Waste Dump → global spatial → spatial coordinates

### Other
Security Post → global spatial → spatial coordinates

## 9. Stage 20 Baseline Rule

The following distinction is part of the baseline and must be preserved in later stages:

HSE / Equipment / WorkFront = domain-linked spatial markers.

Facility / Workshop / Stockpile / Disposal / Drainage / Other = global spatial markers.

Future work must not reintroduce a mandatory domain Source ID for global spatial marker types unless a new explicit contract is approved.
