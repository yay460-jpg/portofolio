const assert = require('assert');
const fs = require('fs');

const pkg = fs.readFileSync('scripts/map/map-package.js', 'utf8');
const lifecycle = fs.readFileSync('scripts/map/map-lifecycle-completion.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

// V25.7 regression contract: Map delete remains the durable cascade boundary.
assert.match(pkg, /indexedDB\.open\(MAP_DB_NAME_,\s*4\)/, 'IndexedDB must remain v4 after Feature store migration');
assert.match(pkg, /db\.transaction\(stores,\s*'readwrite'\)/, 'Map delete cascade must be one readwrite transaction');
assert.match(pkg, /layerStore\.index\('mapId'\)/, 'Layer cascade must use mapId index');
assert.match(pkg, /MAP_LAYER_STATE_DB_STORE_\)\.delete\(id\)/, 'Map layer state must be deleted with Map');
assert.match(pkg, /stores\.push\(FEATURE_DB_STORE_\)/, 'Map delete must include Feature store in the atomic cascade');
assert.match(pkg, /index\('layerId'\)/, 'Feature cascade must use layerId index');

// V25.7 regression contract: Duplicate copies the Layer subtree and rolls back the new Map on failure.
assert.match(lifecycle, /cloneLayersForMap\(source\.id,\s*newId\)/, 'Duplicate must clone semantic Layers');
assert.match(lifecycle, /dbDeleteMap_\(newId\)/, 'Duplicate failure must rollback newly created Map');

// V24.4 Replace must remain Map-payload replacement, not Layer replacement.
const replaceStart = lifecycle.indexOf('async function commitReplacement_');
const replaceEnd = lifecycle.indexOf('async function saveReplacement_', replaceStart);
const replaceBlock = lifecycle.slice(replaceStart, replaceEnd);
assert(!/cloneLayersForMap|deleteLayer|updateLayer|setActiveLayer/.test(replaceBlock),
  'Replace must not mutate semantic Layer state');
assert.match(replaceBlock, /persist_\(entry\)/, 'Replace must persist Map payload through existing boundary');

// Layer subsystem must load before lifecycle completion.
const contractPos = index.indexOf('scripts/map/map-layer-contract.js');
const storePos = index.indexOf('scripts/map/map-layer-store.js');
const libraryPos = index.indexOf('scripts/map/map-layer-library.js');
const lifecyclePos = index.indexOf('scripts/map/map-lifecycle-completion.js');
assert(contractPos >= 0 && storePos > contractPos && libraryPos > storePos && lifecyclePos > libraryPos,
  'Layer dependencies must precede Map lifecycle completion');


const layerStore = fs.readFileSync('scripts/map/map-layer-store.js', 'utf8');
assert.match(layerStore, /var FEATURE_STORE = 'features'/, 'Layer store must know Feature persistence boundary');
const deleteLayerStart = layerStore.indexOf('async function deleteLayer');
const deleteLayerEnd = layerStore.indexOf('async function cloneLayersForMap', deleteLayerStart);
const deleteLayerBlock = layerStore.slice(deleteLayerStart, deleteLayerEnd);
assert.match(deleteLayerBlock, /db\.transaction\(stores,\s*'readwrite'\)/, 'Layer delete + Feature subtree must be atomic');
assert.match(deleteLayerBlock, /features\.index\('layerId'\)/, 'Layer delete must cascade Features by layerId');
const cloneStart = layerStore.indexOf('async function cloneLayersForMap');
const cloneBlock = layerStore.slice(cloneStart);
assert.match(cloneBlock, /features\.index\('layerId'\)/, 'Map duplicate must read Features by layerId');
assert.match(cloneBlock, /layerId: targetLayerId/, 'Cloned Features must point to cloned Layer');

console.log('PASS v25-regression-static.test.js');
