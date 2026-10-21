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
  'ui/modules/reports/effective-time-contract.js',
  'ui/modules/reports/eu-engine.js',
  'ui/modules/reports/kpi-foundation.js'
].forEach(file => vm.runInContext(
  fs.readFileSync(path.join(ROOT, file), 'utf8'),
  context,
  { filename: file }
));

const f = context.LithositeKPIFoundation;
const b = f.DEFAULT_BASELINE;

const nightScheduledWindows = f.baselineWindows('2026-10-05', f.NIGHT_BASELINE);
assert.equal(f.NIGHT_BASELINE.baseline_id, 'TB-PROJECT-NIGHT-1800-0600');
assert.equal(f.NIGHT_BASELINE.shift_start, '18:00');
assert.equal(f.NIGHT_BASELINE.shift_end, '06:00');
assert.equal(f.DEFAULT_SHIFT_PAIR.pair_id, 'TB-PROJECT-PAIR-0600-0600');
assert.equal(f.DEFAULT_SHIFT_PAIR.day_baseline.baseline_id, f.DEFAULT_BASELINE.baseline_id);
assert.equal(f.DEFAULT_SHIFT_PAIR.night_baseline.baseline_id, f.NIGHT_BASELINE.baseline_id);
assert.equal(f.TIME_BASELINE_PAIRS.length, 1);
assert.equal(f.scheduledHours(nightScheduledWindows), 11);
assert.equal(nightScheduledWindows.length, 2);
assert.equal(nightScheduledWindows[0].start.getHours(), 18);
assert.equal(nightScheduledWindows[0].end.getHours(), 0);
assert.equal(nightScheduledWindows[1].start.getHours(), 1);
assert.equal(nightScheduledWindows[1].end.getHours(), 6);

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
assert(Math.abs(unit.results.UA.value - 100) < 1e-9);
// With the active Effective Time contract loaded, this complete timeline can calculate EU.
assert.equal(unit.results.EU.status, 'READY');

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
    { transaction_id:'OPS-24', transaction_date:'2026-10-04', transaction_time:'16:00', equipment_id:'EQ-02', work_front_id:'WF-01', activity:'Hauling', actual_hours:1, status:'VALIDATED' },
    { transaction_id:'OPS-25', transaction_date:'2026-10-04', transaction_time:'17:00', equipment_id:'EQ-02', work_front_id:'WF-01', activity:'Hauling', actual_hours:1, status:'VALIDATED' }
  ]),
  maintenance:maintenance
});

assert.equal(fleet.status, 'READY');
assert.equal(fleet.population.eligible, 2);
assert(Math.abs(fleet.results.PA.value - (20 / 22 * 100)) < 1e-9);
assert(Math.abs(fleet.results.UA.value - 100) < 1e-9);


const nightOperations = [
  { transaction_id:'NIGHT-19', transaction_date:'2026-10-05', transaction_time:'19:00', equipment_id:'EQ-NIGHT', work_front_id:'WF-NIGHT', activity:'Hauling', actual_hours:3, status:'VALIDATED', shift:'Night' },
  { transaction_id:'NIGHT-22', transaction_date:'2026-10-05', transaction_time:'22:00', equipment_id:'EQ-NIGHT', work_front_id:'WF-NIGHT', activity:'Hauling', actual_hours:2, status:'VALIDATED', shift:'Night' },
  { transaction_id:'NIGHT-01', transaction_date:'2026-10-06', transaction_time:'01:00', equipment_id:'EQ-NIGHT', work_front_id:'WF-NIGHT', activity:'Hauling', actual_hours:1, status:'VALIDATED', shift:'Night' },
  { transaction_id:'NIGHT-04', transaction_date:'2026-10-06', transaction_time:'04:00', equipment_id:'EQ-NIGHT', work_front_id:'WF-NIGHT', activity:'Hauling', actual_hours:2, status:'VALIDATED', shift:'Night' }
];
const nightMaintenance = [
  { maintenance_id:'MNT-NIGHT', equipment_id:'EQ-NIGHT', event_date:'2026-10-06', event_type:'Breakdown', shift:'Night', failure_code:'HYD', start_time:'02:00', end_time:'03:00', status:'Completed', action:'Repairing', downtime_hours:1 }
];
const nightIncomplete = f.calculateEquipment({
  equipmentId:'EQ-NIGHT', date:'2026-10-05', baseline:b,
  operations:nightOperations, maintenance:nightMaintenance
});
assert.equal(nightIncomplete.timeline.shift, 'NIGHT');
assert.equal(nightIncomplete.timeline.scheduledHours, 11);
assert.equal(nightIncomplete.status, 'NEEDS_VALIDATION');
const nightGaps = nightIncomplete.timeline.issues.filter(issue => issue.code === 'TIMELINE_GAP');
assert.equal(nightGaps.length, 2);
assert(nightGaps.every(issue => issue.durationHours === 1));
const nightGapRanges = nightGaps.map(issue => [
  new Date(issue.from).getHours(),
  new Date(issue.to).getHours()
]);
assert.deepEqual(nightGapRanges, [[18, 19], [3, 4]]);
assert(nightIncomplete.timeline.events.some(event => event.source_entity === 'Maintenance' && event.source_id === 'MNT-NIGHT'));

const nightCompleted = f.calculateEquipment({
  equipmentId:'EQ-NIGHT', date:'2026-10-05', shift:'Night', baseline:b,
  operations:nightOperations.concat([
    { transaction_id:'NIGHT-18', transaction_date:'2026-10-05', transaction_time:'18:00', equipment_id:'EQ-NIGHT', work_front_id:'WF-NIGHT', activity:'Hauling', actual_hours:1, status:'VALIDATED', shift:'Night' },
    { transaction_id:'NIGHT-03', transaction_date:'2026-10-06', transaction_time:'03:00', equipment_id:'EQ-NIGHT', work_front_id:'WF-NIGHT', activity:'Standby', actual_hours:1, status:'VALIDATED', shift:'Night' }
  ]),
  maintenance:nightMaintenance
});
assert.equal(nightCompleted.status, 'READY');
assert.equal(nightCompleted.timeline.issues.length, 0);
assert(Math.abs(nightCompleted.results.PA.value - (10 / 11 * 100)) < 1e-9);
assert(Math.abs(nightCompleted.results.UA.value - 90) < 1e-9);

const nightAllDates = f.calculateFleetAllDates({
  baseline:b,
  policy:{euDenominator:'AVAILABLE',effectiveTimeRule:'PURE_EFFECTIVE'},
  equipment:[{equipment_id:'EQ-NIGHT',unit_no:'DT-NIGHT'}],
  operations:nightOperations,
  maintenance:nightMaintenance
});
assert.equal(nightAllDates.dates[0], '2026-10-05');
assert.equal(nightAllDates.equipment[0].status, 'NEEDS_VALIDATION');
assert(nightAllDates.equipment[0].sourceDates.includes('2026-10-05'));
assert(nightAllDates.equipment[0].timeline.events.some(event => event.source_entity === 'Maintenance'));

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
