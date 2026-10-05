const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ENGINE = path.join(ROOT, 'ui', 'modules', 'reports', 'kpi-engine.js');
const FOUNDATION = path.join(ROOT, 'ui', 'modules', 'reports', 'kpi-foundation.js');

const context = { console };
context.window = context;
vm.createContext(context);
const AVAILABILITY_CONTRACT = path.join(ROOT, 'ui', 'modules', 'reports', 'availability-time-contract.js');
const PA_ENGINE = path.join(ROOT, 'ui', 'modules', 'reports', 'pa-engine.js');
const UA_ENGINE = path.join(ROOT, 'ui', 'modules', 'reports', 'ua-engine.js');
const EFFECTIVE_CONTRACT = path.join(ROOT, 'ui', 'modules', 'reports', 'effective-time-contract.js');
const EU_ENGINE = path.join(ROOT, 'ui', 'modules', 'reports', 'eu-engine.js');

vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), context, { filename: ENGINE });
vm.runInContext(fs.readFileSync(AVAILABILITY_CONTRACT, 'utf8'), context, { filename: AVAILABILITY_CONTRACT });
vm.runInContext(fs.readFileSync(PA_ENGINE, 'utf8'), context, { filename: PA_ENGINE });
vm.runInContext(fs.readFileSync(UA_ENGINE, 'utf8'), context, { filename: UA_ENGINE });
vm.runInContext(fs.readFileSync(EFFECTIVE_CONTRACT, 'utf8'), context, { filename: EFFECTIVE_CONTRACT });
vm.runInContext(fs.readFileSync(EU_ENGINE, 'utf8'), context, { filename: EU_ENGINE });
vm.runInContext(fs.readFileSync(FOUNDATION, 'utf8'), context, { filename: FOUNDATION });

const f = context.LithositeKPIFoundation;
if (!f) throw new Error('LithositeKPIFoundation did not load');

const date = '2026-10-01';
const equipment = [{ equipment_id: 'EQ-KPI-TEST-001', unit_no: 'EXCA-TEST-001' }];

const operations = [
  { transaction_id:'OPS-01', transaction_date:date, transaction_time:'06:00', actual_hours:4, activity:'Digging', work_front_id:'WF-01', equipment_id:'EQ-KPI-TEST-001', status:'VALIDATED', version:1 },
  { transaction_id:'OPS-02', transaction_date:date, transaction_time:'10:00', actual_hours:1, activity:'Normal spotting', work_front_id:'WF-01', equipment_id:'EQ-KPI-TEST-001', status:'VALIDATED', version:1 },
  { transaction_id:'OPS-03', transaction_date:date, transaction_time:'11:00', actual_hours:1, activity:'Loading', work_front_id:'WF-01', equipment_id:'EQ-KPI-TEST-001', status:'VALIDATED', version:1 },
  { transaction_id:'OPS-04', transaction_date:date, transaction_time:'13:00', actual_hours:2, activity:'Hauling loaded', work_front_id:'WF-01', equipment_id:'EQ-KPI-TEST-001', status:'VALIDATED', version:1 },
  { transaction_id:'OPS-05', transaction_date:date, transaction_time:'15:00', actual_hours:2, activity:'Normal spotting', work_front_id:'WF-01', equipment_id:'EQ-KPI-TEST-001', status:'VALIDATED', version:1 }
];

const maintenance = [
  { maintenance_id:'MNT-01', event_date:date, start_time:'17:00', end_time:'18:00', event_type:'breakdown', failure_code:'TEST', equipment_id:'EQ-KPI-TEST-001', status:'VALIDATED', version:1 }
];

function run(policy) {
  return f.calculateFleet({ date, baseline: policy.baseline, policy, equipment, operations, maintenance });
}

function closeTo(actual, expected, label) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-9) {
    throw new Error(label + ': expected ' + expected + ', got ' + actual);
  }
}

const b06 = f.TIME_BASELINES.find(x => x.baseline_id === 'TB-PROJECT-DAY-0600-1800');
const b07 = f.TIME_BASELINES.find(x => x.baseline_id === 'TB-PROJECT-DAY-0700-1800');
if (!b06 || !b07) throw new Error('Expected both 06:00–18:00 and 07:00–18:00 baselines');

