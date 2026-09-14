const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('scripts/map/map-layer-contract.js', 'utf8');
const context = {
  window: {},
  console: { log() {} }
};
vm.createContext(context);
vm.runInContext(source, context);

const C = context.window.MG1MapLayerContract;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const valid = {
  id: 'layer-1',
  mapId: 'map-1',
  name: 'Geology',
  type: 'geology',
  order: 1,
  visible: true,
  metadata: { source: 'field' }
};

assert(C.validate(valid).ok, 'valid Layer must pass');

const normalized = C.normalize(valid);
assert(normalized.schemaVersion === 1, 'schemaVersion must be 1');
assert(normalized.active === undefined, 'active must not exist on Layer');
assert(normalized.mapId === 'map-1', 'mapId must be preserved');
assert(normalized.visible === true, 'visible must be preserved');
assert(normalized.metadata !== valid.metadata, 'metadata must be copied');

const defaults = C.normalize({ id: 'layer-2', mapId: 'map-1', name: 'New Layer' });
assert(defaults.type === 'generic', 'default type must be generic');
assert(defaults.order === 0, 'default order must be 0');
assert(defaults.visible === true, 'default visibility must be true');

assert(!C.validate({ id: 'layer-1', name: 'Missing map' }).ok, 'missing mapId must fail');
assert(!C.validate({ id: 'layer-1', mapId: 'map-1', name: 'Bad', active: true }).ok,
  'active field must fail');
assert(!C.validate({ id: 'layer-1', mapId: 'map-1', name: 'Bad', geoReference: {} }).ok,
  'GeoReference must fail');
assert(!C.validate({ id: 'layer-1', mapId: 'map-1', name: 'Bad', order: NaN }).ok,
  'non-finite order must fail');
assert(!C.validate({ id: 'layer-1', mapId: 'map-1', name: 'Bad', visible: 'true' }).ok,
  'non-boolean visible must fail');

console.log('PASS map-layer-contract.test.js');
