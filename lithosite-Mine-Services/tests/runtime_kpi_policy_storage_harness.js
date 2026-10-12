const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'ui', 'shared', 'kpi-policy-storage.js');
const source = fs.readFileSync(MODULE, 'utf8');
const KEY = 'lithosite.mine-services.kpi-policy';
const LEGACY_PREFIX = 'lithosite.mine-services.v';
const legacyKey = label => LEGACY_PREFIX + String(label.length) + '.kpi-policy';

function storageWith(seed) {
  const values = Object.assign(Object.create(null), seed || {});
  return {
    get length() { return Object.keys(values).length; },
    key(index) { return Object.keys(values)[index] || null; },
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; }
  };
}

function loadStore() {
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: MODULE });
  return context.LithositeKpiPolicyStorage;
}

function sameJson(actual, expected, message) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), message);
}

{
  const olderKey = legacyKey('old-policy');
  const newerKey = legacyKey('newest-policy');
  const older = { baselineId: 'BASELINE_OLD', euDenominator: 'AVAILABLE', effectiveTimeRule: 'PURE_EFFECTIVE' };
  const newer = { baselineId: 'BASELINE_NEW', euDenominator: 'SCHEDULED', effectiveTimeRule: 'STANDARD_CYCLE' };
  const storage = storageWith({
    [olderKey]: JSON.stringify(older),
    [newerKey]: JSON.stringify(newer)
  });
  const store = loadStore();

  const migrated = store.read(storage);
  sameJson(migrated.policy, newer, 'Newest valid policy should be selected');
  assert.strictEqual(migrated.legacy, true, 'Legacy reads must be marked as migrated');
  sameJson(JSON.parse(storage.getItem(KEY)), newer, 'Selected policy should be normalized into the canonical key');
  assert.strictEqual(storage.getItem(olderKey), JSON.stringify(older), 'Older compatibility data must remain');
  assert.strictEqual(storage.getItem(newerKey), JSON.stringify(newer), 'Migrated compatibility data must remain');
}

{
  const corruptNewestKey = legacyKey('corrupted-latest');
  const validOlderKey = legacyKey('valid-older');
  const fallback = { baselineId: 'BASELINE_FALLBACK', euDenominator: 'AVAILABLE', effectiveTimeRule: 'PURE_EFFECTIVE' };
  const storage = storageWith({
    [KEY]: '{broken',
    [corruptNewestKey]: '{invalid',
    [validOlderKey]: JSON.stringify(fallback)
  });
  const store = loadStore();

  const migrated = store.read(storage);
  sameJson(migrated.policy, fallback, 'Malformed current/newest values must not hide a valid older policy');
  assert.strictEqual(migrated.legacy, true, 'Recovered legacy policy must be marked as migrated');
  sameJson(JSON.parse(storage.getItem(KEY)), fallback, 'Recovered policy should become canonical');
  assert.strictEqual(storage.getItem(corruptNewestKey), '{invalid', 'Corrupt legacy entry must not be deleted');
  assert.strictEqual(storage.getItem(validOlderKey), JSON.stringify(fallback), 'Source legacy policy must remain intact');
}

{
  const current = { baselineId: 'BASELINE_CANONICAL', euDenominator: 'SCHEDULED', effectiveTimeRule: 'STANDARD_CYCLE' };
  const legacy = { baselineId: 'BASELINE_LEGACY', euDenominator: 'AVAILABLE', effectiveTimeRule: 'PURE_EFFECTIVE' };
  const legacyStorageKey = legacyKey('old');
  const storage = storageWith({
    [KEY]: JSON.stringify(current),
    [legacyStorageKey]: JSON.stringify(legacy)
  });
  const store = loadStore();

  const loaded = store.read(storage);
  sameJson(loaded.policy, current, 'Valid canonical policy must take precedence');
  assert.strictEqual(loaded.legacy, false, 'Canonical reads must not be marked as migrated');
  assert.strictEqual(storage.getItem(legacyStorageKey), JSON.stringify(legacy), 'Canonical read must not mutate compatibility data');
}

assert.strictEqual(loadStore().read(null), null, 'Unavailable storage should be safely ignored');
console.log('KPI_POLICY_STORAGE_MIGRATION_PASS');
