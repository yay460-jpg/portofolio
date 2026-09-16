# MG1 / Lithosite V24.5 — ENGINE V2 FINAL CLEAN

Status: **FINAL CLEAN / LOCKED**

Basis:
- V24.5 current baseline previously cross-checked.
- Engine V2 adaptive runtime validated with C1 → C2 test instrumentation.
- The test instrumentation is **not included** in this final runtime.

## Engine V2 retained

- Device Profiler Engine V2
- Tile Engine Profile
- C1 Viewport Planner
- C2 Adaptive Window
- BASE + DETAIL
- Tile Identity
- Runtime Queue
- Runtime Tile Loader / Runtime Tile Creation
- Persistent Tile Store / IndexedDB V2
- GeoReference handoff
- Geometry Contract V1
- V24.5 map lifecycle / storage / management contracts

## Removed from final runtime

- C1 → C2 test instrumentation and published test object
- Profiler UI/icon diagnostic layer
- Removed/dead Engine V2 experimental paths identified in the cleanup pass
- Stale 1.55x experiment wording

## Validation evidence

Latest field test:
- C1: `ok=true`, tier `BALANCED`, zoom `1.25`, factor `0.25`, tileSize `256`
- C2: `enabled=true`, `baseFull=true`
- DETAIL: `70 total`, `70 selected`, `0 skipped`
- Render: `76 planned`, `76 rendered`, `0 failed`
- Map displayed successfully.

The 70/70 result is accepted as a valid result for the available GeoPDF; it is not a requirement that every test produce skipped tiles.

## Protection rules

- Do not mix V25 DB4 into V24.5.
- Do not reintroduce temporary geometry compensation or percentage tuning.
- Do not hard-pin a global tile budget of 100.
- Do not reintroduce Profiler UI as a runtime dependency.
- Test instrumentation remains outside production runtime.

## Modified runtime hashes

- `scripts/peta.js` — `ba6a4814a44b3af365089dd52961c563e897a5f04a7334fc6461885e03d52f2a`
- `scripts/map/map-interaction.js` — `d7277b2478aaa01a6c1a20854620cb4bb5831b20e56a5bed9cd265fb1a24afc7`
- `scripts/map/map-tile-pyramid.js` — `80b20ce24ab2f67602f094214e509d8ff69a0a3c4b7f25e65ea12efacff34cf7`
- `scripts/map/map-tile-queue.js` — `4280d0308ce1c772b2d73cb627f472d8ae8243f5862e86e0909d445235fd512a`
- `scripts/map/map-runtime-loader.js` — `78c317d4c00e1d7b9aba083128fa56760ecbb14e652c9a6cd89d85587834b5a5`
- `scripts/map/map-missing-detail-resolver.js` — `6fa3cb14794dab5133655b2135fd4f21aac6edfbed573528fb4902e62ba7a47e`
- `sw.js` — `40b2f4e5e33e5e21d78f1cb3a5bb5bbf4eb32d0094e84362254cd991813f5f46`
