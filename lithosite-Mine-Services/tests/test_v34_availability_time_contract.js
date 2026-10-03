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
  'availability-time-contract.js'
].forEach(function (file) {
  const source = fs.readFileSync(path.join(REPORTS, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const engine = context.LithositeKPIEngine;
const contract = context.LithositeAvailableTimeContract;

function event(id, start, end, availability, usage) {
  return {
    event_id: id,
    start,
    end,
    availability,
    usage: usage || engine.USAGE.NOT_USED,
    effectiveness: engine.EFFECTIVENESS.NOT_EFFECTIVE
  };
}

function testAvailableTimeIsSummedFromValidatedIntervals() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T10:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.USED),
      event('E2', '2026-10-03T10:00:00', '2026-10-03T12:00:00', engine.AVAILABILITY.NOT_AVAILABLE),
      event('E3', '2026-10-03T12:00:00', '2026-10-03T15:00:00', engine.AVAILABILITY.AVAILABLE)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.availableHours, 7);
  assert.deepStrictEqual(result.availableEventIds, ['E1', 'E3']);
  assert.strictEqual(result.notAvailableHours, 2);
}

function testInternalGapNeedsValidation() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T10:00:00', engine.AVAILABILITY.AVAILABLE),
      event('E2', '2026-10-03T11:00:00', '2026-10-03T12:00:00', engine.AVAILABILITY.NOT_AVAILABLE)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.availableHours, null);
  assert.strictEqual(result.unresolvedGaps.length, 1);
}

function testUnresolvedClassificationNeedsValidation() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T10:00:00', engine.AVAILABILITY.UNRESOLVED)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.availableHours, null);
}

function testAvailableAndNotUsedStillCountsAvailable() {
  const result = contract.summarize({
    timeline: [
      event('E1', '2026-10-03T06:00:00', '2026-10-03T08:00:00', engine.AVAILABILITY.AVAILABLE, engine.USAGE.NOT_USED)
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.availableHours, 2);
}

testAvailableTimeIsSummedFromValidatedIntervals();
testInternalGapNeedsValidation();
testUnresolvedClassificationNeedsValidation();
testAvailableAndNotUsedStillCountsAvailable();

console.log('V34 AVAILABLE TIME CONTRACT TEST PASS');
