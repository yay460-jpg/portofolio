from pathlib import Path
import json
import os
import shutil
import subprocess

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]
GEO_ENGINE = REPO_ROOT / "lithosite-Mine-Geologist" / "shared" / "geo-engine.js"


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Geo Engine runtime tests")
def test_geo_engine_rejects_non_finite_and_out_of_domain_utm_inputs():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.LITHOSITE_GEO_ENGINE, 'utf8');
const context = {};
vm.runInNewContext(source, context);
const cases = [
  ['nan-easting', NaN, 53311.5, 52, 'N'],
  ['infinite-northing', 397088.5, Infinity, 52, 'N'],
  ['invalid-zone', 397088.5, 53311.5, 61, 'N'],
  ['fractional-zone', 397088.5, 53311.5, 52.5, 'N'],
  ['invalid-hemisphere', 397088.5, 53311.5, 52, 'Q'],
  ['out-of-range-easting', -1, 53311.5, 52, 'N']
];
const rejected = cases.map(([name, e, n, zone, hemisphere]) => {
  const result = context.computeConvergenceForPoint_(e, n, zone, hemisphere);
  return { name, ok: result.ok, finite: Number.isFinite(result.convergenceDeg) };
});
const valid = context.computeConvergenceForPoint_(397088.5, 53311.5, 52, 'N');
process.stdout.write(JSON.stringify({ rejected, valid: {
  ok: valid.ok,
  finite: Number.isFinite(valid.convergenceDeg) && Number.isFinite(valid.lat) && Number.isFinite(valid.lon)
}}));
"""
    env = os.environ.copy()
    env["LITHOSITE_GEO_ENGINE"] = str(GEO_ENGINE)
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert all(not item["ok"] for item in output["rejected"]), output
    assert output["valid"] == {"ok": True, "finite": True}


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Geo Engine runtime tests")
def test_bearing_distance_rejects_non_finite_and_overflowing_coordinates():
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.LITHOSITE_GEO_ENGINE, 'utf8');
const context = {};
vm.runInNewContext(source, context);
const invalid = [
  ['nan-origin', NaN, 0, 1, 1],
  ['infinite-target', 0, 0, Infinity, 1],
  ['overflow-distance', -Number.MAX_VALUE, 0, Number.MAX_VALUE, 1]
];
const rejected = invalid.map(([name, e1, n1, e2, n2]) => {
  const result = context.bearingDistanceGrid_(e1, n1, e2, n2);
  return {
    name,
    ok: result.ok,
    finiteBearing: Number.isFinite(result.bearingGridDeg),
    finiteDistance: Number.isFinite(result.distanceMeters)
  };
});
const valid = [
  context.bearingDistanceGrid_(0, 0, 0, 10),
  context.bearingDistanceGrid_(0, 0, 10, 0),
  context.bearingDistanceGrid_(5, 5, 5, 5)
];
process.stdout.write(JSON.stringify({
  rejected,
  valid: valid.map(result => ({
    bearingGridDeg: result.bearingGridDeg,
    distanceMeters: result.distanceMeters,
    ok: result.ok
  }))
}));
"""
    env = os.environ.copy()
    env["LITHOSITE_GEO_ENGINE"] = str(GEO_ENGINE)
    result = subprocess.run(
        ["node", "-e", script],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    output = json.loads(result.stdout)
    assert all(
        item["ok"] is False
        and item["finiteBearing"]
        and item["finiteDistance"]
        for item in output["rejected"]
    ), output
    assert output["valid"] == [
        {"bearingGridDeg": 0, "distanceMeters": 10, "ok": True},
        {"bearingGridDeg": 90, "distanceMeters": 10, "ok": True},
        {"bearingGridDeg": 0, "distanceMeters": 0, "ok": True},
    ]
