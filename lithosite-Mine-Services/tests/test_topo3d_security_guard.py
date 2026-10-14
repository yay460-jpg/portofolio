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
def test_ltdtm_v1_rejects_triangle_indices_outside_vertex_buffer(engine_path):
    script = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(process.env.LITHOSITE_TOPO3D_ENGINE, 'utf8'), { window });
const engine = window.LithositeTopo3D.create({});
engine.prepare = async () => engine;
let buildCalled = false;
engine._buildGPU = () => { buildCalled = true; };
const encoder = new TextEncoder();
const meta = encoder.encode(JSON.stringify({
  version: 1,
  name: 'invalid-index-fixture',
  triangles: 1,
  bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 0 }
}));
const xyz = new Float64Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
const indices = new Uint32Array([0, 1, 99]);
const bytes = new Uint8Array(24 + meta.byteLength + xyz.byteLength + indices.byteLength);
bytes.set(encoder.encode('LITHODTM'), 0);
const view = new DataView(bytes.buffer);
view.setUint32(8, 1, true);
view.setUint32(12, 3, true);
view.setUint32(16, 3, true);
view.setUint32(20, meta.byteLength, true);
let offset = 24;
bytes.set(meta, offset); offset += meta.byteLength;
bytes.set(new Uint8Array(xyz.buffer), offset); offset += xyz.byteLength;
bytes.set(new Uint8Array(indices.buffer), offset);
const file = {
  name: 'invalid-index.ltdtm',
  size: bytes.byteLength,
  arrayBuffer: async () => bytes.buffer
};
(async () => {
  let rejected = false;
  try { await engine.loadLTDtm(file); } catch (_) { rejected = true; }
  process.stdout.write(JSON.stringify({ rejected, buildCalled }));
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
    assert output == {"rejected": True, "buildCalled": False}, output