const pureAvail06 = run({ baseline:b06, euDenominator:'AVAILABLE', effectiveTimeRule:'PURE_EFFECTIVE' });
const standardAvail06 = run({ baseline:b06, euDenominator:'AVAILABLE', effectiveTimeRule:'STANDARD_CYCLE' });
const pureSched06 = run({ baseline:b06, euDenominator:'SCHEDULED', effectiveTimeRule:'PURE_EFFECTIVE' });
const standardSched06 = run({ baseline:b06, euDenominator:'SCHEDULED', effectiveTimeRule:'STANDARD_CYCLE' });
const standardAvail07 = run({ baseline:b07, euDenominator:'AVAILABLE', effectiveTimeRule:'STANDARD_CYCLE' });

for (const [label, result] of [
  ['06/PURE/AVAILABLE', pureAvail06],
  ['06/STANDARD/AVAILABLE', standardAvail06],
  ['06/PURE/SCHEDULED', pureSched06],
  ['06/STANDARD/SCHEDULED', standardSched06],
  ['07/STANDARD/AVAILABLE', standardAvail07]
]) {
  if (result.status !== 'READY') throw new Error(label + ': expected READY, got ' + result.status + ' issues=' + JSON.stringify((result.equipment&&result.equipment[0]&&result.equipment[0].timeline&&result.equipment[0].timeline.issues)||[]));
  if (result.population.excluded !== 0) throw new Error(label + ': expected zero exclusions');
}

const r06 = pureAvail06.results;
closeTo(r06.PA.value, (10 / 11) * 100, '06/PURE/AVAILABLE PA');
closeTo(r06.UA.value, 100, '06/PURE/AVAILABLE UA');
closeTo(r06.EU.value, 70, '06/PURE/AVAILABLE EU');
if (r06.EU.denominatorType !== 'AVAILABLE') throw new Error('06/PURE/AVAILABLE denominatorType mismatch');
if (r06.EU.effectiveTimeRule !== 'PURE_EFFECTIVE') throw new Error('06/PURE/AVAILABLE effective rule mismatch');
if (pureAvail06.baseline.baseline_id !== 'TB-PROJECT-DAY-0600-1800') throw new Error('06 baseline mismatch');

closeTo(standardAvail06.results.EU.value, 100, '06/STANDARD/AVAILABLE EU');
if (standardAvail06.results.EU.effectiveTimeRule !== 'STANDARD_CYCLE') throw new Error('Standard Cycle rule mismatch');

closeTo(pureSched06.results.EU.value, (7 / 11) * 100, '06/PURE/SCHEDULED EU');
if (pureSched06.results.EU.denominatorType !== 'SCHEDULED') throw new Error('Scheduled denominator mismatch');

closeTo(standardSched06.results.EU.value, (10 / 11) * 100, '06/STANDARD/SCHEDULED EU');

closeTo(standardAvail07.results.PA.value, (9 / 10) * 100, '07/STANDARD/AVAILABLE PA');
closeTo(standardAvail07.results.EU.value, 100, '07/STANDARD/AVAILABLE EU');
if (standardAvail07.baseline.baseline_id !== 'TB-PROJECT-DAY-0700-1800') throw new Error('07 baseline mismatch');

console.log('RUNTIME_KPI_POLICY_TEST_PASS');
console.log('06 PURE/AVAILABLE EU=' + r06.EU.value.toFixed(2) + '%');
console.log('06 STANDARD/AVAILABLE EU=' + standardAvail06.results.EU.value.toFixed(2) + '%');
console.log('06 PURE/SCHEDULED EU=' + pureSched06.results.EU.value.toFixed(2) + '%');
console.log('06 STANDARD/SCHEDULED EU=' + standardSched06.results.EU.value.toFixed(2) + '%');
console.log('07 STANDARD/AVAILABLE EU=' + standardAvail07.results.EU.value.toFixed(2) + '%');
