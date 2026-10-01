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


def test_stage20_domain_spatial_adapter_runtime_maps_equipment_workfront_and_hse():
    expression = """
[
  api.createDomainSpatialMarker({
    marker_id:'RT-EQ-001',
    marker_type:'ASSET',
    label:'Runtime Equipment',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571,
    source_entity:'Equipment',
    source_id:'EQ-001'
  }),
  api.createDomainSpatialMarker({
    marker_id:'RT-WF-001',
    marker_type:'WORKFRONT',
    label:'Runtime WorkFront',
    easting:53370.669,
    northing:397470.680,
    elevation:52.571,
    source_entity:'WorkFront',
    source_id:'WF-001'
  }),
  api.createDomainSpatialMarker({
    marker_id:'RT-HSE-001',
    marker_type:'HSE',
    label:'Runtime HSE',
    easting:53380.669,
    northing:397480.680,
    elevation:53.571,
    source_entity:'HSE',
    source_id:'HSE-001'
  })
]
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    result = payload["result"]
    assert [(item["marker_type"], item["source_entity"], item["source_id"]) for item in result] == [
        ("ASSET", "Equipment", "EQ-001"),
        ("WORKFRONT", "WorkFront", "WF-001"),
        ("HSE", "HSE", "HSE-001"),
    ]


def test_stage20_domain_spatial_adapter_runtime_rejects_location_as_coordinate_source():
    expression = """
api.createDomainSpatialMarker({
  marker_id:'RT-WF-LOCATION',
  marker_type:'WORKFRONT',
  source_entity:'WorkFront',
  source_id:'WF-LOCATION',
  location:'Pit South'
})
"""
    code, payload = run_marker_runtime(expression)
    assert code != 0
    assert payload["ok"] is False
    assert "explicit finite easting, northing, and elevation" in payload["error"]


def test_stage20_domain_spatial_adapter_runtime_does_not_mutate_domain_input():
    expression = """
(() => {
  const domainRecord = {
    work_front_id:'WF-IMMUTABLE',
    domain:'Road & Hauling',
    location:'Pit North',
    responsible:'Operations Team',
    status:'Active'
  };
  const before = JSON.stringify(domainRecord);
  const marker = api.createDomainSpatialMarker({
    marker_id:'RT-WF-IMMUTABLE',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:domainRecord.work_front_id,
    easting:53364.669,
    northing:397465.680,
    elevation:51.571,
    label:domainRecord.location
  });
  return {before:before,after:JSON.stringify(domainRecord),marker:marker};
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert payload["result"]["before"] == payload["result"]["after"]
    assert payload["result"]["marker"]["source_id"] == "WF-IMMUTABLE"


def test_stage20_domain_spatial_adapter_runtime_rejects_mismatched_domain_entity():
    expression = """
api.createDomainSpatialMarker({
  marker_id:'RT-WF-MISMATCH',
  marker_type:'WORKFRONT',
  source_entity:'Equipment',
  source_id:'EQ-001',
  easting:53364.669,
  northing:397465.680,
  elevation:51.571
})
"""
    code, payload = run_marker_runtime(expression)
    assert code != 0
    assert payload["ok"] is False
    assert "does not match marker_type" in payload["error"]
