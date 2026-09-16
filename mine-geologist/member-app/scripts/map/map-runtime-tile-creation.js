// STEP 9.10-F — Runtime Tile Creation
// Extracted without functional changes.

function ensureLithositeRuntimePdfSourceRegistry_() {
  if (typeof window === 'undefined') return null;
  if (!window.mg1LithositePdfSourceRegistry) window.mg1LithositePdfSourceRegistry = Object.create(null);
  return window.mg1LithositePdfSourceRegistry;
}

function registerLithositeRuntimePdfSource_(mapId, file, geoReference) {
  const registry = ensureLithositeRuntimePdfSourceRegistry_();
  if (!registry || !mapId || !file) return false;
  registry[String(mapId)] = { file, geoReference: geoReference || null, registeredAt: Date.now() };
  return true;
}

function getLithositeRuntimePdfSource_(mapId) {
  const registry = ensureLithositeRuntimePdfSourceRegistry_();
  return registry && mapId ? registry[String(mapId)] || null : null;
}

function parseLithositeTileKey_(tileKey) {
  const m = String(tileKey || '').match(/^L(-?(?:\d+(?:\.\d+)?|\.\d+))_X(-?\d+)_Y(-?\d+)$/i);
  if (!m) return null;
  const factor = Number(m[1]), x = Number(m[2]), y = Number(m[3]);
  if (!Number.isFinite(factor) || !Number.isInteger(x) || !Number.isInteger(y)) return null;
  return { factor, x, y, key: makeLithositeTileId_(factor, x, y) };
}

function getLithositeLevelByFactor_(pyramid, factor) {
  if (!pyramid || !Array.isArray(pyramid.levels)) return null;
  const f = Number(factor);
  let best = null, bestDiff = Infinity;
  for (const level of pyramid.levels) {
    const d = Math.abs(Number(level && level.factor) - f);
    if (Number.isFinite(d) && d < bestDiff) { best = level; bestDiff = d; }
  }
  return bestDiff < 0.0001 ? best : null;
}

function addLithositeRuntimeCreatedTile_(pyramid, tile) {
  if (!pyramid || !tile || !Array.isArray(pyramid.levels)) return false;
  try { if (tile && tile.image) delete tile.image; if (tile && tile.img) delete tile.img; } catch(_) {}
  const level = getLithositeLevelByFactor_(pyramid, tile.levelFactor);
  if (!level) return false;
  if (!Array.isArray(level.tiles)) level.tiles = [];
  const existing = level.tiles.findIndex(t => t && (t.tileKey || t.tileId) === tile.tileKey);
  if (existing >= 0) level.tiles[existing] = tile;
  else level.tiles.push(tile);
  try { pyramid.__persistVersion = (Number(pyramid.__persistVersion)||0)+1; pyramid.__lastPersistAt = Date.now(); } catch(_) {}
  ensureLithositeTileStore_(pyramid);
  ensureLithositeTileQueue_(pyramid);
  markLithositeTileLoaded_(pyramid, tile.tileKey);
  try { 
    if (typeof schedulePersistCoalesced_ === 'function') schedulePersistCoalesced_(pyramid);
    else void persistLithositeRuntimeTileStore_(pyramid); 
  } catch (_) {}
  return true;
}

// === STEP 8.16 + 8.20 - PERSISTENCE QUEUE / COALESCING (clone-safe) ===
let mg1PersistQueue_ = Object.create(null);

