const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'ui', 'modules', 'reports');

const context = { console };
context.window = context;
vm.createContext(context);

[
  'kpi-engine.js',
  'used-time-contract.js'
].forEach(function (file) {
  const source = fs.readFileSync(path.join(REPORTS, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const engine = context.LithositeKPIEngine;
const contract = context.LithositeUsedTimeContract;

function event(id, start, end, availability, usage) {
  return {
    event_id: id,
    start,
    end,
    availability,
    usage,
    effectiveness: engine.EFFECTIVENESS.NOT_EFFECTIVE
  };
}

function testOnlyAvailableUsedCounts() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T09:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.USED),
      event('E2', '2026-10-03T09:00:00', '2026-10-03T11:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.NOT_USED),
      event('E3', '2026-10-03T11:00:00', '2026-10-03T12:00:00', engine.AVAILABILITY.NOT_AVAILABLE, engine.USAGE.NOT_USED)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.usedHours, 3);
  assert.deepStrictEqual(result.usedEventIds, ['E1']);
  assert.strictEqual(result.notUsedAvailableHours, 2);
}

function testUnresolvedBlocksUsedTime() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T09:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.UNRESOLVED)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.usedHours, null);
}

function testGapBlocksUsedTime() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T09:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.USED),
      event('E2', '2026-10-03T10:00:00', '2026-10-03T12:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.USED)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.usedHours, null);
}

testOnlyAvailableUsedCounts();
testUnresolvedBlocksUsedTime();
testGapBlocksUsedTime();

console.log('V34 USED TIME CONTRACT TEST PASS');
