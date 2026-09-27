# MG1 / Lithosite — V24.5 ENGINE V2 FINAL CLEAN 50/80 BASELINE

**Baseline status:** FINAL LOCKED / OBSERVE
**Baseline update:** Engine V2 Raja → Wakil Raja → Guard Raja, 50/80 contract
**Source baseline:** `a10040b2-2a58-49a9-a5e3-8e12ab782c64.zip`

## Locked Engine contract

### 👑 RAJA — Device Capability / Profiler
- LOW: `tileSize=768`, `maxTiles=50`, `cacheLimit=80`
- BALANCED: `tileSize=256`, `maxTiles=100`, `cacheLimit=150`
- HIGH: `tileSize=512`, `maxTiles=200`, `cacheLimit=300`
- `maxTiles` is an explicit processing/capability ceiling; it is not derived from `cacheLimit`.
- `fullUploadFactors=[0.25,0.5,1,2]` is present across tiers.
- Core device tier detection remains locked to the existing profiler inputs/benchmark.

### 👤 WAKIL RAJA — Quality Selection
- `QUALITY_FLOOR=50`
- Floor is a minimum quality requirement, not a fixed target.
- C1 demand below the floor may expand to the floor when permitted.
- C1 demand already above the floor is preserved.
- Canonical tile identity uses `makeLithositeTileId_()`.
- `MAX_EXPANSION_RADIUS=20`.

### 🛡️ GUARD RAJA — Authority / Safety
- `capabilityCeiling=maxTiles` remains the hardware/profile boundary.
- `effectiveCeiling=max(qualityFloor,maxTiles)` is used for policy resolution without silently increasing hardware capability.
- Visible tiles are mandatory and are not discarded to satisfy a budget ceiling.
- Selection is validated for tile identity, duplicates, expansion bounds, and authority consistency.
- Queue/Loader consume the approved selection as the single source.

### Store / Runtime boundary
- Upload phase uses `fullUploadFactors` and is not constrained by viewport-only C2 culling.
- Runtime phase uses C1/C2 viewport demand plus Wakil/Guard selection.
- Expected LOW flow: full Store coverage (~60 tiles for the tested geometry) → runtime floor 50 → Store HIT target 50 → avoid avoidable PDF re-render MISS workload.
- `cacheLimit=80` is RAM/cache capacity and remains separate from processing `maxTiles=50`.

## Scope of this baseline update

Only these runtime files were changed from the source baseline:

1. `scripts/map/map-device-profile.js`
2. `scripts/map/map-tile-pyramid.js`
3. `scripts/peta.js`

All other files are retained byte-for-byte from the source baseline.

## Freeze / protection rules

- Do not reintroduce V6 `MIN=25`, FloorFix, `effectiveBudget`, or other superseded branches.
- Do not use `cacheLimit` as `maxTiles`.
- Do not change the locked 50/80 LOW contract without a measured tuning decision.
- Do not mix V25 DB4 into V24.5.
- Do not alter Layout/UI as part of Engine tuning.
- Treat runtime telemetry as the evidence source for performance claims; static contract correctness does not by itself prove zero MISS or absence of heat.

## File inventory / SHA-256

