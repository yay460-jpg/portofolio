# Stage 19.2 — Coordinate System

## Decision

The Mine Services Map Engine uses an explicit coordinate model. A coordinate always carries its CRS descriptor.

No CRS is inherited from Mine Geologist and no project CRS is hard-coded at this stage because the current Mine Services runtime/UI contracts do not yet expose authoritative spatial-reference fields.

## Coordinate

```text
Coordinate
├── x
├── y
└── crs
    ├── id
    ├── type
    ├── axis
    └── units
```

Supported CRS types:
- projected
- geographic

Supported axis declarations:
- xy
- lonlat
- latlon

Default units are `meter` for projected CRS and `degree` for geographic CRS, but callers may provide an explicit unit.

## Rules

1. x and y must be finite numbers.
2. CRS id is mandatory.
3. Coordinates cannot silently mix CRS definitions.
4. Coordinate transformation between different CRS definitions is not implemented in Stage 19.2.
5. Transformation belongs to a later coordinate-transform stage once the authoritative Mine Services CRS is defined.

## Platform boundary

The coordinate model has no DOM, renderer, mapping-library, or Android dependency.

## Next

Stage 19.3 — Viewport Engine will consume this coordinate model.