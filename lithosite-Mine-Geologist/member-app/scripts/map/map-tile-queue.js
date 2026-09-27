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

// [BARU -- 15 Sep, hasil audit dependency mapViewportRatio_ -> getVisibleDetailKeysFromPlan_
// -> pending queue] Tiap render menghitung ulang visibleResult.keys (bisa beda dari render
// sebelumnya, mis. gara2 ratio baru saja dikoreksi setelah pindah tab). SEBELUMNYA pending[]
// yg sudah dienqueue dari render sebelumnya TIDAK PERNAH dibuang -- kalau render pertama
// (ratio salah) sempat enqueue 376 tile, render kedua (ratio benar) cuma enqueue 6 tile
// baru, ke-376 tile lama yg TIDAK LAGI relevan tetap nangkring di depan antrian FIFO,
// menunda 6 tile yg genuinely dibutuhkan + boros bandwidth/decode utk tile yg sudah tidak
// perlu ditampilkan. Fix ini HANYA membuang entri PENDING (belum mulai diproses) yg tidak
// lagi ada di visible-keys terbaru -- TIDAK menyentuh loading (biarkan selesai, jangan
// dibatalkan di tengah jalan), cache/loadedSet/failedSet/storedSet (tidak relevan, itu
// state hasil, bukan antrian). pending & pendingSet WAJIB diubah bareng dalam 1 fungsi ini
// -- kalau cuma salah satu yg diubah, pendingSet bisa "mengunci" key yg sebenarnya sudah
// dibuang dari pending[], bikin key itu tidak pernah bisa di-enqueue ulang.
// Audit sebelum fix ini (dicatat supaya tidak diulang): dipastikan pending[] MURNI berisi
// visible-runtime tiles -- jalur enqueue runtime tunggal; prefetch di kode
// hanya dipakai oleh C1 planner dan tidak dicampur ke queue runtime. Queue ini
// direkonsiliasi murni terhadap visible-keys.
function reconcileLithositeTileQueueWithVisible_(pyramid, visibleKeys) {
  const q = ensureLithositeTileQueue_(pyramid);
  if (!q || !Array.isArray(visibleKeys)) return { removed: 0 };
  const visibleSet = Object.create(null);
  for (let i = 0; i < visibleKeys.length; i++) visibleSet[String(visibleKeys[i])] = true;
  const kept = [];
  let removed = 0;
  for (let i = 0; i < q.pending.length; i++) {
    const key = q.pending[i];
    if (visibleSet[key]) {
      kept.push(key);
    } else {
      delete q.pendingSet[key]; // WAJIB bareng -- jangan biarkan pendingSet nyisa tanpa pending
      removed++;
    }
  }
  q.pending = kept;
  return { removed: removed, kept: kept.length };
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