- `backup/peta.js.orig` — `4ff0757d92a6db69ae568500a9874a940e5a72008b0e366de3d3b46dc7433049`
- `docs/issue_fix/V24.5_VIEWPORT_GEOMETRY_CONTRACT_CASE_REMINDER.md` — `67eea7fadbb497dbf2918e4b8064dec3eba322fed423425e7a9df7c4c8d727ea`
- `index.html` — `993e1b17c05bafbab3c06fe705959ae74fe181c03cb50747d31c341184e64774`
- `manifest.json` — `a921fcf7f8985064c16fe790ab7b254d4304a974996f434ced1c0d959ebd5f0a`
- `scripts/auth.js` — `2772f468fbc86ebc35b969b2934822e61d919d17469ad99e6b702f5fcddaea6a`
- `scripts/chat.js` — `bdce18aff799d6c460bdd3d53f4452dc5c7667b57bf99bfc4d9658b44a0c87fa`
- `scripts/config.js` — `fdbed8ed43d725123cf36febafe528e673d7c0981f0a2ed01492161804298d60`
- `scripts/developer-profile.js` — `e39b96e4af7966370572bf6105752b92781e3cefecdd876c9a8490b5b7756888`
- `scripts/digging.js` — `e30eb3772ed979ed675351728f6d09dfe40dccc1a859d0935c1f37ae75eca3a5`
- `scripts/issue.js` — `fa4d62f26a1dfa14ae1da72baf026276718ee6f0bb2a2a90c11fea1311aa0a42`
- `scripts/kpi.js` — `d6ec1046bb58b03ca4d5c67a066049c0ed0f133584acaba414b4538bb5a7f55a`
- `scripts/map/map-background-lifecycle.js` — `a07aecc4be89e7723edac89097068f4300878006b6a1d56c18f24d6c52357259`
- `scripts/map/map-coordinate.js` — `43742d4f3c4f29e0fca6ca1d53ba49f480dd45e318ead04bc1fe24613cb566ae`
- `scripts/map/map-device-profile.js` — `b6bc0b7f46eec051a0c15af996820f2074b3f0ba058a4b800e95cfb4396f2e3d`
- `scripts/map/map-interaction.js` — `d7277b2478aaa01a6c1a20854620cb4bb5831b20e56a5bed9cd265fb1a24afc7`
- `scripts/map/map-library-capability.js` — `a19fd986632dbe3b4d6081b2644312fbabaa4b3878b57483685b2005c6d317af`
- `scripts/map/map-library-contract.js` — `5078f67cf38f0f1f3b4f58f00331646be00d1310d4ad1d59d8931849876a7639`
- `scripts/map/map-library.js` — `904b6936c6f7fcaaedc33ff685282185759395ac9def7b5c728f8ce633553c57`
- `scripts/map/map-lifecycle-completion.js` — `f9bc3337c81cbbf2889a871fc223a16cff668cecc4c8a8d7ba2d831d17a90e7a`
- `scripts/map/map-management-compat.js` — `572045ad709867935781a58b0e7ad01d5f8fa8883731b5dd5c830a735a3ef8a4`
- `scripts/map/map-missing-detail-resolver.js` — `6fa3cb14794dab5133655b2135fd4f21aac6edfbed573528fb4902e62ba7a47e`
- `scripts/map/map-package-transfer.js` — `16435affe6765444efce3c45161608a74d7c01cb6159417a32ab796fe08e4e17`
- `scripts/map/map-package.js` — `eb44aff78d15e39624e496bf3822a7596ae95a0528969009a6f45fc167971afe`
- `scripts/map/map-recovery.js` — `7f8cee45fc30a272131cb4eca2fc491923be895d04312d29d4a7606d79f375f8`
- `scripts/map/map-runtime-loader.js` — `78c317d4c00e1d7b9aba083128fa56760ecbb14e652c9a6cd89d85587834b5a5`
- `scripts/map/map-runtime-tile-creation.js` — `674acd6dcef0645271a190512dc46ea67bf4239e52482ae9cabc6dd16db2772e`
- `scripts/map/map-safe-cleanup.js` — `81c299d53b005294702d53c0c2a18b77f2f39f8c9b007423009035595b84cfa7`
- `scripts/map/map-state.js` — `f4f3c72d021656534d48391f96799e0cf331d847289f7208482c6110e8159440`
- `scripts/map/map-storage-capability.js` — `3c83a5b653a71eb2f773ac0c7125163315c57e0c445188bef2d890545b0b3515`
- `scripts/map/map-storage-management.js` — `93de0814a20aad93fc1185cebf1321ac8dbaeaf795271d51ef21b0e4c51c6a6c`
- `scripts/map/map-surface-lifecycle.js` — `1b8f14ea7e3cf5c04ab7916b7a4dad7cc7e346b8b9b93f28216906807e6f1578`
- `scripts/map/map-tile-pyramid.js` — `c79372537b60a63103eee53434ce2b716b25b260296597fc970e168bf1035c5c`
- `scripts/map/map-tile-queue.js` — `4280d0308ce1c772b2d73cb627f472d8ae8243f5862e86e0909d445235fd512a`
- `scripts/map/map-tile-store.js` — `3be7201d78d6fca4123812594794256107429eb5b91ec5abeab43eacb472a48b`
- `scripts/map/map-ui.js` — `4ee15c67a44771af317adeb8e2ea324d60d14ef168a6bb0283abf9cce28a9972`
- `scripts/map/map-upload-save-lifecycle.js` — `2f5dd40142daed028c1e9b281a49083b0d45564a2a8d59404292b930c251fb59`
- `scripts/peta.js` — `d19e23e0fcb3601b15825d457be4b42fa269d13d6f1e2ea947fbf77c9a82bd81`
- `scripts/settings.js` — `b5bef6d46174c47f3f59f3601f8b248533ac55a0ee0dc85cf9e5cab8b4a9bdb1`
- `scripts/validasi.js` — `49edcbc75de56149da956b3fd0a6a35b2d58216ecd26c8f2917711463b94a1dc`
- `sw.js` — `40b2f4e5e33e5e21d78f1cb3a5bb5bbf4eb32d0094e84362254cd991813f5f46`
- `vendor/pdfjs/pdf.min.js` — `5b5799e6f8c680663207ac5b42ee14eed2a406fa7af48f50c154f0c0b1566946`
- `vendor/pdfjs/pdf.worker.min.js` — `feabdf309770ed24bba31a5467836cdc8cf639c705af27d52b585b041bb8527b`
