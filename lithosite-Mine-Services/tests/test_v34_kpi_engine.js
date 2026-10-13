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
  'availability-time-contract.js',
  'pa-engine.js',
  'used-time-contract.js',
  'ua-engine.js',
  'eu-engine.js'
].forEach(function (file) {
  const source = fs.readFileSync(path.join(REPORTS, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
});

const engine = context.LithositeKPIEngine;

function testReadyCascade() {
  const result = engine.calculateBundle({
    scheduledHours: 10,
    usedHours: 5,
    effectiveHours: 4,
    timeline: [
      {
        event_id: 'E1',
        start: '2026-10-03T06:00:00',
        end: '2026-10-03T10:00:00',
        availability: engine.AVAILABILITY.AVAILABLE,
        usage: engine.USAGE.USED,
        effectiveness: engine.EFFECTIVENESS.EFFECTIVE
      },
      {
        event_id: 'E2',
        start: '2026-10-03T10:00:00',
        end: '2026-10-03T12:00:00',
        availability: engine.AVAILABILITY.AVAILABLE,
        usage: engine.USAGE.NOT_USED,
        effectiveness: engine.EFFECTIVENESS.NOT_EFFECTIVE
      }
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.results.PA.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.results.PA.value, 60);
  assert.strictEqual(result.results.UA.status, engine.KPI_STATUS.READY);
  assert.strictEqual(result.results.UA.value, (4 / 6) * 100);
  assert.strictEqual(result.results.EU.status, engine.KPI_STATUS.PENDING_DEFINITION);
  assert.strictEqual(result.results.EU.value, null);
  assert.strictEqual(result.results.MTBF.status, engine.KPI_STATUS.HOLD);
  assert.strictEqual(result.results.MTTR.status, engine.KPI_STATUS.HOLD);
}

function testUnresolvedTimelineBlocksBundle() {
  const result = engine.calculateBundle({
    scheduledHours: 10,
    usedHours: 5,
    effectiveHours: 4,
    timeline: [
      {
        event_id: 'E1',
        start: '2026-10-03T06:00:00',
        end: '2026-10-03T10:00:00',
        availability: engine.AVAILABILITY.UNRESOLVED,
        usage: engine.USAGE.UNRESOLVED,
        effectiveness: engine.EFFECTIVENESS.UNRESOLVED
      }
    ]
  });

  assert.strictEqual(result.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.results.PA, null);
  assert.strictEqual(result.results.UA, null);
  assert.strictEqual(result.results.EU, null);
}

function testAvailableCannotExceedScheduled() {
  const result = engine.calculateBundle({
    scheduledHours: 4,
    availableHours: 5,
    usedHours: 2,
    effectiveHours: 1,
    timeline: [
      {
        event_id: 'E1',
        start: '2026-10-03T06:00:00',
        end: '2026-10-03T11:00:00',
        availability: engine.AVAILABILITY.AVAILABLE,
        usage: engine.USAGE.USED,
        effectiveness: engine.EFFECTIVENESS.EFFECTIVE
      }
    ]
  });

  assert.strictEqual(result.results.PA.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.results.UA.status, engine.KPI_STATUS.NEEDS_VALIDATION);
  assert.strictEqual(result.results.EU.status, engine.KPI_STATUS.NEEDS_VALIDATION);
}

function testHoldEnginesRemainHold() {
  const status = engine.getEngineStatus();
  assert.strictEqual(status.MTBF.status, engine.ENGINE_STATUS.HOLD);
  assert.strictEqual(status.MTTR.status, engine.ENGINE_STATUS.HOLD);
}

testReadyCascade();
testUnresolvedTimelineBlocksBundle();
testAvailableCannotExceedScheduled();
testHoldEnginesRemainHold();

console.log('V34 KPI ENGINE CASCADE TEST PASS');
