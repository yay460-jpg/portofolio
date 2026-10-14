from pathlib import Path
import json
import os
import shutil
import subprocess

import pytest


REPO_ROOT = Path(__file__).parents[2]
TOPO3D_PATHS = (
    REPO_ROOT / "lithosite-Mine-Geologist" / "shared" / "topo3d" / "topo3d-engine.js",
    REPO_ROOT / "lithosite-Mine-Services" / "shared" / "topo3d" / "topo3d-engine.js",
)


def _load_ltdtm_method(path):
    source = path.read_text(encoding="utf-8")
    start = source.index("Topo3DEngine.prototype.loadLTDtm=async function(file)")
    end = source.index("Topo3DEngine.prototype.loadFiles=async function", start)
    return source[start:end]


def test_ltdtm_size_preflight_runs_before_webgl_prepare_and_buffer_read():
    for path in TOPO3D_PATHS:
        method = _load_ltdtm_method(path)
        guard = "guardTopoFileSize_(file,TOPO3D_RESOURCE_LIMITS.maxPackageBytes,'Package Topografi')"
        assert guard in method, f"Missing preflight size guard in {path}"
        assert method.index(guard) < method.index("await this.prepare()"), path
        assert method.index(guard) < method.index("await file.arrayBuffer()"), path
        # Keep the post-read byte-length check as defense in depth.
        assert "bytes.byteLength>TOPO3D_RESOURCE_LIMITS.maxPackageBytes" in method, path


