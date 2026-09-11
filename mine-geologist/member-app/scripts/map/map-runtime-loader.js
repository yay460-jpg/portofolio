function ensureLithositeRuntimeTileLoader_(pyramid) {
  if (!pyramid) return null;
  ensureLithositeTileQueue_(pyramid);
  if (!pyramid.runtimeTileLoader || pyramid.runtimeTileLoader.version !== 1) {
    pyramid.runtimeTileLoader = {
      version: 1,
      cache: Object.create(null),
      loading: Object.create(null),
      loaded: Object.create(null),
      failed: Object.create(null)
    };
  }
  return pyramid.runtimeTileLoader;
}

function getLithositeRuntimeTile_(pyramid, tileKey) {
  const loader = ensureLithositeRuntimeTileLoader_(pyramid);
  if (!loader || !tileKey) return null;
  const key = String(tileKey);
  return loader.cache[key] || null;
}

function loadLithositeRuntimeDetailTile_(pyramid, tileKey) {
  const loader = ensureLithositeRuntimeTileLoader_(pyramid);
  if (!loader || !tileKey) return Promise.resolve(null);
  const key = String(tileKey);
  if (loader.cache[key]) return Promise.resolve(loader.cache[key]);
  if (loader.loading[key]) return loader.loading[key];

  const tile = getLithositeTileByKey_(pyramid, key);
  if (!tile || !tile.dataUrl) {
    loader.failed[key] = true;
    return Promise.resolve(null);
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const runtimeTile = { key, tile, image: img };
      loader.cache[key] = runtimeTile;
      loader.loaded[key] = true;
      delete loader.loading[key];
      delete loader.failed[key];
      resolve(runtimeTile);
    };
    img.onerror = () => {
      delete loader.loading[key];
      loader.failed[key] = true;
      resolve(null);
    };
    img.src = tile.dataUrl;
  });
  loader.loading[key] = promise;
  return promise;
}

function requestLithositeDetailTile_(pyramid, tileKey) {
  const loader = ensureLithositeRuntimeTileLoader_(pyramid);
  if (!loader || !tileKey) return false;
  const key = String(tileKey);
  if (loader.cache[key] || loader.loading[key]) return false;
  return enqueueLithositeTileKey_(pyramid, key);
}

async function consumeLithositeRuntimeDetailQueue_(pyramid, maxItems) {
  const loader = ensureLithositeRuntimeTileLoader_(pyramid);
  if (!loader) return { processed: 0, loaded: 0, failed: 0, pending: 0 };
  return consumeLithositeTileQueue_(pyramid, async (tileKey) => {
    const runtimeTile = await loadLithositeRuntimeDetailTile_(pyramid, tileKey);
    return !!runtimeTile;
  }, maxItems);
}

function getLithositeRuntimeTileLoaderStats_(pyramid) {
  const loader = ensureLithositeRuntimeTileLoader_(pyramid);
  if (!loader) return { cached: 0, loading: 0, loaded: 0, failed: 0 };
  return {
    cached: Object.keys(loader.cache).length,
    loading: Object.keys(loader.loading).length,
    loaded: Object.keys(loader.loaded).length,
    failed: Object.keys(loader.failed).length
  };
}

