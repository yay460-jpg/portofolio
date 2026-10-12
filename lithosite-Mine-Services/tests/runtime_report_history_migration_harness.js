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

function storageWith(seed, options) {
  const values = Object.assign(Object.create(null), seed || {});
  const settings = options || {};
  return {
    get length() {
      if (settings.throwLength) throw new Error('length unavailable');
      return Object.keys(values).length;
    },
    key(index) {
      if (settings.throwKeyAt === index) throw new Error('key unavailable');
      return Object.keys(values)[index] || null;
    },
    getItem(key) {
      if (settings.throwGetItem === key) throw new Error('read unavailable');
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
    },
    setItem(key, value) {
      if (settings.throwSetItem) throw new Error('write unavailable');
      values[key] = String(value);
    },
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

{
  const invalidCanonical = '{broken';
  const validKey = legacyKey('valid-older');
  const records = [{ report_type: 'MONTHLY', snapshot_id: 'recoverable-entry' }];
  const storage = storageWith({
    [KEY]: invalidCanonical,
    [validKey]: JSON.stringify(records)
  }, { throwKeyAt: 0 });
  const history = loadHistory(storage);

  sameJson(history.list('MONTHLY'), records, 'A key enumeration error must not hide later valid legacy entries');
  sameJson(JSON.parse(storage.getItem(KEY)), records, 'Recovered history should normalize to the canonical key');
  assert.strictEqual(storage.getItem(validKey), JSON.stringify(records), 'Source legacy history must remain intact');
}

{
  const storage = storageWith({}, { throwLength: true });
  assert.strictEqual(loadHistory(storage).list().length, 0, 'Inaccessible storage should fail safely');
}

{
  const storage = storageWith({});
  const history = loadHistory(storage);
  assert.throws(
    () => history.save({ snapshot_id: 'draft-entry', snapshot: { immutable: false } }),
    /Only immutable issued snapshots/
  );
  const issued = {
    snapshot_id: 'issued-entry',
    report_type: 'DAILY',
    snapshot: { immutable: true, issued_at: '2026-10-13T00:00:00Z' }
  };
  history.save(issued);
  assert.strictEqual(history.get('issued-entry').snapshot_id, 'issued-entry');
}

console.log('REPORT_HISTORY_MIGRATION_PASS');