async function createLithositeMissingDetailTileFromPdf_(mapId, pyramid, tileKey) {
  const parsed = parseLithositeTileKey_(tileKey);
  if (!parsed || !pyramid) return { status:'invalid', key:null, tile:null };
  const source = getLithositeRuntimePdfSource_(mapId);
  if (!source || !source.file) return { status:'source-unavailable', key:parsed.key, tile:null };
  const level = getLithositeLevelByFactor_(pyramid, parsed.factor);
  const geoReference = source.geoReference || null;
  const vpBBox = geoReference && geoReference.metadata && Array.isArray(geoReference.metadata.vpBBox)
    ? geoReference.metadata.vpBBox : null;
  const baseScale = geoReference && Number(geoReference.renderScale);
  if (!level || !vpBBox || vpBBox.length !== 4 || !(baseScale > 0)) {
    return { status:'metadata-unavailable', key:parsed.key, tile:null };
  }
  if (getLithositeTileByKey_(pyramid, parsed.key)) {
    return { status:'available', key:parsed.key, tile:getLithositeTileByKey_(pyramid, parsed.key) };
  }

  let loadingTask = null, pdf = null, page = null, bytes = null;
  try {
    bytes = new Uint8Array(await source.file.arrayBuffer());
    loadingTask = pdfjsLib.getDocument({ data: bytes });
    pdf = await loadingTask.promise;
    page = await pdf.getPage(1);
    const scale = baseScale * parsed.factor;
    const tileSize = Number(pyramid.tileSize) || GEOPDF_TILE_SIZE_;
    const width = Math.max(1, Number(level.width) || Math.round(Math.abs(vpBBox[2]-vpBBox[0]) * scale));
    const height = Math.max(1, Number(level.height) || Math.round(Math.abs(vpBBox[3]-vpBBox[1]) * scale));
    const x = parsed.x * tileSize, y = parsed.y * tileSize;
    const tw = Math.min(tileSize, width - x), th = Math.min(tileSize, height - y);
    if (!(tw > 0 && th > 0 && tw <= GEOPDF_TILE_SIZE_MAX_SAFE_ && th <= GEOPDF_TILE_SIZE_MAX_SAFE_)) {
      return { status:'out-of-range', key:parsed.key, tile:null };
    }
    const viewport = page.getViewport({ scale });
    const leftPt = Math.min(vpBBox[0], vpBBox[2]);
    const topPt = Math.max(vpBBox[1], vpBBox[3]);
    const pageLeftPx = leftPt * scale;
    const pageTopPx = viewport.height - (topPt * scale);
    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    try {
      const ctx = canvas.getContext('2d', { alpha:false, willReadFrequently:false });
      if (!ctx) throw new Error('Canvas tile tidak tersedia.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const tileViewport = page.getViewport({
        scale,
        offsetX: -(pageLeftPx + x),
        offsetY: -(pageTopPx + y)
      });
      await page.render({ canvasContext:ctx, viewport:tileViewport, intent:'display', useRequestAnimationFrame:true }).promise;
      const tile = normalizeLithositeTile_({ x:parsed.x, y:parsed.y, width:tw, height:th, dataUrl:canvas.toDataURL('image/png') }, parsed.factor);
      addLithositeRuntimeCreatedTile_(pyramid, tile);
      return { status:'created', key:parsed.key, tile };
    } finally {
      releaseGeoPdfCanvas_(canvas);
    }
  } catch (err) {
    console.warn('Runtime creation tile ' + parsed.key + ' gagal:', err);
    return { status:'failed', key:parsed.key, tile:null, reason:String(err && err.message || err) };
  } finally {
    try { if (page && page.cleanup) page.cleanup(); } catch (_) {}
    try { if (pdf && pdf.cleanup) await pdf.cleanup(); } catch (_) {}
    try { if (pdf && pdf.destroy) await pdf.destroy(); } catch (_) {}
    try { if (loadingTask && loadingTask.destroy) await loadingTask.destroy(); } catch (_) {}
    page = null; pdf = null; loadingTask = null; bytes = null;
  }
}

async function resolveAndCreateLithositeMissingDetailTile_(mapId, pyramid, tileKey) {
  const availability = resolveLithositeDetailTileAvailability_(pyramid, tileKey);
  if (availability.status === 'available') {
    return { status:'available', key:availability.key, tile:availability.tile, created:false };
  }
  if (availability.status !== 'missing') return availability;
  const result = await createLithositeMissingDetailTileFromPdf_(mapId, pyramid, availability.key);
  if (result.status === 'created') {
    const resolver = ensureLithositeMissingDetailResolver_(pyramid);
    if (resolver) { resolver.available[availability.key] = true; delete resolver.missing[availability.key]; }
  }
  return { ...result, created: result.status === 'created' };
}
