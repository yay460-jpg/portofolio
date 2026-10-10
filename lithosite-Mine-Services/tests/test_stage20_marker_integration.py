from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html"
MAP_ENGINE = ROOT / "ui" / "modules" / "map-engine" / "map-engine.js"
TOPO_ENGINE = ROOT / "shared" / "topo3d" / "topo3d-engine.js"

def test_stage20_marker_overlay_assets_are_loaded_before_map_engine():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/modules/map-engine/marker-location.css?v=20261012" in html
    assert "../ui/modules/map-engine/marker-location.js?v=20261017" in html
    assert html.index("../ui/modules/map-engine/geo-adapter.js?v=20261001") < html.index("../ui/modules/map-engine/marker-location.js?v=20261017")
    assert html.index("../ui/modules/map-engine/marker-location.js?v=20261017") < html.index("../ui/modules/map-engine/map-engine.js?v=20261006")

def test_stage20_marker_renderer_is_only_a_map_render_overlay():
    js = MAP_ENGINE.read_text(encoding="utf-8")
    assert "global.MineServicesMarkerLocation" in js
    assert "renderMarkers(engine,host)" in js
    assert "onRender:function(){syncPickedMarkers();if(global.MineServicesMarkerLocation)global.MineServicesMarkerLocation.renderMarkers(engine,host);}" in js

def test_stage20_marker_overlay_does_not_replace_topo_rendering_engine():
    js = MAP_ENGINE.read_text(encoding="utf-8")
    topo = TOPO_ENGINE.read_text(encoding="utf-8")
    assert "LithositeTopo3D.create" in js
    assert "engine.projectCoordinate" in js
    assert "engine.pickCoordinate" in js
    assert "function renderMarkers" not in js
    assert "projectCoordinate" in topo
    assert "pickCoordinate" in topo

def test_stage20_marker_overlay_preserves_measurement_layer_contract():
    html = ARTIFACT.read_text(encoding="utf-8")
    js = MAP_ENGINE.read_text(encoding="utf-8")
    assert 'id="dashboardTopo3DMeasureOverlay"' in html
    assert 'id="dashboardTopo3DMeasureLine"' in html
    assert "dashboardTopo3DMeasureLine" in js
    assert "syncPickedMarkers" in js

def test_workfront_focus_event_blinks_the_exact_marker_label_temporarily():
    html = ARTIFACT.read_text(encoding="utf-8")
    js = MAP_ENGINE.read_text(encoding="utf-8")
    marker_css = (ROOT / "ui" / "modules" / "map-engine" / "marker-location.css").read_text(encoding="utf-8")

    assert "../ui/modules/map-engine/map-engine.js?v=20261006" in html
    assert "function blinkFocusedMarkerLabel(marker)" in js
    assert "getAttribute('data-marker-id')===markerId" in js
    assert "label.classList.add('is-focus-blinking')" in js
    assert "engine.focusCoordinate(marker.easting,marker.northing,marker.elevation)" in js
    assert "},2100);" in js
    assert "@keyframes map-marker-label-focus-blink" in marker_css
    assert ".map-location-marker__label.is-focus-blinking" in marker_css
    assert "animation:map-marker-label-focus-blink .42s ease-in-out 4;" in marker_css
    assert "@media(prefers-reduced-motion:reduce)" in marker_css
