from pathlib import Path


ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v32-STAGE20.html"
GEO_ENGINE = ROOT / "shared" / "geo-engine.js"
ADAPTER = ROOT / "ui" / "modules" / "map-engine" / "geo-adapter.js"
MAP_ENGINE = ROOT / "ui" / "modules" / "map-engine" / "map-engine.js"


def test_stage20_geo_engine_sources_are_loaded_in_order():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../shared/geo-engine.js" in html
    assert "../ui/modules/map-engine/geo-adapter.js?v=20261001" in html
    assert "../ui/modules/map-engine/map-engine.js?v=20261001" in html
    assert html.index("../shared/geo-engine.js") < html.index("../ui/modules/map-engine/geo-adapter.js")
    assert html.index("../ui/modules/map-engine/geo-adapter.js") < html.index("../ui/modules/map-engine/map-engine.js")


def test_stage20_adapter_uses_shared_geo_engine_without_projection_duplication():
    shared = GEO_ENGINE.read_text(encoding="utf-8")
    adapter = ADAPTER.read_text(encoding="utf-8")

    for fn in (
        "inverseUtm_",
        "computeConvergenceForPoint_",
        "bearingDistanceGrid_",
    ):
        assert f"function {fn}" in shared

    assert "global.inverseUtm_" in adapter
    assert "global.computeConvergenceForPoint_" in adapter
    assert "global.bearingDistanceGrid_" in adapter
    assert "LithositeMineServicesGeo" in adapter
    assert "function inverseUtm_" not in adapter
    assert "function computeConvergenceForPoint_" not in adapter
    assert "function bearingDistanceGrid_" not in adapter


def test_stage20_adapter_requires_explicit_utm_configuration():
    adapter = ADAPTER.read_text(encoding="utf-8")
    assert "validateConfig" in adapter
    assert "zone" in adapter
    assert "hemisphere" in adapter
    assert "zone<1||zone>60" in adapter
    assert "hemisphere!=='N'&&hemisphere!=='S'" in adapter


def test_stage20_topo_host_remains_rendering_host():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DCanvas"' in html
    assert "LithositeTopo3D.create" in map_engine
    assert "MineServicesTopo3D" in map_engine
