from pathlib import Path


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