def test_ltdtm_resource_limit_is_declared_in_both_engine_copies():
    for path in TOPO3D_PATHS:
        source = path.read_text(encoding="utf-8")
        assert "maxPackageBytes:128*1024*1024" in source, path
        assert "maxDtmBytes:64*1024*1024" in source, path
        assert "maxStrBytes:64*1024*1024" in source, path


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Topo3D runtime tests")
@pytest.mark.parametrize("engine_path", TOPO3D_PATHS)
def test_ltdtm_v1_rejects_triangle_indices_outside_vertex_buffer_and_accepts_valid_mesh(engine_path):
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_TOPO3D_ENGINE, 'utf8'), { window, TextDecoder });
const encoder = new TextEncoder();
function makeFile(indices) {
  const meta = encoder.encode(JSON.stringify({
    version: 1,
    name: 'geometry-fixture',
    triangles: 1,
    bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 0 }
  }));
  const xyz = new Float64Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const idx = new Uint32Array(indices);
  const bytes = new Uint8Array(24 + meta.byteLength + xyz.byteLength + idx.byteLength);
  bytes.set(encoder.encode('LITHODTM'), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 1, true);
  view.setUint32(12, 3, true);
  view.setUint32(16, idx.length, true);
  view.setUint32(20, meta.byteLength, true);
  let offset = 24;
  bytes.set(meta, offset); offset += meta.byteLength;
  bytes.set(new Uint8Array(xyz.buffer), offset); offset += xyz.byteLength;
  bytes.set(new Uint8Array(idx.buffer), offset);
  return { name: 'fixture.ltdtm', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer };
}
async function load(indices) {
  const engine = window.LithositeTopo3D.create({});
  engine.prepare = async () => engine;
  let buildCalled = false;
  engine._buildGPU = () => { buildCalled = true; };
  let rejected = false, errorMessage = '';
  try { await engine.loadLTDtm(makeFile(indices)); }
  catch (error) { rejected = true; errorMessage = error.message; }
  return { rejected, buildCalled, errorMessage };
}
(async () => {
  const invalid = await load([0, 1, 99]);
  const valid = await load([0, 1, 2]);
  process.stdout.write(JSON.stringify({ invalid, valid }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_TOPO3D_ENGINE"] = str(engine_path)
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
    assert output["invalid"] == {
        "rejected": True,
        "buildCalled": False,
        "errorMessage": "Referensi vertex triangle tidak valid",
    }, output
    assert output["valid"] == {
        "rejected": False,
        "buildCalled": True,
        "errorMessage": "",
    }, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Topo3D runtime tests")
@pytest.mark.parametrize("engine_path", TOPO3D_PATHS)
def test_ltdtm_v2_rejects_truncated_payload_and_accepts_valid_package(engine_path):
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
class MockFile {
  constructor(parts, name) { this.bytes = parts[0]; this.name = name; this.size = this.bytes.byteLength; }
  async text() { return new TextDecoder().decode(this.bytes); }
}
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_TOPO3D_ENGINE, 'utf8'), { window, TextDecoder, File: MockFile });
const encoder = new TextEncoder();
const dtm = encoder.encode('DTM');
const str = encoder.encode('STR');
const manifest = encoder.encode(JSON.stringify({ dtmSha256: 'digest', strSha256: 'digest', dtmName: 'fixture.dtm', strName: 'fixture.str' }));
function makePackage(declaredStrLength, includeStr) {
  const total = 24 + manifest.byteLength + dtm.byteLength + (includeStr ? str.byteLength : 0);
  const bytes = new Uint8Array(total);
  bytes.set(encoder.encode('LITHODTM'), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 2, true);
  view.setUint32(12, manifest.byteLength, true);
  view.setUint32(16, dtm.byteLength, true);
  view.setUint32(20, declaredStrLength, true);
  let offset = 24;
  bytes.set(manifest, offset); offset += manifest.byteLength;
  bytes.set(dtm, offset); offset += dtm.byteLength;
  if (includeStr) bytes.set(str, offset);
  return { name: 'fixture.ltdtm', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer };
}
async function load(file) {
  const engine = window.LithositeTopo3D.create({});
  engine.prepare = async () => engine;
  engine._sha256Hex = async () => 'digest';
  let called = false;
  engine.loadDTMSTR = async (dtmFile, strFile) => {
    called = true;
    return { dtm: await dtmFile.text(), str: await strFile.text() };
  };
  let rejected = false, errorMessage = '', value = null;
  try { value = await engine.loadLTDtm(file); }
  catch (error) { rejected = true; errorMessage = error.message; }
  return { rejected, called, errorMessage, value };
}
(async () => {
  const truncated = await load(makePackage(10, false));
  const valid = await load(makePackage(str.byteLength, true));
  process.stdout.write(JSON.stringify({ truncated, valid }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_TOPO3D_ENGINE"] = str(engine_path)
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
    assert output["truncated"] == {
        "rejected": True,
        "called": False,
        "errorMessage": "Struktur/ukuran package Topografi tidak valid",
        "value": None,
    }, output
    assert output["valid"] == {
        "rejected": False,
        "called": True,
        "errorMessage": "",
        "value": {"dtm": "DTM", "str": "STR"},
    }, output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Topo3D runtime tests")
@pytest.mark.parametrize("engine_path", TOPO3D_PATHS)
def test_ltdtm_v2_rejects_non_object_manifest_and_accepts_object(engine_path):
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
class MockFile {
  constructor(parts, name) { this.bytes = parts[0]; this.name = name; this.size = this.bytes.byteLength; }
  async text() { return new TextDecoder().decode(this.bytes); }
}
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_TOPO3D_ENGINE, 'utf8'), { window, TextDecoder, File: MockFile });
const encoder = new TextEncoder();
const dtm = encoder.encode('DTM');
const str = encoder.encode('STR');
function makePackage(manifestValue) {
  const manifest = encoder.encode(JSON.stringify(manifestValue));
  const bytes = new Uint8Array(24 + manifest.byteLength + dtm.byteLength + str.byteLength);
  bytes.set(encoder.encode('LITHODTM'), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 2, true);
  view.setUint32(12, manifest.byteLength, true);
  view.setUint32(16, dtm.byteLength, true);
  view.setUint32(20, str.byteLength, true);
  let offset = 24;
  bytes.set(manifest, offset); offset += manifest.byteLength;
  bytes.set(dtm, offset); offset += dtm.byteLength;
  bytes.set(str, offset);
  return { name: 'fixture.ltdtm', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer };
}
async function load(value) {
  const engine = window.LithositeTopo3D.create({});
  engine.prepare = async () => engine;
  engine._sha256Hex = async () => 'digest';
  let called = false, rejected = false, errorMessage = '';
  engine.loadDTMSTR = async () => { called = true; return { loaded: true }; };
  try { await engine.loadLTDtm(makePackage(value)); }
  catch (error) { rejected = true; errorMessage = error.message; }
  return { rejected, called, errorMessage };
}
(async () => {
  const invalid = await Promise.all([[], 'manifest', 42, null].map(load));
  const valid = await load({ dtmSha256: 'digest', strSha256: 'digest', dtmName: 'fixture.dtm', strName: 'fixture.str' });
  process.stdout.write(JSON.stringify({ invalid, valid }));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_TOPO3D_ENGINE"] = str(engine_path)
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
    assert all(item["rejected"] and not item["called"] for item in output["invalid"]), output
    assert output["valid"] == {"rejected": False, "called": True, "errorMessage": ""}


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Topo3D runtime tests")
@pytest.mark.parametrize("engine_path", TOPO3D_PATHS)
def test_ltdtm_rejects_unsupported_version_and_invalid_v2_segment_lengths(engine_path):
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_TOPO3D_ENGINE, 'utf8'), { window, TextDecoder, File });
const encoder = new TextEncoder();
const manifest = encoder.encode(JSON.stringify({ dtmName: 'x.dtm', strName: 'x.str' }));
const dtm = encoder.encode('DTM');
const str = encoder.encode('STR');
function makePackage(version, manifestLength, dtmLength, strLength, includePayload = true) {
  const payloadLength = includePayload ? manifest.byteLength + dtm.byteLength + str.byteLength : 0;
  const bytes = new Uint8Array(24 + payloadLength);
  bytes.set(encoder.encode('LITHODTM'), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, version, true);
  view.setUint32(12, manifestLength, true);
  view.setUint32(16, dtmLength, true);
  view.setUint32(20, strLength, true);
  if (includePayload) {
    let offset = 24;
    bytes.set(manifest, offset); offset += manifest.byteLength;
    bytes.set(dtm, offset); offset += dtm.byteLength;
    bytes.set(str, offset);
  }
  return { name: 'fixture.ltdtm', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer };
}
async function load(file) {
  const engine = window.LithositeTopo3D.create({});
  engine.prepare = async () => engine;
  let called = false;
  engine.loadDTMSTR = async () => { called = true; return { loaded: true }; };
  let rejected = false, errorMessage = '';
  try { await engine.loadLTDtm(file); }
  catch (error) { rejected = true; errorMessage = error.message; }
  return { rejected, called, errorMessage };
}
(async () => {
  const results = {
    unsupportedVersion: await load(makePackage(99, 0, 0, 0, false)),
    zeroManifest: await load(makePackage(2, 0, 3, 3)),
    zeroDtm: await load(makePackage(2, manifest.byteLength, 0, 3)),
    zeroStr: await load(makePackage(2, manifest.byteLength, 3, 0)),
    declaredPayloadPastEnd: await load(makePackage(2, manifest.byteLength, 3, 300))
  };
  process.stdout.write(JSON.stringify(results));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_TOPO3D_ENGINE"] = str(engine_path)
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
        item["rejected"] and not item["called"]
        for item in output.values()
    ), output
    assert output["unsupportedVersion"]["errorMessage"] == "Versi DTM package tidak didukung"
    assert all(
        item["errorMessage"] == "Struktur/ukuran package Topografi tidak valid"
        for key, item in output.items()
        if key != "unsupportedVersion"
    ), output


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js is required for Topo3D runtime tests")
@pytest.mark.parametrize("engine_path", TOPO3D_PATHS)
def test_ltdtm_v2_rejects_declared_segments_over_resource_limits(engine_path):
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_TOPO3D_ENGINE, 'utf8'), { window, TextDecoder, File });
const encoder = new TextEncoder();
const manifest = encoder.encode(JSON.stringify({ dtmName: 'x.dtm', strName: 'x.str' }));
function makePackage(dtmLength, strLength) {
  const bytes = new Uint8Array(24 + manifest.byteLength + 2);
  bytes.set(encoder.encode('LITHODTM'), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 2, true);
  view.setUint32(12, manifest.byteLength, true);
  view.setUint32(16, dtmLength, true);
  view.setUint32(20, strLength, true);
  bytes.set(manifest, 24);
  bytes.set(encoder.encode('DS'), 24 + manifest.byteLength);
  return { name: 'fixture.ltdtm', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer };
}
async function load(file) {
  const engine = window.LithositeTopo3D.create({});
  engine.prepare = async () => engine;
  let called = false, rejected = false, errorMessage = '';
  engine.loadDTMSTR = async () => { called = true; };
  try { await engine.loadLTDtm(file); }
  catch (error) { rejected = true; errorMessage = error.message; }
  return { rejected, called, errorMessage };
}
(async () => {
  const results = {
    dtmOverLimit: await load(makePackage(64 * 1024 * 1024 + 1, 1)),
    strOverLimit: await load(makePackage(1, 64 * 1024 * 1024 + 1))
  };
  process.stdout.write(JSON.stringify(results));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    env = os.environ.copy()
    env["LITHOSITE_TOPO3D_ENGINE"] = str(engine_path)
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
        item == {
            "rejected": True,
            "called": False,
            "errorMessage": "Struktur/ukuran package Topografi tidak valid",
        }
        for item in output.values()
    ), output
