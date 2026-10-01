// V30 runtime synchronization smoke harness.
// Run from the repository root with:
//   node tests/runtime_sync_harness.js
// This executes the production data-sync.js and runtime-client.js in a small browser-like VM.

const fs = require('fs');
const vm = require('vm');

const listeners = {};
const window = {
  addEventListener(name, fn) {
    (listeners[name] ||= []).push(fn);
  },
  dispatchEvent(event) {
    for (const fn of (listeners[event.type] || [])) fn(event);
    return true;
  }
};

class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = (init && init.detail) || {};
  }
}

const responses = [];
let fetchIndex = 0;

async function fetchMock() {
  const result = responses[fetchIndex++];
  return { ok: true, async json() { return result; } };
}

const context = {
  window, CustomEvent, fetch: fetchMock, console, Promise, Map, Object,
  Date, Math, String, Array, setTimeout, clearTimeout
};
vm.createContext(context);

const root = require('path').resolve(__dirname, '..');
vm.runInContext(fs.readFileSync(require('path').join(root, 'ui/shared/data-sync.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(require('path').join(root, 'ui/shared/runtime-client.js'), 'utf8'), context);

const sync = context.window.LithositeDataSync;
const client = context.window.LithositeRuntimeClient;

const names = ['Dashboard','Operations','Equipment','WorkFront','Maintenance','Issues','Plans','HSE','Reports'];
const refreshes = new Map(names.map(name => [name, 0]));

for (const name of names) {
  sync.register(name, () => refreshes.set(name, refreshes.get(name) + 1));
}

const snapshot = () => Object.fromEntries(refreshes);

async function settle() {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
}

async function mutation(operation, entity, entityId) {
  const before = snapshot();
  responses.push({status: 'COMMITTED'});
  await client.request({operation, entity, entity_id: entityId, request_id: operation + '-' + (entityId || 'ALL')});
  await settle();
  const after = snapshot();
  const delta = Object.fromEntries(
    Object.keys(after).map(name => [name, after[name] - before[name]])
  );

  for (const name of names) {
    const expected = entity && name === entity ? 0 : 1;
    if (delta[name] !== expected) {
      throw new Error(operation + ': ' + name + ' expected ' + expected + ' refresh, got ' + delta[name]);
    }
  }
}

(async () => {
  await mutation('CREATE', 'Operations', 'SYNC-CREATE');
  await mutation('UPDATE', 'Operations', 'SYNC-UPDATE');
  await mutation('DELETE', 'Operations', 'SYNC-DELETE');
  await mutation('IMPORT_XLSX', null, null);
  await mutation('RESTORE', null, null);

  const beforeRejected = snapshot();
  responses.push({status: 'REJECTED'});
  await client.request({
    operation: 'UPDATE',
    entity: 'Issues',
    entity_id: 'SYNC-REJECTED',
    request_id: 'SYNC-REJECTED'
  });
  await settle();
  if (JSON.stringify(beforeRejected) !== JSON.stringify(snapshot())) {
    throw new Error('REJECTED mutation emitted lithosite:runtime-mutated');
  }

  console.log('RUNTIME_SYNC_TEST_PASS');
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
