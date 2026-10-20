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


def test_stage20_runtime_sync_boundary_allows_read_only_spatial_plan():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'BOUNDARY-EQ',
    marker_type:'ASSET',
    source_entity:'Equipment',
    source_id:'EQ-BOUNDARY',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  return api.getMarker('BOUNDARY-EQ');
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    marker = payload["result"]
    assert marker["source_entity"] == "Equipment"
    assert marker["source_id"] == "EQ-BOUNDARY"
    assert marker["easting"] == 53364.669
    assert marker["northing"] == 397465.680
    assert marker["elevation"] == 51.571


def test_stage20_runtime_sync_boundary_exposes_no_domain_write_operation():
    js = MARKER_JS.read_text(encoding="utf-8")
    start = js.index("function buildDomainSpatialSyncPlan")
    end = js.index("function listDomainSpatialLinkIssues", start)
    block = js[start:end]

    assert "NO_SPATIAL_MUTATION" in block
    assert "DomainRecord" in block
    assert "MapMarker" in block
    assert ".update(" not in block
    assert ".create(" not in block
    assert ".delete(" not in block
    assert "runtime" not in block.lower()


def test_stage20_runtime_sync_boundary_does_not_expose_domain_coordinates():
    js = MARKER_JS.read_text(encoding="utf-8")
    start = js.index("function buildDomainSpatialSyncPlan")
    end = js.index("function listDomainSpatialLinkIssues", start)
    block = js[start:end]

    assert "input.easting" not in block
    assert "input.northing" not in block
    assert "input.elevation" not in block
    assert "record.easting" not in block
    assert "record.northing" not in block
    assert "record.elevation" not in block


def test_stage20_runtime_sync_boundary_preserves_integrity_statuses():
    expression = """
(() => {
  api.createDomainSpatialMarker({
    marker_id:'BOUNDARY-BROKEN',
    marker_type:'WORKFRONT',
    source_entity:'WorkFront',
    source_id:'WF-NOT-FOUND',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  api.createMarker({
    marker_id:'BOUNDARY-ORPHAN',
    marker_type:'HSE',
    easting:53364.669,
    northing:397465.680,
    elevation:51.571
  });
  return [
    api.buildDomainSpatialSyncPlan('BOUNDARY-BROKEN',{WorkFront:[]}),
    api.buildDomainSpatialSyncPlan('BOUNDARY-ORPHAN',{HSE:[]})
  ];
})()
"""
    code, payload = run_marker_runtime(expression)
    assert code == 0
    assert payload["ok"] is True
    assert [item["status"] for item in payload["result"]] == ["BROKEN", "ORPHAN"]


def test_stage20_runtime_sync_boundary_is_exported_as_central_api():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "buildDomainSpatialSyncPlan:buildDomainSpatialSyncPlan" in js
