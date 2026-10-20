const fs = require('fs');
const path = require('path');
const vm = require('vm');

if (process.argv.length < 3) throw new Error('DATA_JSON_PATH_REQUIRED');

const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ROOT = path.resolve(__dirname, '..');
const enginePath = path.join(ROOT, 'ui', 'modules', 'reports', 'kpi-engine.js');
const foundationPath = path.join(ROOT, 'ui', 'modules', 'reports', 'kpi-foundation.js');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });
vm.runInContext(fs.readFileSync(foundationPath, 'utf8'), context, { filename: foundationPath });

const foundation = context.LithositeKPIFoundation;
if (!foundation) throw new Error('KPI_FOUNDATION_LOAD_FAILED');

const equipment = Array.isArray(data.Equipment) ? data.Equipment : [];
const operations = Array.isArray(data.Operations) ? data.Operations : [];
const maintenance = Array.isArray(data.Maintenance) ? data.Maintenance : [];

const dates = operations.map(row => String(row.transaction_date || '').slice(0,10)).filter(Boolean).sort();
const date = dates.length ? dates[dates.length - 1] : null;

const policy = {
  baseline: foundation.DEFAULT_BASELINE,
  euDenominator: 'AVAILABLE',
  effectiveTimeRule: 'PURE_EFFECTIVE'
};

const calculation = foundation.calculateFleet({
  date,
  baseline: policy.baseline,
  policy,
  equipment,
  operations,
  maintenance
});

const out = {
  date,
  policy: {
    baseline: calculation.baseline,
    euDenominator: policy.euDenominator,
    effectiveTimeRule: policy.effectiveTimeRule
  },
  fleetPA: calculation.results && calculation.results.PA ? calculation.results.PA : null,
  fleetUA: calculation.results && calculation.results.UA ? calculation.results.UA : null,
  fleetEU: calculation.results && calculation.results.EU ? calculation.results.EU : null,
  calculationState: calculation.status,
  eligible: calculation.population ? calculation.population.eligible : 0,
  excluded: calculation.population ? calculation.population.excluded : 0,
  equipmentCount: equipment.length,
  operationsCount: operations.length,
  maintenanceCount: maintenance.length,
  exclusions: calculation.exclusions || []
};

console.log(JSON.stringify(out));
