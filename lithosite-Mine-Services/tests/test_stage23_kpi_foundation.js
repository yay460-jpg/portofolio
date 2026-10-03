const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const context = {
  console,
  JSON,
  Number,
  String,
  Boolean,
  Date,
  Math,
  Array,
  Object,
  parseInt,
  parseFloat,
  isFinite,
  setTimeout,
  clearTimeout,
  window: {}
};
context.window = context;
vm.createContext(context);

[
  'ui/modules/reports/kpi-engine.js',
  'ui/modules/reports/availability-time-contract.js',
  'ui/modules/reports/pa-engine.js',
  'ui/modules/reports/used-time-contract.js',
  'ui/modules/reports/ua-engine.js',
  'ui/modules/reports/eu-engine.js',
  'ui/modules/reports/kpi-foundation.js'
].forEach(file => vm.runInContext(
  fs.readFileSync(path.join(ROOT, file), 'utf8'),
  context,
  { filename: file }
));

const f = context.LithositeKPIFoundation;
const b = f.DEFAULT_BASELINE;

const operations = [
  { transaction_id:'OPS-1', transaction_date:'2026-10-04', transaction_time:'06:00', equipment_id:'EQ-01', work_front_id:'WF-01', activity:'Loading', actual_hours:4, status:'VALIDATED' },
  { transaction_id:'OPS-2', transaction_date:'2026-10-04', transaction_time:'10:00', equipment_id:'EQ-01', work_front_id:'WF-01', activity:'Hauling', actual_hours:2, status:'VALIDATED' },
  { transaction_id:'OPS-3', transaction_date:'2026-10-04', transaction_time:'13:00', equipment_id:'EQ-01', work_front_id:'WF-01', activity:'Loading', actual_hours:2, status:'VALIDATED' },
  { transaction_id:'OPS-4', transaction_date:'2026-10-04', transaction_time:'17:00', equipment_id:'EQ-01', work_front_id:'WF-01', activity:'Hauling', actual_hours:1, status:'VALIDATED' }
];

const maintenance = [
  { maintenance_id:'MNT-1', equipment_id:'EQ-01', event_date:'2026-10-04', event_type:'Breakdown', failure_code:'HYD', start_time:'15:00', end_time:'17:00', status:'Completed' }
];

const unit = f.calculateEquipment({
  equipmentId:'EQ-01',
  date:'2026-10-04',
  baseline:b,
  operations,
  maintenance
});

assert.equal(unit.status, 'READY');
assert.equal(unit.timeline.scheduledHours, 11);
assert.equal(unit.timeline.events.length, 5);
assert(Math.abs(unit.results.PA.value - (9 / 11 * 100)) < 1e-9);
assert(Math.abs(unit.results.UA.value - (7 / 9 * 100)) < 1e-9);
assert.equal(unit.results.EU.status, 'PENDING_DEFINITION');

const gap = f.calculateEquipment({
  equipmentId:'EQ-01',
  date:'2026-10-04',
  baseline:b,
  operations:operations.filter(x => x.transaction_id !== 'OPS-2'),
  maintenance
});
assert.equal(gap.status, 'NEEDS_VALIDATION');
assert(gap.timeline.issues.some(x => x.code === 'TIMELINE_GAP'));

const overlap = f.calculateEquipment({
  equipmentId:'EQ-01',
  date:'2026-10-04',
  baseline:b,
  operations:operations.concat([
    { transaction_id:'OPS-5', transaction_date:'2026-10-04', transaction_time:'11:00', equipment_id:'EQ-01', work_front_id:'WF-01', activity:'Overlap', actual_hours:2, status:'VALIDATED' }
  ]),
  maintenance
});
assert.equal(overlap.status, 'NEEDS_VALIDATION');
assert(overlap.timeline.issues.some(x => x.code === 'TIMELINE_OVERLAP'));

const fleet = f.calculateFleet({
  date:'2026-10-04',
  baseline:b,
  equipment:[{equipment_id:'EQ-01'}, {equipment_id:'EQ-02'}],
  operations:operations.concat([
    { transaction_id:'OPS-21', transaction_date:'2026-10-04', transaction_time:'06:00', equipment_id:'EQ-02', work_front_id:'WF-01', activity:'Hauling', actual_hours:5, status:'VALIDATED' },
    { transaction_id:'OPS-22', transaction_date:'2026-10-04', transaction_time:'11:00', equipment_id:'EQ-02', work_front_id:'WF-01', activity:'Hauling', actual_hours:1, status:'VALIDATED' },
    { transaction_id:'OPS-23', transaction_date:'2026-10-04', transaction_time:'13:00', equipment_id:'EQ-02', work_front_id:'WF-01', activity:'Hauling', actual_hours:3, status:'VALIDATED' },
    { transaction_id:'OPS-24', transaction_date:'2026-10-04', transaction_time:'17:00', equipment_id:'EQ-02', work_front_id:'WF-01', activity:'Hauling', actual_hours:1, status:'VALIDATED' }
  ]),
  maintenance:maintenance
});

assert.equal(fleet.status, 'READY');
assert.equal(fleet.population.eligible, 2);
assert(Math.abs(fleet.results.PA.value - (20 / 22 * 100)) < 1e-9);
assert(Math.abs(fleet.results.UA.value - (18 / 20 * 100)) < 1e-9);

const snapshot = f.buildSnapshot({
  calculation:fleet,
  scopeId:'FLEET:ALL',
  periodId:'2026-10-04'
});
assert.equal(snapshot.status, 'FINAL_CANDIDATE');
assert.equal(snapshot.policy.version, '1.0');
assert.equal(snapshot.time_baseline.version, '1.0');
assert(snapshot.event_versions.length >= 1);
assert(snapshot.source_fingerprint);

console.log('V34 STAGE 23 KPI FOUNDATION TEST PASS');
