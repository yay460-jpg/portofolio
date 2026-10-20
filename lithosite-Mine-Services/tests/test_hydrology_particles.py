"""Runtime checks for bounded rain-drop and optional D8 particle animation."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
OVERLAY = ROOT / "shared" / "hydrology" / "hydrology-overlay.js"


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Hydrology animation runtime tests")
def test_hydrology_particle_animation_is_opt_in_bounded_and_cancellable():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const counts = { stroke: 0, fill: 0, arc: 0, clear: 0 };
const context = {
  setTransform() {},
  clearRect() { counts.clear++; },
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() { counts.stroke++; },
  fill() { counts.fill++; },
  arc() { counts.arc++; },
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
const callbacks = new Map();
let nextFrameId = 1;
const window = {
  devicePixelRatio: 1,
  requestAnimationFrame(callback) {
    const id = nextFrameId++;
    callbacks.set(id, callback);
    return id;
  },
  cancelAnimationFrame(id) { callbacks.delete(id); }
};
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
  projectCoordinate(e, n, z) { return { x: 120 + e * 4, y: 300 - n * 4, depth: 0, inside: true }; },
  subscribeRender(listener) { renderListener = listener; return () => { renderListener = null; }; }
};
const engine = window.LithositeHydrologyOverlay.create({ host, topo });
const analysis = {
  grid: { rows: 2, cols: 3, originX: 0, originY: 0, cellSizeX: 10, cellSizeY: 10 },
  elevations: [5,4,3,6,5,4],
  validMask: [1,1,1,1,1,1],
  flowTo: [1,2,-1,-1,-1,-1],
  flowAccumulation: [3,4,4,1,1,1],
  stats: { validCellCount: 6, maxFlowAccumulationCells: 4 }
};
engine.setAnalysis(analysis);
const initial = engine.getStats();
const initialCallbacks = callbacks.size;
const enabled = engine.setAnimationEnabled(true);
const queuedBeforeFrame = callbacks.size;
const first = callbacks.entries().next().value;
callbacks.delete(first[0]);
first[1](1000);
const afterFrame = engine.getStats();
const arcCount = counts.arc;
engine.setAnimationEnabled(false);
const afterStop = engine.getStats();
const queuedAfterStop = callbacks.size;
engine.setAnimationEnabled(true);
engine.setVisible(false);
const hiddenStats = engine.getStats();
const queuedWhileHidden = callbacks.size;
engine.setVisible(true);
const resumedStats = engine.getStats();
engine.clear();
const cleared = engine.getStats();
engine.setAnalysis({
  grid: { rows: 2, cols: 3, originX: 0, originY: 0, cellSizeX: 10, cellSizeY: 10 },
  elevations: [5,4,3,6,5,4], validMask: [1,1,1,1,1,1],
  flowTo: [-1,-1,-1,-1,-1,-1], flowAccumulation: [1,1,1,1,1,1],
  stats: { validCellCount: 6, maxFlowAccumulationCells: 1 }
});
const noPathEnabled = engine.setAnimationEnabled(true);
const noPathStats = engine.getStats();
engine.clear();
engine.destroy();
process.stdout.write(JSON.stringify({
  limits: window.LithositeHydrologyOverlay.limits,
  initial, initialCallbacks, enabled, queuedBeforeFrame, afterFrame, arcCount,
  afterStop, queuedAfterStop, hiddenStats, queuedWhileHidden, resumedStats,
  cleared, noPathEnabled, noPathStats, childrenAfterDestroy: host.children.length,
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
    assert output["limits"] == {"maxSegments": 850, "maxParticles": 30}
    assert output["initial"]["animationEnabled"] is False
    assert output["initial"]["animationRunning"] is False
    assert output["initial"]["rainfallEnabled"] is False
    assert output["initial"]["particleTrackCount"] == 2
    assert output["initialCallbacks"] == 0
    assert output["enabled"] is True
    assert output["queuedBeforeFrame"] == 1
    assert output["arcCount"] > 0
    assert output["afterFrame"]["animationRunning"] is True
    assert output["afterStop"]["animationEnabled"] is False
    assert output["afterStop"]["animationRunning"] is False
    assert output["afterStop"]["rainfallEnabled"] is False
    assert output["queuedAfterStop"] == 0
    assert output["hiddenStats"]["animationEnabled"] is True
    assert output["hiddenStats"]["animationRunning"] is False
    assert output["queuedWhileHidden"] == 0
    assert output["resumedStats"]["animationRunning"] is True
    assert output["cleared"]["particleTrackCount"] == 0
    assert output["cleared"]["animationEnabled"] is False
    assert output["cleared"]["rainfallEnabled"] is False
    assert output["noPathEnabled"] is False
    assert output["noPathStats"]["particleTrackCount"] == 0
    assert output["noPathStats"]["animationRunning"] is False
    assert output["noPathStats"]["rainfallEnabled"] is False
    assert output["childrenAfterDestroy"] == 0
    assert output["subscriberRemoved"] is True
