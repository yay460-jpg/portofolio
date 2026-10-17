"""Runtime checks for the bounded D8 terrain-flow overlay."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
OVERLAY = ROOT / "shared" / "hydrology" / "hydrology-overlay.js"


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Hydrology overlay runtime tests")
def test_hydrology_overlay_draws_direction_segments_and_supports_visibility_and_cleanup():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const counts = { stroke: 0, fill: 0, clear: 0 };
const context = {
  setTransform() {},
  clearRect() { counts.clear++; },
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() { counts.stroke++; },
  fill() { counts.fill++; },
  closePath() {}
};
const document = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error('unexpected element ' + tag);
    return {
      id: '', className: '', hidden: false, style: {}, width: 0, height: 0,
      parentNode: null, attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      getContext(kind) { return kind === '2d' ? context : null; }
    };
  }
};
const window = { devicePixelRatio: 1 };
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_HYDROLOGY_OVERLAY, 'utf8'), { window, document });
const host = {
  clientWidth: 640, clientHeight: 480, children: [],
  getBoundingClientRect() { return { width: 640, height: 480 }; },
  appendChild(node) { node.parentNode = this; this.children.push(node); return node; },
  removeChild(node) {
    const i = this.children.indexOf(node);
    if (i >= 0) this.children.splice(i, 1);
    node.parentNode = null;
    return node;
  }
};
let renderListener = null;
const topo = {
  projectCoordinate(e, n, z) {
    return { x: 120 + e * 4, y: 300 - n * 4, depth: 0, inside: true };
  },
  subscribeRender(listener) {
    renderListener = listener;
    return () => { renderListener = null; };
  }
};
const engine = window.LithositeHydrologyOverlay.create({ host, topo });
const analysis = {
  grid: { rows: 2, cols: 3, originX: 0, originY: 0, cellSizeX: 10, cellSizeY: 10 },
  elevations: [5,4,3, 6,5,4],
  validMask: [1,1,1,1,1,1],
  flowTo: [1,2,-1,-1,-1,-1],
  flowAccumulation: [3,4,4,1,1,1],
  stats: { validCellCount: 6, maxFlowAccumulationCells: 4 }
};
const built = engine.setAnalysis(analysis);
const afterDraw = { ...counts };
const canvas = host.children[0];
engine.setVisible(false);
const hidden = canvas.hidden;
if (renderListener) renderListener({ view: '3d', angleX: 0, angleY: 1, zoom: 1, panX: 0, panY: 0 });
const strokesWhileHidden = counts.stroke;
engine.setVisible(true);
const strokesAfterShow = counts.stroke;
engine.clear();
const cleared = engine.getStats();
engine.destroy();
process.stdout.write(JSON.stringify({
  built, afterDraw, hidden, strokesWhileHidden, strokesAfterShow,
  cleared, childrenAfterDestroy: host.children.length,
  subscriberRemoved: renderListener === null
}));
"""
    env = os.environ.copy()
    env["LITHOSITE_HYDROLOGY_OVERLAY"] = str(OVERLAY)
    result = subprocess.run(
        ["node", "-e", script],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
        timeout=45,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert output["built"] == {"segmentCount": 2, "threshold": 2, "maxAccumulationCells": 4}
    assert output["afterDraw"]["stroke"] == 2
    assert output["afterDraw"]["fill"] >= 1
    assert output["hidden"] is True
    assert output["strokesWhileHidden"] == output["afterDraw"]["stroke"]
    assert output["strokesAfterShow"] > output["strokesWhileHidden"]
    assert output["cleared"]["segmentCount"] == 0
    assert output["cleared"]["drawnSegmentCount"] == 0
    assert output["childrenAfterDestroy"] == 0
    assert output["subscriberRemoved"] is True
