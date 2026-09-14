/* MG1 STEP 9.9 - MAP PACKAGE / IndexedDB boundary. Logic preserved verbatim. */

const MAP_DB_NAME_ = 'mg1_background_maps';
const MAP_DB_STORE_ = 'maps';
const KML_DB_STORE_ = 'kmlOverlays';
const LAYER_DB_STORE_ = 'layers';
const MAP_LAYER_STATE_DB_STORE_ = 'mapLayerState';
const FEATURE_DB_STORE_ = 'features';

function openMapDb_() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MAP_DB_NAME_, 4); // V25: semantic Layer + Feature stores; existing Map/KML stores preserved
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MAP_DB_STORE_)) db.createObjectStore(MAP_DB_STORE_, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(KML_DB_STORE_)) db.createObjectStore(KML_DB_STORE_, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(LAYER_DB_STORE_)) {
        const layerStore = db.createObjectStore(LAYER_DB_STORE_, { keyPath: 'id' });
        layerStore.createIndex('mapId', 'mapId', { unique: false });
      }
      if (!db.objectStoreNames.contains(MAP_LAYER_STATE_DB_STORE_)) {
        db.createObjectStore(MAP_LAYER_STATE_DB_STORE_, { keyPath: 'mapId' });
      }
      if (!db.objectStoreNames.contains(FEATURE_DB_STORE_)) {
        const featureStore = db.createObjectStore(FEATURE_DB_STORE_, { keyPath: 'id' });
        featureStore.createIndex('layerId', 'layerId', { unique: false });
      }
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
    // V25.6 storage cascade: Map deletion and its semantic Layer subtree
    // are committed atomically. Map-package remains the IndexedDB primitive
    // owner; it does not interpret Layer business rules.
    const stores = [MAP_DB_STORE_];
    if (db.objectStoreNames.contains(LAYER_DB_STORE_)) stores.push(LAYER_DB_STORE_);
    if (db.objectStoreNames.contains(MAP_LAYER_STATE_DB_STORE_)) stores.push(MAP_LAYER_STATE_DB_STORE_);
    if (db.objectStoreNames.contains(FEATURE_DB_STORE_)) stores.push(FEATURE_DB_STORE_);
    const tx = db.transaction(stores, 'readwrite');
    tx.objectStore(MAP_DB_STORE_).delete(id);
    if (stores.includes(LAYER_DB_STORE_)) {
      const layerStore = tx.objectStore(LAYER_DB_STORE_);
      const layerIndex = layerStore.index('mapId');
      const layerReq = layerIndex.openCursor(IDBKeyRange.only(id));
      layerReq.onsuccess = () => {
        const layerCursor = layerReq.result;
        if (!layerCursor) return;
        const layerId = layerCursor.primaryKey;
        layerCursor.delete();
        if (stores.includes(FEATURE_DB_STORE_)) {
          const featureIndex = tx.objectStore(FEATURE_DB_STORE_).index('layerId');
          const featureReq = featureIndex.openCursor(IDBKeyRange.only(layerId));
          featureReq.onsuccess = () => {
            const featureCursor = featureReq.result;
            if (featureCursor) {
              featureCursor.delete();
              featureCursor.continue();
              return;
            }
            layerCursor.continue();
          };
        } else {
          layerCursor.continue();
        }
      };
    }
    if (stores.includes(MAP_LAYER_STATE_DB_STORE_)) {
      tx.objectStore(MAP_LAYER_STATE_DB_STORE_).delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Map delete transaction aborted'));
    tx.onerror = () => reject(tx.error || new Error('Map delete transaction failed'));
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
