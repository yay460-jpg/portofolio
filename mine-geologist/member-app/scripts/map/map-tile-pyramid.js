// MINE GEOLOGIST / Lithosite Map Module
// STEP 9.10-A — Tile Identity + Pyramid extraction.
// Behavior-preserving extraction from locked baseline.
// DO NOT alter device tile profile or C1/C2 geometry contract here.

function getAdaptiveC2TileWindowFromPlan_(planner, levelPlan, prefetchRadius) {
  try {
    if (!planner || !planner.ok || !planner.visible || !levelPlan) return null;
    const baseFactor = Number(planner.factor) || 0.25;
    const factor = Number(levelPlan.factor) || baseFactor;
    const ratio = Math.max(0.25, factor / baseFactor);
    const tilesX = levelPlan.tilesX, tilesY = levelPlan.tilesY;
    const scaleX = levelPlan.width / Math.max(1, planner.levelWidth * ratio);
    const scaleY = levelPlan.height / Math.max(1, planner.levelHeight * ratio);
    const vMinX = Math.max(0, Math.floor(Number(planner.visible.minX) * ratio * scaleX));
    const vMaxX = Math.min(tilesX - 1, Math.floor((Number(planner.visible.maxX) + 1) * ratio * scaleX - 0.001));
    const vMinY = Math.max(0, Math.floor(Number(planner.visible.minY) * ratio * scaleY));
    const vMaxY = Math.min(tilesY - 1, Math.floor((Number(planner.visible.maxY) + 1) * ratio * scaleY - 0.001));
    const r = Math.max(0, Math.floor(Number(prefetchRadius) || 0));
    const minX = Math.max(0, vMinX-r), maxX = Math.min(tilesX-1, vMaxX+r);
    const minY = Math.max(0, vMinY-r), maxY = Math.min(tilesY-1, vMaxY+r);
    const keys=[];
    for(let ty=minY; ty<=maxY; ty++) for(let tx=minX; tx<=maxX; tx++) keys.push(tx+','+ty);
    return { visible:{minX:vMinX,maxX:vMaxX,minY:vMinY,maxY:vMaxY}, required:{minX,maxX,minY,maxY,count:keys.length}, tilesX, tilesY, keys };
  } catch(e) { return null; }
}

function makeLithositeTileId_(factor, x, y) {
  const f = Number(factor);
  const fs = Number.isFinite(f) ? f.toFixed(2).replace(/\.00$/, '') : String(factor);
  return 'L' + fs + '_X' + Number(x) + '_Y' + Number(y);
}

