// MINE GEOLOGIST / LITHOSITE — STEP 9.10-E
// Missing Detail Resolver boundary extracted from peta.js.
// Logic intentionally unchanged.

function ensureLithositeMissingDetailResolver_(pyramid) {
  if (!pyramid) return null;
  ensureLithositeRuntimeTileLoader_(pyramid);
  if (!pyramid.missingDetailResolver || pyramid.missingDetailResolver.version !== 1) {
    pyramid.missingDetailResolver = {
      version: 1,
      requested: Object.create(null),
      missing: Object.create(null),
      available: Object.create(null)
    };
  }
  return pyramid.missingDetailResolver;
}

function resolveLithositeDetailTileAvailability_(pyramid, tileKey) {
  const resolver = ensureLithositeMissingDetailResolver_(pyramid);
  if (!resolver || !tileKey) return { status: 'invalid', key: null };
  const key = String(tileKey);
  resolver.requested[key] = true;

  const tile = getLithositeTileByKey_(pyramid, key);
  if (tile && tile.dataUrl) {
    resolver.available[key] = true;
    delete resolver.missing[key];
    return { status: 'available', key, tile };
  }

  resolver.missing[key] = true;
  delete resolver.available[key];
  return { status: 'missing', key, tile: null };
}

function requestLithositeDetailTileResolved_(pyramid, tileKey) {
  const result = resolveLithositeDetailTileAvailability_(pyramid, tileKey);
  if (result.status === 'available') {
    return {
      status: 'available',
      key: result.key,
      queued: requestLithositeDetailTile_(pyramid, result.key)
    };
  }
  if (result.status === 'missing') {
    return { status: 'missing', key: result.key, queued: false };
  }
  return { status: 'invalid', key: null, queued: false };
}

function getLithositeMissingDetailResolverStats_(pyramid) {
  const resolver = ensureLithositeMissingDetailResolver_(pyramid);
  if (!resolver) return { requested: 0, missing: 0, available: 0 };
  return {
    requested: Object.keys(resolver.requested).length,
    missing: Object.keys(resolver.missing).length,
    available: Object.keys(resolver.available).length
  };
}
