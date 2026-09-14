const assert = require('assert');
const fs = require('fs');

const store = fs.readFileSync('scripts/map/map-layer-store.js', 'utf8');
const capability = fs.readFileSync('scripts/map/map-layer-capability.js', 'utf8');

// V25.9 invariant: updating an ACTIVE Layer to hidden must clear activeLayerId atomically.
const updStart = store.indexOf('async function updateLayer');
const updEnd = store.indexOf('\n  async function setVisibility', updStart);
const updBlock = store.slice(updStart, updEnd);
assert(updStart >= 0 && updEnd > updStart, 'updateLayer block missing');
assert.match(updBlock, /db\.transaction\(\[LAYER_STORE, LAYER_STATE_STORE\],\s*'readwrite'\)/,
  'updateLayer visibility/state change must share one readwrite transaction');
assert.match(updBlock, /normalized\.visible === false/,
  'updateLayer must inspect resulting visibility');
assert.match(updBlock, /state\.activeLayerId === current\.id/,
  'updateLayer must inspect current active state');
assert.match(updBlock, /activeLayerId:\s*null/,
  'updateLayer must clear activeLayerId when hiding active Layer');

// Capability ordering must remain deterministic with explicit tie-breakers.
assert.match(capability, /if \(sortBy === 'name'\).*compareText\(a\.name, b\.name\)/s);
assert.match(capability, /else if \(sortBy === 'type'\).*compareText\(a\.type, b\.type\)/s);
assert.match(capability, /else if \(sortBy === 'id'\).*compareText\(a\.id, b\.id\)/s);
assert.match(capability, /result = compareText\(a\.name, b\.name\);/);
assert.match(capability, /return compareText\(a\.id, b\.id\);/);

// Active filter is state-driven, not inferred from Layer record fields.
assert.match(capability, /activeId = await L\.getActiveLayer\(mapId\)/);
assert(!/row\.active/.test(capability), 'semantic Layer must not use row.active as canonical active state');

console.log('PASS v25-order-active-regression.test.js');
