const assert = require('assert');
const fs = require('fs');
const root = '/mnt/data/v25src/member-app/scripts/map';
const pkg = fs.readFileSync(root + '/map-package.js', 'utf8');
const layer = fs.readFileSync(root + '/map-layer-store.js', 'utf8');
const feature = fs.readFileSync(root + '/map-feature-store.js', 'utf8');
const lifecycle = fs.readFileSync(root + '/map-lifecycle-completion.js', 'utf8');

// V25.14.1 — v2/v3 -> v4 must be additive/non-destructive.
assert(pkg.includes('indexedDB.open(MAP_DB_NAME_, 4)'));
assert(pkg.includes("if (!db.objectStoreNames.contains(MAP_DB_STORE_))"));
assert(pkg.includes("if (!db.objectStoreNames.contains(KML_DB_STORE_))"));
assert(pkg.includes("if (!db.objectStoreNames.contains(LAYER_DB_STORE_))"));
assert(pkg.includes("if (!db.objectStoreNames.contains(MAP_LAYER_STATE_DB_STORE_))"));
assert(pkg.includes("if (!db.objectStoreNames.contains(FEATURE_DB_STORE_))"));
assert(pkg.includes("createIndex('mapId', 'mapId'"));
assert(pkg.includes("createIndex('layerId', 'layerId'"));

// Upgrade handler contains no destructive delete/clear operations.
const upgrade = pkg.slice(pkg.indexOf('req.onupgradeneeded'), pkg.indexOf('req.onsuccess'));
assert(!/\.delete\s*\(/.test(upgrade));
assert(!/\.clear\s*\(/.test(upgrade));

// V25.14.2 — failed child operations must abort their transaction before surfacing.
assert(layer.includes("tx.abort();"));
assert(feature.includes("tx.abort()"));
assert(layer.includes("throw storeError(C.errors.MAP_NOT_FOUND, 'createLayer')"));
assert(feature.includes("throw err(C.errors.LAYER_NOT_FOUND,'createFeature')"));

// Duplicate failure must remove the newly-created Map through the cascade primitive.
assert(lifecycle.includes('await persist_(copy);'));
assert(lifecycle.includes('await global.MG1MapLayerLibrary.cloneLayersForMap(source.id, newId);'));
assert(lifecycle.includes('await global.dbDeleteMap_(newId)'));

// Map delete primitive includes Map + Layer + Feature + active state in one tx.
const del = pkg.slice(pkg.indexOf('async function dbDeleteMap_'), pkg.indexOf('async function loadBackgroundMapsFromDb_'));
assert(del.includes("db.transaction(stores, 'readwrite')"));
assert(del.includes("tx.objectStore(MAP_DB_STORE_).delete(id)"));
assert(del.includes("layerStore.index('mapId')"));
assert(del.includes("featureIndex = tx.objectStore(FEATURE_DB_STORE_).index('layerId')"));
assert(del.includes("tx.objectStore(MAP_LAYER_STATE_DB_STORE_).delete(id)"));

console.log('PASS v25-migration-rollback.test.js');
