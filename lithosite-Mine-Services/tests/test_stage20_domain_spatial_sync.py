import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).parents[1]
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"


def run_marker_runtime(expression):
    node = shutil.which("node")
    if not node:
        raise AssertionError("Node.js is required for Stage 20 marker runtime validation")

    script = f"""
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync({json.dumps(str(MARKER_JS))}, 'utf8');
const context = {{ window: {{}} }};
vm.runInNewContext(source, context, {{ filename: 'marker-location.js' }});
const api = context.window.MineServicesMarkerLocation;
try {{
  const result = ({expression});
  process.stdout.write(JSON.stringify({{ok:true,result:result}}));
}} catch (error) {{
  process.stdout.write(JSON.stringify({{ok:false,error:String(error.message || error)}}));
  process.exitCode = 2;
}}
"""
    completed = subprocess.run(
        [node, "-e", script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    payload = json.loads(completed.stdout)
    return completed.returncode, payload


def test_stage20_domain_spatial_sync_plan_preserves_domain_and_spatial_authority():
    expression = """
(() => {
  const marker = api.createDomainSpatialMarker({
    marker_id:'SYNC-EQ-001',
    marker_type:'ASSET',
    source_entity:'Equipment',
    source_id:'EQ-001',
    label:'Truck marker',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  const domain = {
    Equipment:[{
      equipment_id:'EQ-001',
      unit_no:'DT-001',
      status:'Active',
      label:'Truck domain record'
    }]
  };
  return api.buildDomainSpatialSyncPlan('SYNC-EQ-001',domain);
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    result = payload["result"]
    assert result["status"] == "VALID"
    assert result["coordinate_authority"] == "MapMarker"
    assert result["domain_authority"] == "DomainRecord"
    assert result["action"] == "NO_SPATIAL_MUTATION"
    assert result["marker"]["easting"] == 53364.669
    assert result["marker"]["northing"] == 397465.680
    assert result["marker"]["elevation"] == 51.571
    assert result["record"]["unit_no"] == "DT-001"


def test_stage20_domain_spatial_sync_plan_does_not_copy_domain_location_into_coordinates():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'SYNC-WF-001',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-001',
    easting:53370.669,
    northing:397470.680,
    elevation:52.571
  });
  return api.buildDomainSpatialSyncPlan('SYNC-WF-001',{
    WorkFront:[{
      work_front_id:'WF-001',
      location:'Pit South'
    }]
  });
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    result = payload["result"]
    assert result["status"] == "VALID"
    assert result["action"] == "NO_SPATIAL_MUTATION"
    assert result["marker"]["easting"] == 53370.669
    assert result["marker"]["northing"] == 397470.680
    assert result["marker"]["elevation"] == 52.571
    assert "easting" not in result["record"]
    assert "northing" not in result["record"]


def test_stage20_domain_spatial_sync_plan_is_read_only():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'SYNC-HSE-001',
    marker_type:'HSE',
    source_entity:'HSE',
    source_id:'HSE-001',
    label:'HSE marker',
    easting:53380.669,
    northing:397480.680,
    elevation:53.571
  });
  const domain = {
    HSE:[{
      hse_id:'HSE-001',
      event_type:'Incident',
      status:'Open'
    }]
  };
  const before = JSON.stringify({
    marker:api.getMarker('SYNC-HSE-001'),
    domain:domain
  });
  const plan = api.buildDomainSpatialSyncPlan('SYNC-HSE-001',domain);
  const after = JSON.stringify({
    marker:api.getMarker('SYNC-HSE-001'),
    domain:domain
  });
  return {plan:plan,before:before,after:after};
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert payload["result"]["before"] == payload["result"]["after"]


def test_stage20_domain_spatial_sync_plan_propagates_link_integrity_status():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'SYNC-BROKEN',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-MISSING',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  api.createMarker({
    marker_id:'SYNC-ORPHAN',
    marker_type:'HSE',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  return [
    api.buildDomainSpatialSyncPlan('SYNC-BROKEN',{WorkFront:[]}),
    api.buildDomainSpatialSyncPlan('SYNC-ORPHAN',{HSE:[]})
  ];
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert [item["status"] for item in payload["result"]] == ["BROKEN", "ORPHAN"]
    assert all(item["action"] == "NO_SPATIAL_MUTATION" for item in payload["result"])


def test_stage20_domain_spatial_sync_plan_missing_marker_is_explicit():
    expression = "api.buildDomainSpatialSyncPlan('SYNC-MISSING',{Equipment:[]})"
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert payload["result"]["status"] == "MISSING_MARKER"
    assert payload["result"]["action"] == "NO_SPATIAL_MUTATION"
