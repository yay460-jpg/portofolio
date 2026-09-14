const assert = require('assert');
const fs = require('fs');

const store = fs.readFileSync('scripts/map/map-layer-store.js', 'utf8');
const pkg = fs.readFileSync('scripts/map/map-package.js', 'utf8');

// V25.8 state invariant: hiding the active Layer must clear activeLayerId atomically.
const visStart = store.indexOf('async function setVisibility');
const visEnd = store.indexOf('async function getActiveLayer', visStart);
const visBlock = store.slice(visStart, visEnd);
assert(visStart >= 0 && visEnd > visStart, 'setVisibility block missing');
assert.match(visBlock, /db\.transaction\(\[LAYER_STORE, LAYER_STATE_STORE\],\s*'readwrite'\)/,
  'visibility + active state must share one readwrite transaction');
assert.match(visBlock, /state\.activeLayerId === current\.id/,
  'visibility must inspect active state');
assert.match(visBlock, /activeLayerId:\s*null/,
  'hiding active Layer must clear activeLayerId');
assert.match(visBlock, /await txDone/,
  'visibility transaction completion must be awaited');

// Regression: transaction completion handlers are attached immediately after tx creation.
for (const fn of ['createLayer','updateLayer','setVisibility','setActiveLayer','deleteLayer','cloneLayersForMap']) {
  const start = store.indexOf('async function ' + fn);
  const end = store.indexOf('\n  async function ', start + 1);
  const block = store.slice(start, end < 0 ? store.length : end);
  const txPos = block.indexOf('var tx = db.transaction');
  const donePos = block.indexOf('var txDone = transactionPromise');
  assert(txPos >= 0 && donePos > txPos && donePos - txPos < 180,
    fn + ': transaction completion listener must be registered immediately');
}

// V25.10 schema/recovery boundary advances to IndexedDB v4 for Feature persistence with durable state store.
assert.match(pkg, /indexedDB\.open\(MAP_DB_NAME_,\s*4\)/);
assert.match(pkg, /createObjectStore\(MAP_LAYER_STATE_DB_STORE_/, 'durable mapLayerState store missing');

console.log('PASS v25-persistence-regression.test.js');
