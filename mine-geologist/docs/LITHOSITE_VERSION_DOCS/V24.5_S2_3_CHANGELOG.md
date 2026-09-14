# V24.5 S2.3 — Change Log

## Added
- Compact Storage Summary card in the isolated Map Library modal.
- Read-only presentation of `MG1MapStorageCapability.summary()`.
- Storage state badge and usage bar.
- Separate display for logical map payload and browser-origin storage usage/quota.

## Changed
- `member-app/scripts/map/map-management-compat.js` only.

## Protected / unchanged
- `peta.js`
- Tile Engine / C1 / C2
- GeoReference
- gesture / marker / GPS
- tile persistence
- map-package.js persistence owner
- V24.4 lifecycle completion
- V24.5 S1 package transfer

## Validation
- Static JavaScript syntax: PASS.
- Browser UI validation: PENDING user runtime test.
- Console Clean: NOT CLAIMED.

## S2.3.1 — Storage Summary moved into Library options panel
- Moved the existing read-only Storage Summary card into the three-line `Urutkan dan filter` options panel.
- Storage Summary is now revealed together with Library settings instead of occupying persistent vertical space in the main Map Library surface.
- No change to storage capability API, persistence, lifecycle, rendering, or runtime behavior.
- `map-management-compat.js` remains the only changed implementation file.
- Browser validation is required after overwrite to confirm the summary appears when the three-line panel is opened.

## S2.5.1 Decision — Native Sharing Deferred
- Temporarily removed in-app `Bagikan / Transfer Peta` from the Map Library action modal.
- Retained `Backup / Export Peta` as the stable transfer path.
- Native Android Share Sheet integration is deferred until a dedicated reliable Android-native validation path is available.
