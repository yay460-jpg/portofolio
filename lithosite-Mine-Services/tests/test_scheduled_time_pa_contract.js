/*
 * V34 — Scheduled Time / PA Contract Test
 *
 * Verifies:
 * 1. a resolved baseline without an approved Scheduled Time definition
 *    does not allow PA to invent a denominator;
 * 2. an explicit approved Scheduled Time can flow into PA;
 * 3. the PA result remains traceable to the Scheduled Time contract.
 */

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
  'pa-engine.js',
  'time-baseline-resolver.js',
  'scheduled-time-contract.js'
].forEach(function (file) {
  vm.runInContext(
    fs.readFileSync(path.join(REPORTS, file), 'utf8'),
    context,
    { filename: file }
  );
});

const engine = context.LithositeKPIEngine;
const resolver = context.LithositeTimeBaselineResolver;
const scheduledContract = context.LithositeScheduledTimeContract;
const pa = context.LithositePAEngine;

const baseline = {
  baseline_id: 'TB-001',
  baseline_name: 'Day Shift',
  operation: 'Mining',
  site: 'Site-A',
  shift_code: 'DAY',
  shift_start: '06:00',
  shift_end: '18:00',
  effective_from: '2026-10-01',
  status: 'ACTIVE'
};

const timeline = [
  {
    event_id: 'E1',
    start: '2026-10-03T06:00:00',
    end: '2026-10-03T10:00:00',
    availability: engine.AVAILABILITY.AVAILABLE,
    usage: engine.USAGE.USED,
    effectiveness: engine.EFFECTIVENESS.EFFECTIVE
  }
];

function testPendingScheduledTimeDoesNotInventDenominator() {
  const resolution = resolver.resolve(
    {
      operation: 'Mining',
      site: 'Site-A',
      shift: 'DAY',
      date: '2026-10-03'
    },
    [baseline]
  );

  assert.strictEqual(resolution.status, engine.KPI_STATUS.READY);

  const contract = scheduledContract.build(resolution);

  assert.strictEqual(
    contract.status,
    engine.KPI_STATUS.PENDING_DEFINITION
  );
  assert.strictEqual(contract.scheduledHours, null);

  const result = pa.calculate({
    scheduledTime: contract,
    timeline: timeline,
    availableHours: 4
  });

  assert.strictEqual(
    result.status,
    engine.KPI_STATUS.PENDING_DEFINITION
  );
  assert.strictEqual(result.value, null);
}

function testExplicitApprovedScheduledTimeFlowsToPA() {
  const resolution = resolver.resolve(
    {
      operation: 'Mining',
      site: 'Site-A',
      shift: 'DAY',
      date: '2026-10-03'
    },
    [baseline]
  );

  const contract = scheduledContract.build(resolution, 10);

  assert.strictEqual(contract.status, engine.KPI_STATUS.READY);
  assert.strictEqual(contract.scheduledHours, 10);
  assert.strictEqual(contract.sourceBaselineId, 'TB-001');

  const result = pa.calculate({
    scheduledTime: contract,
    timeline: timeline,
    availableHours: 4
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.value, 40);
  assert.strictEqual(result.denominatorHours, 10);
}

function testZeroAndMultipleBaselineDoNotGuess() {
  const request = {
    operation: 'Mining',
    site: 'Site-A',
    shift: 'DAY',
    date: '2026-10-03'
  };

  const none = resolver.resolve(request, []);
  assert.strictEqual(none.status, engine.KPI_STATUS.NEEDS_VALIDATION);

  const second = Object.assign({}, baseline, { baseline_id: 'TB-002' });
  const multiple = resolver.resolve(request, [baseline, second]);
  assert.strictEqual(multiple.status, engine.KPI_STATUS.NEEDS_VALIDATION);
}

testPendingScheduledTimeDoesNotInventDenominator();
testExplicitApprovedScheduledTimeFlowsToPA();
testZeroAndMultipleBaselineDoNotGuess();

console.log('V34 SCHEDULED TIME PA CONTRACT TEST PASS');
