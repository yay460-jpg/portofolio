const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'ui', 'modules', 'reports', 'report-history.js');
const source = fs.readFileSync(MODULE, 'utf8');
const KEY = 'lithosite.mine-services.report-history';
const LEGACY_PREFIX = 'lithosite.mine-services.v';
const legacyKey = label => LEGACY_PREFIX + String(label.length) + '.report-history';

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

function loadHistory(storage) {
  const context = { localStorage: storage };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: MODULE });
  return context.LithositeReportHistory;
}

function sameJson(actual, expected, message) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), message);
}

{
  const olderKey = legacyKey('old');
  const newerKey = legacyKey('newer-cache');
  const older = [{ report_type: 'DAILY', snapshot_id: 'older-entry' }];
  const newer = [{ report_type: 'DAILY', snapshot_id: 'newer-entry' }];
  const storage = storageWith({
    [olderKey]: JSON.stringify(older),
    [newerKey]: JSON.stringify(newer)
  });
  const history = loadHistory(storage);

  sameJson(history.list('DAILY'), newer, 'Most recent valid legacy history should win');
  sameJson(JSON.parse(storage.getItem(KEY)), newer, 'Migrated history should be copied into the canonical key');
  assert.strictEqual(storage.getItem(olderKey), JSON.stringify(older), 'Older legacy data must not be deleted');
  assert.strictEqual(storage.getItem(newerKey), JSON.stringify(newer), 'Selected legacy data must not be deleted');
}

{
  const invalidCanonical = '{broken';
  const corruptNewestKey = legacyKey('corrupted-latest');
  const validOlderKey = legacyKey('valid-older');
  const validFallback = [{ report_type: 'WEEKLY', snapshot_id: 'recoverable-entry' }];
  const storage = storageWith({
    [KEY]: invalidCanonical,
    [corruptNewestKey]: '{invalid',
    [validOlderKey]: JSON.stringify(validFallback)
  });
  const history = loadHistory(storage);

  sameJson(history.list('WEEKLY'), validFallback, 'Malformed caches must not hide a valid legacy history');
  sameJson(JSON.parse(storage.getItem(KEY)), validFallback, 'Recovered history should replace only the malformed canonical value');
  assert.strictEqual(storage.getItem(corruptNewestKey), '{invalid', 'Malformed legacy cache must be preserved for audit');
  assert.strictEqual(storage.getItem(validOlderKey), JSON.stringify(validFallback), 'Source legacy cache must be preserved');
}

{
  const current = [{ report_type: 'MONTHLY', snapshot_id: 'canonical-entry' }];
  const legacy = [{ report_type: 'MONTHLY', snapshot_id: 'legacy-entry' }];
  const legacyStorageKey = legacyKey('old');
  const storage = storageWith({
    [KEY]: JSON.stringify(current),
    [legacyStorageKey]: JSON.stringify(legacy)
  });
  const history = loadHistory(storage);

  sameJson(history.list('MONTHLY'), current, 'Valid canonical history must take precedence');
  assert.strictEqual(storage.getItem(legacyStorageKey), JSON.stringify(legacy), 'Canonical reads must not mutate legacy history');
}

console.log('REPORT_HISTORY_MIGRATION_PASS');
