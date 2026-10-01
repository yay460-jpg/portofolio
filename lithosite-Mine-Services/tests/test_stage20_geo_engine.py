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
    assert "LithositeMineServicesGeoConfig" in map_engine
    assert "LithositeMineServicesGeo.create" in map_engine
    assert "getGeo:function(){return geo;}" in map_engine


def test_stage20_topo_coordinate_readout_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DCoordinate"' in html
    assert "function updateCoordinateInfo(meta)" in map_engine
    assert "meta.bounds" in map_engine
    assert "toFixed(2)" in map_engine
    assert "engine.getState().meta" in map_engine


def test_stage20_grid_convergence_north_arrow_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DNorth"' in html
    assert 'id="dashboardTopo3DNorthLabel"' in html
    assert "geo.convergence(e,n)" in map_engine
    assert "convergenceDeg" in map_engine
    assert "updateNorthArrow()" in map_engine
    assert "engine.angleY" in map_engine



def test_stage20_bearing_distance_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DMeasure"' in html
    assert 'id="dashboardTopo3DMeasureE1"' in html
    assert 'id="dashboardTopo3DMeasureN1"' in html
    assert 'id="dashboardTopo3DMeasureE2"' in html
    assert 'id="dashboardTopo3DMeasureN2"' in html
    assert 'id="dashboardTopo3DMeasureRun"' in html
    assert 'id="dashboardTopo3DMeasureResult"' in html
    assert "function updateMeasurement()" in map_engine
    assert "geo.bearingDistance(fields[0],fields[1],fields[2],fields[3])" in map_engine
    assert "bearingGridDeg" in map_engine
    assert "distanceMeters" in map_engine


def test_stage20_measurement_toggle_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DMeasureToggle"' in html
    assert 'aria-label="Show Grid Bearing and Distance"' in html
    assert 'id="dashboardTopo3DMeasure"' in html
    assert "measurePanel.classList.toggle('open')" in map_engine
    assert "guidePanel.classList.remove('open')" in map_engine
    assert "measureToggle.setAttribute('aria-expanded',open?'true':'false')" in map_engine



def test_stage20_top_view_display_refinement_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")
    css = (ROOT / "ui" / "modules" / "map-engine" / "map-engine.css").read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DTop"' in html
    assert "function syncTopViewClass()" in map_engine
    assert "host.classList.toggle('is-top-view'" in map_engine
    assert "filter:brightness(1.22) contrast(1.04)" in css


def test_stage20_point_interaction_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    map_engine = MAP_ENGINE.read_text(encoding="utf-8")
    topo_engine = (ROOT / "shared" / "topo3d" / "topo3d-engine.js").read_text(encoding="utf-8")

    assert 'id="dashboardTopo3DMeasurePickA"' in html
    assert 'id="dashboardTopo3DMeasurePickB"' in html
    assert 'id="dashboardTopo3DPointA"' in html
    assert 'id="dashboardTopo3DPointB"' in html
    assert "Topo3DEngine.prototype.pickCoordinate=function" in topo_engine
    assert "engine.pickCoordinate(x,y,22)" in map_engine
    assert "function handlePointPick(event)" in map_engine
    assert "setPickedPoint(activePickPoint,point)" in map_engine
