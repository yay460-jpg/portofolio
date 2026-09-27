/* MG1 STEP 9.9 - MAP PACKAGE / IndexedDB boundary. Logic preserved verbatim. */

const MAP_DB_NAME_ = 'mg1_background_maps';
const MAP_DB_STORE_ = 'maps';
const KML_DB_STORE_ = 'kmlOverlays';

function openMapDb_() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MAP_DB_NAME_, 2); // [BARU -- 5 Sep] versi 1->2, tambah store KML
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAP_DB_STORE_)) db.createObjectStore(MAP_DB_STORE_, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(KML_DB_STORE_)) db.createObjectStore(KML_DB_STORE_, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAllMaps_() {
  const db = await openMapDb_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAP_DB_STORE_, 'readonly');
    const req = tx.objectStore(MAP_DB_STORE_).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPutMap_(entry) {
  const db = await openMapDb_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAP_DB_STORE_, 'readwrite');
    tx.objectStore(MAP_DB_STORE_).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDeleteMap_(id) {
  const db = await openMapDb_();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MAP_DB_STORE_, 'readwrite');
    tx.objectStore(MAP_DB_STORE_).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadBackgroundMapsFromDb_() {
  try {
    backgroundMapsList = await dbGetAllMaps_();
    backgroundMapsList.forEach(m => {
      if (m && m.tilePyramid && typeof m.tilePyramid === 'object' && !m.tilePyramid.runtimeMapId) {
        m.tilePyramid.runtimeMapId = m.id;
      }
    });
    const stored = localStorage.getItem('mg1_active_bg_map_id');
    if (stored && backgroundMapsList.find(m => m.id === stored)) { activeBackgroundMapId = stored; mapZoom = 1.25; mapViewportState_.centerNative = null; }
  } catch (e) {
    console.warn('Gagal muat daftar peta background (IndexedDB mungkin tidak didukung):', e);
    backgroundMapsList = [];
  }
  // [BARU -- 5 Sep] Muat juga daftar KML overlay + status aktif mana saja (bisa >1).
  try {
    const db = await openMapDb_();
    kmlOverlaysList = await new Promise((resolve, reject) => {
      const tx = db.transaction(KML_DB_STORE_, 'readonly');
      const req = tx.objectStore(KML_DB_STORE_).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const storedActive = localStorage.getItem('mg1_active_kml_ids');
    if (storedActive) {
      const parsed = JSON.parse(storedActive);
      activeKmlOverlayIds = parsed.filter(id => kmlOverlaysList.find(k => k.id === id));
    }
  } catch (e) {
    console.warn('Gagal muat daftar KML overlay:', e);
    kmlOverlaysList = [];
  }
}