function normalizeLithositeTile_(tile, factor) {
  if (!tile) return null;
  const x = Number(tile.x), y = Number(tile.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  const out = { ...tile };
  out.levelFactor = Number(factor);
  out.tileKey = makeLithositeTileId_(factor, x, y);
  out.tileId = out.tileKey;
  return out;
}

function attachLithositePersistentBaseLayer_(pyramid) {
  if (!pyramid || !Array.isArray(pyramid.levels) || !pyramid.levels.length) return pyramid;
  let baseIndex = pyramid.levels.findIndex(l => Math.abs(Number(l.factor) - 0.25) < 0.0001);
  if (baseIndex < 0) baseIndex = 0;
  const base = pyramid.levels[baseIndex];
  const tiles = Array.isArray(base.tiles) ? base.tiles : [];
  pyramid.baseLayer = {
    version: 1,
    persistent: true,
    coverage: 'full',
    factor: Number(base.factor),
    levelIndex: baseIndex,
    tileCount: tiles.length,
    tileKeys: tiles.map(t => t && (t.tileKey || t.tileId)).filter(Boolean)
  };
  ensureLithositeTileStore_(pyramid);
  pyramid.tileStore.baseLayer = {
    persistent: true,
    factor: Number(base.factor),
    levelIndex: baseIndex
  };
  return pyramid;
}

async function buildTilePyramidDirect_(page, vpBBox, baseScale, onProgress, geoReference, phase) {
  if (!page || !vpBBox || vpBBox.length !== 4) throw new Error('Data GeoPDF untuk tile pyramid tidak lengkap.');
  const factors = GEOPDF_TILE_LEVEL_FACTORS_;
  const isUploadPhase = String(phase || 'runtime').toLowerCase() === 'upload';
  const adaptiveC2 = !isUploadPhase && window.mg1AdaptiveC2Enabled === true;
  // V6 FINAL LOCKED - No cacheLimit fallback, no hardcode LOW, no re-profile S7
  // Use cached profile without benchmark, fallback to explicit LOW 768 only if truly no cache (first install)
  let deviceProfile = null;
  try {
    if (window.mg1DeviceTileEngineProfile) deviceProfile = window.mg1DeviceTileEngineProfile;
    else {
      const cached = localStorage.getItem('mg1_tile_engine_profile_v1');
      if (cached) deviceProfile = JSON.parse(cached);
    }
  } catch(_){}
  // If still null (first install, no cache), get profile via getDeviceTileEngineProfile_() which may benchmark once
  // But do NOT create fake LOW - let profiler run once on first install, then cache
  if (!deviceProfile) {
    try {
      if (typeof getDeviceTileEngineProfile_ === 'function') deviceProfile = getDeviceTileEngineProfile_();
    } catch(_){}
  }

  // Engine V2 final render density follows the profiled factor contract.
  // LOW is capped by its profile at 1x; no temporary density multiplier.
  const c2Factor = 1;
  // Engine V2: C1/C2 grid contract must use the same tile size.
  // LOW remains locked at 768px; BALANCED remains 256px; HIGH uses its
  // profiled 512px tile size. Do not derive this independently from C1.
  const tileSize = Math.min(
    GEOPDF_TILE_SIZE_MAX_SAFE_,
    Math.max(64, Number(deviceProfile && deviceProfile.tileSize) || GEOPDF_TILE_SIZE_)
  );
  // ENGINE V2 LIFECYCLE BOUNDARY - V6 FINAL LOCKED:
  // UPLOAD must be full pyramid (fullUploadFactors) with tileSize from profile (768 for LOW)
  // If upload is only BASE 2 + DETAIL 16 = 18 tiles (viewport), then runtime floor 25 will cause:
  // 16 HIT + 9 MISS -> 9 PDF re-render -> heat/lag
  // Correct: UPLOAD 60 tiles full -> runtime C2 25 -> Store HIT 25 -> MISS 0 -> no heat
  // ENGINE V2 LIFECYCLE BOUNDARY:
  // UPLOAD is a pure full-pyramid builder. Viewport/C1/C2 selection belongs to
  // runtime and must never reduce the persistent pyramid during upload.
  // The builder is currently invoked by the GeoPDF upload path with phase='upload'.
  // V6 FINAL LOCKED: UPLOAD full pyramid with fullUploadFactors + tileSize from profile
  // This fixes root heat: upload must have 60-80 tiles (full), not 18 (viewport)
  // Runtime C2 remains viewport window + budget floor
  const uploadFactors = (deviceProfile && Array.isArray(deviceProfile.fullUploadFactors) && deviceProfile.fullUploadFactors.length)
    ? deviceProfile.fullUploadFactors
    : (Array.isArray(factors) ? factors : [0.25,0.5,1,2]);
  const renderFactors = isUploadPhase
    ? uploadFactors // full pyramid: 4 levels with tileSize 768 for LOW -> ~60 tiles, not 18
    : (adaptiveC2 ? [0.25, c2Factor] : factors);
  const c2Stats = {
    enabled: adaptiveC2,
    planned: 0,
    rendered: 0,
    failed: 0,
    skipped: 0,
    startedAt: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  };
  const vpWPt = Math.abs(vpBBox[2] - vpBBox[0]);
  const vpHPt = Math.abs(vpBBox[3] - vpBBox[1]);
  if (!(vpWPt > 0) || !(vpHPt > 0)) throw new Error('VP BBox GeoPDF tidak valid untuk tile pyramid.');

  const out = {
    version: 2,
    mode: 'pdfjs-direct-tile-render-v15.1-seamless-base-detail',
    tileSize,
    baseScale,
    sourceWidth: Math.max(1, Math.round(vpWPt * baseScale)),
    sourceHeight: Math.max(1, Math.round(vpHPt * baseScale)),
    levels: [],
    v15Seamless: true, // Marker: base layer kept for no blank pan
    tileIdentity: 'factor/x/y', // V15.2 STEP A

    maxLevel: factors.length - 1
  };

  // Hitung total tile seluruh level sekali supaya progress bar menunjukkan 0..100%
  // untuk keseluruhan pyramid, bukan reset 0% setiap ganti level.
  const levelPlan = renderFactors.map((factor) => {
    const scale = baseScale * Number(factor);
    const width = Math.max(1, Math.round(vpWPt * scale));
    const height = Math.max(1, Math.round(vpHPt * scale));
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.ceil(height / tileSize);
    return { factor: Number(factor), scale, width, height, tilesX, tilesY, total: tilesX * tilesY };
  });
  // UPLOAD: no viewport culling. The persistent store receives the complete
  // pyramid described by levelPlan. RUNTIME: C2 may select a subset, but that
  // selection must happen outside the upload builder lifecycle.
  const c2Windows = (!isUploadPhase && adaptiveC2)
    ? levelPlan.map((plan, li) => li === 0
        ? null
        : getAdaptiveC2TileWindowFromPlan_(window.mg1LastViewportTilePlan || null, plan, 0))
    : [];
  const effectiveTotals = isUploadPhase
    ? levelPlan.map(plan => plan.total)
    : (adaptiveC2
      ? levelPlan.map((plan, li) => (c2Windows[li] ? c2Windows[li].required.count : plan.total))
      : levelPlan.map(item => item.total));
  const grandTotalTiles = Math.max(1, effectiveTotals.reduce((sum, item) => sum + item, 0));
  if (adaptiveC2) c2Stats.planned = grandTotalTiles;
  let globalDone = 0;
  if (onProgress) onProgress('Menyiapkan tile pyramid' + (adaptiveC2 ? ' adaptif' : '') + ': 0/' + grandTotalTiles + ' (0%)', 0);

  // PDF.js tetap menjadi renderer sumber. Setiap tile dirender langsung dari halaman PDF
  // pada resolusi levelnya; kita tidak meng-upscale satu PNG crop yang sudah ter-raster.
  // Ini mempertahankan detail vector/text pada deep zoom dan lebih dekat ke pola quadrant
  // renderer Avenza yang sudah kita audit.
  for (let li = 0; li < levelPlan.length; li++) {
    const plan = levelPlan[li];
    const factor = plan.factor;
    const scale = plan.scale;
    const width = plan.width;
    const height = plan.height;
    const tilesX = plan.tilesX;
    const tilesY = plan.tilesY;
    const tiles = [];
    const c2Window = (!isUploadPhase && adaptiveC2) ? c2Windows[li] : null;
    const total = adaptiveC2 && c2Window ? c2Window.required.count : tilesX * tilesY;
    let done = 0;
    const viewport = page.getViewport({ scale });

    // PDF page coordinates: origin bottom-left. Convert VP crop top edge into viewport
    // (canvas) coordinates before building the tile offsets.
    const leftPt = Math.min(vpBBox[0], vpBBox[2]);
    const bottomPt = Math.min(vpBBox[1], vpBBox[3]);
    const topPt = Math.max(vpBBox[1], vpBBox[3]);
    const cropLeftPx = leftPt * scale;
    const cropTopPx = viewport.height - (topPt * scale);
    const pageLeftPx = cropLeftPx;
    const pageTopPx = cropTopPx;

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const x = tx * tileSize;
        const y = ty * tileSize;
        const tw = Math.min(tileSize, width - x);
        const th = Math.min(tileSize, height - y);
        // BASE (li===0) is intentionally NOT culled: it must cover the full map.
        // DETAIL (li>0) may use the viewport window for the low-end device budget.
        if (!isUploadPhase && adaptiveC2 && li > 0 && c2Window && c2Window.keys.indexOf(tx + ',' + ty) === -1) {
          c2Stats.skipped++;
          continue;
        }
        // V14.38: tile guard follows the raised 768px safety ceiling. Only one
        // raster canvas is alive at a time and it is released in finally.
        if (tw <= 0 || th <= 0 || tw > GEOPDF_TILE_SIZE_MAX_SAFE_ || th > GEOPDF_TILE_SIZE_MAX_SAFE_) {
          console.warn('Tile ' + tx + ',' + ty + ' level ' + li + ' dilewati (ukuran tidak wajar: ' + tw + 'x' + th + ').');
          done++; globalDone++;
          continue;
        }
        let canvas = null;
        try {
          canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
          if (!ctx) throw new Error('Canvas tile tidak tersedia.');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Render hanya quadrant yang diminta. offsetX/offsetY pada viewport menjaga skala
          // PDF tetap asli; canvas kecil menjadi clipping surface, bukan target resize halaman.
          const tileViewport = page.getViewport({
            scale,
            offsetX: -(pageLeftPx + x),
            offsetY: -(pageTopPx + y)
          });
          await page.render({
            canvasContext: ctx,
            viewport: tileViewport,
            intent: 'display',
            useRequestAnimationFrame: true
          }).promise;

          const dataUrl = canvas.toDataURL('image/png');
          tiles.push(normalizeLithositeTile_({ x: tx, y: ty, width: tw, height: th, dataUrl }, factor));
          if (adaptiveC2) c2Stats.rendered++;
        } catch (tileErr) {
          if (adaptiveC2) c2Stats.failed++;
          // [BARU -- pengaman ringan] 1 tile gagal (mis. render() pdf.js gagal sesaat di
          // Android tertentu) TIDAK BOLEH menggagalkan seluruh upload GeoPDF. Tile ini
          // dilewati -- akan tampil sbg celah kecil di zoom dalam, jauh lebih baik drpd
          // seluruh proses upload gagal total.
          console.warn('Render tile ' + tx + ',' + ty + ' level ' + li + ' gagal, dilewati:', tileErr);
        } finally {
          if (canvas) releaseGeoPdfCanvas_(canvas);
        }
        done++;
        globalDone++;
        if (onProgress) {
          const percent = (globalDone / grandTotalTiles) * 100;
          onProgress(
            'Memproses tile PDF: ' + globalDone + '/' + grandTotalTiles + ' (' + Math.round(percent) + '%)',
            percent
          );
        }
        // Give older Android/WebView devices a small scheduling window every few tiles.
        // This keeps the UI responsive and lets released canvases become collectible.
        if (done % 5 === 0) {
          await new Promise(r => setTimeout(r, 10));
        } else {
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }
    out.levels.push({ level: li, factor, scale, width, height, tilesX, tilesY, tileIdentity: 'factor/x/y', tiles });
  }
  // V15.3 STEP B: publish the BASE lifecycle only after all requested tiles
  // have been assembled. BASE remains full-coverage; DETAIL may stay partial.
  attachLithositePersistentBaseLayer_(out);
  if (adaptiveC2) {
    c2Stats.elapsedMs = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - c2Stats.startedAt);
    c2Stats.status = (c2Stats.failed === 0 && c2Stats.rendered === c2Stats.planned) ? 'ACTIVE' : 'ACTIVE WITH TILE ERRORS';
    out.adaptive = { mode:'viewport-only-selected-factor-test', prefetchRadius:0, lowestLevelFull:false, status:c2Stats.status, stats:c2Stats };
  }
  return out;
}
