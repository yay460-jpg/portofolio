# MG1 / Lithosite — V24.5 BASELINE FINAL

**Baseline status:** LOCKED / OBSERVE

## Included current state

- Viewport Geometry Contract V1: 320×320 internal geometry, unified X/Y basis.
- Point Detail Modal V2: isolated bottom sheet, Camera/Gallery, one photo, fullscreen.
- Tile queue reconciliation lifecycle fix retained.
- Map Library Label & Koleksi merged UI retained.
- Logout hard-refresh fix retained.
- IndexedDB remains V24.5 DB V2; no V25 DB4 files are included.
- Tile Resolution / factor contract intentionally unchanged.
- Gesture and device classification intentionally unchanged.

## Important freeze rules

Do not reintroduce temporary Y compensation, percentage tuning, LOW-only geometry branches, or special top/bottom corrections. Trace the geometry contract first.

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
- `scripts/map/map-device-profile.js` — `d6bfea831e129f92197023ca8cb8a735b82d9afb4614adfc352e84c51597e95b`
- `scripts/map/map-interaction.js` — `57d54647a3d9a3b619fe2c35a8ebe22d3a231e6e18a029ce7a6b4513b534b46c`
- `scripts/map/map-library-capability.js` — `a19fd986632dbe3b4d6081b2644312fbabaa4b3878b57483685b2005c6d317af`
- `scripts/map/map-library-contract.js` — `5078f67cf38f0f1f3b4f58f00331646be00d1310d4ad1d59d8931849876a7639`
- `scripts/map/map-library.js` — `904b6936c6f7fcaaedc33ff685282185759395ac9def7b5c728f8ce633553c57`
- `scripts/map/map-lifecycle-completion.js` — `f9bc3337c81cbbf2889a871fc223a16cff668cecc4c8a8d7ba2d831d17a90e7a`
- `scripts/map/map-management-compat.js` — `427c12cc4dc7c93a5582ba20c8acded739e4926a4bb54b54926a0a3fdfd7706f`
- `scripts/map/map-missing-detail-resolver.js` — `63754b4cd83617bd0d1066f0df4d78729a72a650948b263b72a628473fb73bdf`
- `scripts/map/map-package-transfer.js` — `16435affe6765444efce3c45161608a74d7c01cb6159417a32ab796fe08e4e17`
- `scripts/map/map-package.js` — `eb44aff78d15e39624e496bf3822a7596ae95a0528969009a6f45fc167971afe`
- `scripts/map/map-recovery.js` — `7f8cee45fc30a272131cb4eca2fc491923be895d04312d29d4a7606d79f375f8`
- `scripts/map/map-runtime-loader.js` — `28ba89b334057fbd25f3f34d5a9a62add5d9608e5a7656b1754f82bf8a962531`
- `scripts/map/map-runtime-tile-creation.js` — `674acd6dcef0645271a190512dc46ea67bf4239e52482ae9cabc6dd16db2772e`
- `scripts/map/map-safe-cleanup.js` — `81c299d53b005294702d53c0c2a18b77f2f39f8c9b007423009035595b84cfa7`
- `scripts/map/map-state.js` — `f4f3c72d021656534d48391f96799e0cf331d847289f7208482c6110e8159440`
- `scripts/map/map-storage-capability.js` — `3c83a5b653a71eb2f773ac0c7125163315c57e0c445188bef2d890545b0b3515`
- `scripts/map/map-storage-management.js` — `93de0814a20aad93fc1185cebf1321ac8dbaeaf795271d51ef21b0e4c51c6a6c`
- `scripts/map/map-surface-lifecycle.js` — `1b8f14ea7e3cf5c04ab7916b7a4dad7cc7e346b8b9b93f28216906807e6f1578`
- `scripts/map/map-tile-pyramid.js` — `d19365b2d5d460fa2217b92b88a6887a2adb3c2dc9377f5eb022a88e7f66680f`
- `scripts/map/map-tile-queue.js` — `d19d39aefe9fd22416c1aaea5d67708d96f8d2d128798fcaacaf96951b98fd5f`
- `scripts/map/map-tile-store.js` — `3be7201d78d6fca4123812594794256107429eb5b91ec5abeab43eacb472a48b`
- `scripts/map/map-ui.js` — `4ee15c67a44771af317adeb8e2ea324d60d14ef168a6bb0283abf9cce28a9972`
- `scripts/map/map-upload-save-lifecycle.js` — `2f5dd40142daed028c1e9b281a49083b0d45564a2a8d59404292b930c251fb59`
- `scripts/peta.js` — `7c25fabb8d03d2e34bc3ea9706cf3e3260ec7a59934c36300e19670da17fb438`
- `scripts/settings.js` — `b5bef6d46174c47f3f59f3601f8b248533ac55a0ee0dc85cf9e5cab8b4a9bdb1`
- `scripts/validasi.js` — `49edcbc75de56149da956b3fd0a6a35b2d58216ecd26c8f2917711463b94a1dc`
- `sw.js` — `40b2f4e5e33e5e21d78f1cb3a5bb5bbf4eb32d0094e84362254cd991813f5f46`
- `vendor/pdfjs/pdf.min.js` — `5b5799e6f8c680663207ac5b42ee14eed2a406fa7af48f50c154f0c0b1566946`
- `vendor/pdfjs/pdf.worker.min.js` — `feabdf309770ed24bba31a5467836cdc8cf639c705af27d52b585b041bb8527b`
