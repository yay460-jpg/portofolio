# MG1 / Lithosite V24.5 — ENGINE V2 FINAL CLEAN 50/80

**Status: FINAL CLEAN / LOCKED**

## Final architecture

```text
👑 RAJA
Device Profiler / Capability
        ↓
C1 Geometry Demand
        ↓
👤 WAKIL RAJA
Quality Selection — floor 50
        ↓
🛡️ GUARD RAJA
Authority + Safety Validation
        ↓
approvedSelection.selectedKeys
        ↓
Queue → Loader → Store / RAM
```

## Locked parameters

| Tier | tileSize | maxTiles | cacheLimit | cache/max ratio |
|---|---:|---:|---:|---:|
| LOW | 768 | 50 | 80 | 1.60x |
| BALANCED | 256 | 100 | 150 | 1.50x |
| HIGH | 512 | 200 | 300 | 1.50x |

Global policy:
- `QUALITY_FLOOR = 50`
- `MAX_EXPANSION_RADIUS = 20`
- `fullUploadFactors = [0.25, 0.5, 1, 2]`

## Final behavior contract

- C1 is geometry demand only.
- Wakil applies the quality floor; it does not replace Raja's device capability decision.
- Guard validates authority and safety before runtime execution.
- Visible tiles remain mandatory.
- `maxTiles` is capability/processing ceiling; `cacheLimit` is cache/storage eviction capacity.
- Upload phase is full-factor/store preparation and is not viewport-only C2 culling.
- Runtime phase selects from the prepared Store according to C1 + quality policy + Guard.
- Queue, Loader, and Telemetry consume the same approved selection source.
- Canonical tile IDs come from `makeLithositeTileId_()`.
- Expansion is bounded to radius 20.

## Root-heat correction

Superseded pattern:

`viewport-only upload (~18) → runtime floor 50 → large MISS/PDF re-render workload`

Locked pattern:

`full-factor upload/store preparation → runtime selection up to floor 50 → reuse stored tiles → cache capacity 80`

The latter is the intended contract. Runtime testing remains the final empirical proof of HIT/MISS and thermal behavior.

## Modified runtime files in this baseline update

Exactly three files differ from the source V24.5 baseline:

- `scripts/map/map-device-profile.js`
- `scripts/map/map-tile-pyramid.js`
- `scripts/peta.js`

## SHA-256 of modified files

- `scripts/map/map-device-profile.js` — `b6bc0b7f46eec051a0c15af996820f2074b3f0ba058a4b800e95cfb4396f2e3d`
- `scripts/map/map-tile-pyramid.js` — `c79372537b60a63103eee53434ce2b716b25b260296597fc970e168bf1035c5c`
- `scripts/peta.js` — `d19e23e0fcb3601b15825d457be4b42fa269d13d6f1e2ea947fbf77c9a82bd81`

## Explicitly excluded from this baseline

- V6 `MIN=25` / FloorFix branch
- experimental budget branches not present in the locked contract
- Layout/UI redesign changes
- V25 DB4/runtime files
- temporary profiler/test instrumentation
