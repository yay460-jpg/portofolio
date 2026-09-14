// MINE GEOLOGIST / LITHOSITE
// STEP 9.10-C — Tile Queue
// Structural extraction only. Queue lifecycle semantics intentionally unchanged.
// Depends on map-tile-store.js for ensureLithositeTileStore_().

function ensureLithositeTileQueue_(pyramid) {
  if (!pyramid) return null;
  if (!pyramid.tileStore) ensureLithositeTileStore_(pyramid);
  const store = pyramid.tileStore || {};
  if (!pyramid.tileQueue || pyramid.tileQueue.version !== 2) {
    // V15.8 FIX STEP 8.10B-1: STORED ≠ RUNTIME_READY
    // loadedSet = runtime loader sudah selesai (Image ready), bukan sekadar ada di index
    // storedSet = ada di tileStore.index (persistent)
    pyramid.tileQueue = {
      version: 2,
      identity: 'factor/x/y',
      pending: [],
      pendingSet: Object.create(null),
      loadedSet: Object.create(null),
      failedSet: Object.create(null),
      storedSet: Object.create(null)
    };
  }
  const q = pyramid.tileQueue;
  // STORED tracking terpisah dari RUNTIME_READY
  if (!q.storedSet) q.storedSet = Object.create(null);
  const index = store.index || {};
  // Update storedSet dari index terbaru, tapi JANGAN auto-mark loadedSet
  Object.keys(q.storedSet).forEach(k => { if (!index[k]) delete q.storedSet[k]; });
  Object.keys(index).forEach(k => { q.storedSet[k] = true; });
  // loadedSet tetap hanya untuk yang sudah runtime loaded (diisi oleh markLithositeTileLoaded_)
  return q;
}

function enqueueLithositeTileKey_(pyramid, tileKey) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q || !tileKey) return false;
  const key = String(tileKey);
  // 8.10B-1 FIX: untuk runtime loading, cek pending saja, bukan loadedSet (STORED)
  // loadedSet = sudah RUNTIME_READY, jadi kalau sudah READY jangan queue lagi
  // tapi kalau hanya STORED (storedSet) dan belum READY, harus boleh queue
  if (q.pendingSet[key]) return false;
  const loader = pyramid.runtimeTileLoader;
  if (loader && loader.cache && loader.cache[key]) return false; // sudah RUNTIME_READY
  if (loader && loader.loading && loader.loading[key]) return false; // sedang LOADING
  q.pending.push(key);
  q.pendingSet[key] = true;
  return true;
}

function dequeueLithositeTileKey_(pyramid) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q || !q.pending.length) return null;
  const key = q.pending.shift();
  delete q.pendingSet[key];
  return key;
}

function markLithositeTileLoaded_(pyramid, tileKey) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q || !tileKey) return false;
  const key = String(tileKey);
  q.loadedSet[key] = true;
  delete q.pendingSet[key];
  delete q.failedSet[key];
  return true;
}

function markLithositeTileFailed_(pyramid, tileKey) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q || !tileKey) return false;
  const key = String(tileKey);
  q.failedSet[key] = true;
  delete q.pendingSet[key];
  return true;
}

function getLithositeTileQueueStats_(pyramid) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q) return { pending: 0, loaded: 0, failed: 0 };
  return {
    pending: q.pending.length,
    loaded: Object.keys(q.loadedSet).length,
    failed: Object.keys(q.failedSet).length
  };
}
