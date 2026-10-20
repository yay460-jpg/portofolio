"""Regression tests for the UI-independent Lithosite Hydrology Engine."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "shared" / "hydrology" / "hydrology-engine.js"


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Hydrology engine runtime tests")
def test_hydrology_engine_d8_fill_preserve_rainfall_and_tin_rasterization():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_HYDROLOGY_ENGINE, 'utf8'), { window });
const engine = window.LithositeHydrology.create();

const plane = engine.analyzeGrid({
  rows: 3, cols: 3, cellSizeM: 10,
  elevations: [3,2,1, 3,2,1, 3,2,1],
  depressionTreatment: 'PRESERVE'
});

const pit = Array(25).fill(5);
for (let row = 1; row < 4; row++) {
  for (let col = 1; col < 4; col++) pit[row * 5 + col] = 4;
}
pit[12] = 1;
const filled = engine.analyzeGrid({
  rows: 5, cols: 5, cellSizeM: 2,
  elevations: pit, depressionTreatment: 'FILL'
});
const preserved = engine.analyzeGrid({
  rows: 5, cols: 5, cellSizeM: 2,
  elevations: pit, depressionTreatment: 'PRESERVE'
});

const rainfall = engine.analyzeGrid({
  rows: 3, cols: 3, cellSizeM: 10,
  elevations: Array(9).fill(10),
  depressionTreatment: 'PRESERVE',
  rainfall: { intensityMmHr: 50, durationMin: 60, runoffCoefficient: 0.5 }
});

const rawXYZ = new Float64Array([
  0,0,0, 2,0,0, 2,2,2, 0,2,2
]);
const indices = new Uint32Array([0,1,2, 0,2,3]);
const raster = engine.rasterizeTIN({ rawXYZ, indices, cellSizeM: 1 });
let breachCode = '';
try {
  engine.analyzeGrid({
    rows: 3, cols: 3, cellSizeM: 1,
    elevations: Array(9).fill(1), depressionTreatment: 'BREACH'
  });
} catch (error) { breachCode = error.code; }

let resourceCode = '';
try {
  window.LithositeHydrology.create({ maxGridCells: 20 }).analyzeGrid({
    rows: 5, cols: 5, cellSizeM: 1,
    elevations: Array(25).fill(1)
  });
} catch (error) { resourceCode = error.code; }

process.stdout.write(JSON.stringify({
  version: window.LithositeHydrology.version,
  plane: {
    directions: Array.from(plane.flowDirection),
    accumulation: Array.from(plane.flowAccumulation),
    max: plane.stats.maxFlowAccumulationCells
  },
  filled: {
    centerElevation: filled.filledElevations[12],
    sinkCount: filled.stats.sinkCount,
    validCount: filled.stats.validCellCount
  },
  preserved: {
    centerFlowTo: preserved.flowTo[12],
    centerAccumulation: preserved.flowAccumulation[12],
    sinkCount: preserved.stats.sinkCount
  },
  rainfall: rainfall.rainfall,
  raster: {
    rows: raster.rows, cols: raster.cols,
    validCount: raster.validCellCount,
    elevation: Array.from(raster.elevations),
    validMask: Array.from(raster.validMask)
  },
  breachCode, resourceCode
}));
"""
    env = os.environ.copy()
    env["LITHOSITE_HYDROLOGY_ENGINE"] = str(ENGINE)
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

    assert output["version"] == "1.0.0"
    assert output["plane"]["directions"] == [3,3,0, 3,3,0, 3,3,0]
    assert output["plane"]["accumulation"] == [1,2,3, 1,2,3, 1,2,3]
    assert output["plane"]["max"] == 3

    assert output["filled"]["centerElevation"] == 5
    assert output["filled"]["sinkCount"] == 0
    assert output["filled"]["validCount"] == 25
    assert output["preserved"]["centerFlowTo"] == -1
    assert output["preserved"]["centerAccumulation"] == 25
    assert output["preserved"]["sinkCount"] == 1

    rain = output["rainfall"]
    assert rain["totalRainfallMm"] == 50
    assert rain["catchmentAreaM2"] == 900
    assert rain["rainfallVolumeM3"] == pytest.approx(45)
    assert rain["estimatedRunoffVolumeM3"] == pytest.approx(22.5)
    assert rain["catchmentAreaSource"] == "valid_grid_cell_estimate"

    assert output["raster"]["rows"] == 2
    assert output["raster"]["cols"] == 2
    assert output["raster"]["validCount"] == 4
    assert output["raster"]["validMask"] == [1,1,1,1]
    assert output["raster"]["elevation"] == pytest.approx([0.5,0.5,1.5,1.5])
    assert output["breachCode"] == "HYDROLOGY_UNSUPPORTED_MODE"
    assert output["resourceCode"] == "HYDROLOGY_RESOURCE_LIMIT"


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Hydrology engine runtime tests")
def test_hydrology_engine_rejects_invalid_inputs_and_out_of_range_terrain_indices():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_HYDROLOGY_ENGINE, 'utf8'), { window });
const engine = window.LithositeHydrology.create();
function capture(fn) {
  try { fn(); return null; }
  catch (error) { return { code: error.code, message: error.message }; }
}
const wrongLength = capture(() => engine.analyzeGrid({
  rows: 3, cols: 3, cellSizeM: 1, elevations: [1,2,3]
}));
const badRain = capture(() => engine.analyzeGrid({
  rows: 3, cols: 3, cellSizeM: 1, elevations: Array(9).fill(1),
  rainfall: { intensityMmHr: 10, durationMin: 30, runoffCoefficient: 1.2 }
}));
const badIndex = capture(() => engine.rasterizeTIN({
  rawXYZ: [0,0,0, 2,0,0, 0,2,0],
  indices: [0,1,99], cellSizeM: 1
}));
process.stdout.write(JSON.stringify({ wrongLength, badRain, badIndex }));
"""
    env = os.environ.copy()
    env["LITHOSITE_HYDROLOGY_ENGINE"] = str(ENGINE)
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
    assert output["wrongLength"]["code"] == "HYDROLOGY_GRID_INVALID"
    assert output["badRain"]["code"] == "HYDROLOGY_INVALID_INPUT"
    assert output["badIndex"]["code"] == "HYDROLOGY_MESH_INVALID"
