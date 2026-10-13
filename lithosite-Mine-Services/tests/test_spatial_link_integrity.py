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


def test_stage20_spatial_link_resolution_reports_valid_equipment_workfront_hse():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'LINK-EQ-001',
    marker_type:'ASSET',
    source_entity:'Equipment',
    source_id:'EQ-001',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  api.createDomainSpatialMarker({
    marker_id:'LINK-WF-001',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-001',
    easting:53370.669,
    northing:397470.680,
    elevation:52.571
  });
  api.createDomainSpatialMarker({
    marker_id:'LINK-HSE-001',
    marker_type:'HSE',
    source_entity:'HSE',
    source_id:'HSE-001',
    easting:53380.669,
    northing:397480.680,
    elevation:53.571
  });
  const records = {
    Equipment:[{equipment_id:'EQ-001',unit_no:'DT-001'}],
    WorkFront:[{work_front_id:'WF-001',location:'Pit North'}],
    HSE:[{hse_id:'HSE-001',event_type:'Incident'}]
  };
  return [
    api.resolveDomainSpatialLink('LINK-EQ-001',records),
    api.resolveDomainSpatialLink('LINK-WF-001',records),
    api.resolveDomainSpatialLink('LINK-HSE-001',records)
  ];
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert [item["status"] for item in payload["result"]] == ["VALID", "VALID", "VALID"]
    assert payload["result"][1]["record"]["location"] == "Pit North"


def test_stage20_spatial_link_resolution_distinguishes_broken_and_orphan():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'LINK-BROKEN',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-MISSING',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  api.createMarker({
    marker_id:'LINK-ORPHAN',
    marker_type:'HSE',
    label:'Orphan',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  return [
    api.resolveDomainSpatialLink('LINK-BROKEN',{WorkFront:[]}),
    api.resolveDomainSpatialLink('LINK-ORPHAN',{HSE:[]})
  ];
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert [item["status"] for item in payload["result"]] == ["BROKEN", "ORPHAN"]


def test_stage20_spatial_link_resolution_does_not_delete_or_mutate_broken_marker():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'LINK-BROKEN-IMMUTABLE',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-MISSING',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571,
    label:'Keep Spatial Marker'
  });
  const before = api.getMarker('LINK-BROKEN-IMMUTABLE');
  const result = api.resolveDomainSpatialLink('LINK-BROKEN-IMMUTABLE',{WorkFront:[]});
  const after = api.getMarker('LINK-BROKEN-IMMUTABLE');
  return {result:result,before:before,after:after};
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert payload["result"]["result"]["status"] == "BROKEN"
    assert payload["result"]["before"] == payload["result"]["after"]


def test_stage20_spatial_link_resolution_unverified_when_domain_dataset_is_unavailable():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'LINK-UNVERIFIED',
    marker_type:'ASSET',
    source_entity:'Equipment',
    source_id:'EQ-UNKNOWN',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  return api.resolveDomainSpatialLink('LINK-UNVERIFIED',null);
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert payload["result"]["status"] == "UNVERIFIED"


def test_stage20_spatial_link_issue_scan_returns_only_broken_or_orphan_links():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'SCAN-VALID',
    marker_type:'ASSET',
    source_entity:'Equipment',
    source_id:'EQ-VALID',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  api.createDomainSpatialMarker({
    marker_id:'SCAN-BROKEN',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-MISSING',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  api.createMarker({
    marker_id:'SCAN-ORPHAN',
    marker_type:'HSE',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  return api.listDomainSpatialLinkIssues({
    Equipment:[{equipment_id:'EQ-VALID'}],
    WorkFront:[]
  }).map(item => ({marker_id:item.marker_id,status:item.status}));
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert payload["result"] == [
        {"marker_id":"SCAN-BROKEN","status":"BROKEN"},
        {"marker_id":"SCAN-ORPHAN","status":"ORPHAN"},
    ]
