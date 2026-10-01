from pathlib import Path


ROOT = Path(__file__).parents[1]
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"
MARKER_CSS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.css"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v32-STAGE20.html"


def test_stage20_marker_location_model_exists_and_is_centralized():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "MineServicesMarkerLocation" in js
    assert "createMarker" in js
    assert "updateMarker" in js
    assert "removeMarker" in js
    assert "getMarker" in js
    assert "listMarkers" in js
    assert "getVisibleMarkers" in js
    assert "clearMarkers" in js
    assert "renderMarkers" in js
    assert "projectCoordinate(marker.easting,marker.northing,marker.elevation)" in js
    assert "map-marker-layer" in js


def test_stage20_marker_location_contract_has_all_domain_types():
    js = MARKER_JS.read_text(encoding="utf-8")

    for marker_type in (
        "HSE",
        "ASSET",
        "FACILITY",
        "WORKFRONT",
        "STOCKPILE",
        "DISPOSAL",
        "DRAINAGE",
        "WORKSHOP",
        "OTHER",
    ):
        assert "'%s'" % marker_type in js


def test_stage20_marker_location_contract_has_spatial_and_domain_fields():
    js = MARKER_JS.read_text(encoding="utf-8")

    for field in (
        "marker_id",
        "marker_type",
        "label",
        "easting",
        "northing",
        "elevation",
        "source_entity",
        "source_id",
        "status",
    ):
        assert field in js

    assert "Marker coordinates must contain finite easting, northing, and elevation" in js


def test_stage20_marker_location_visibility_is_non_destructive():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "setMarkerVisibility" in js
    assert "getMarkerVisibility" in js
    assert "showAllMarkers" in js
    assert "hideAllMarkers" in js
    assert "visibility[normalized]=!!visible" in js
    assert "delete markers" in js
    assert "getVisibleMarkers" in js


def test_stage20_marker_location_has_no_stage20_runtime_integration_yet():
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "marker-location.js" not in html
    assert "marker-location.css" not in html


def test_stage20_marker_location_css_is_namespaced_and_inert_until_loaded():
    css = MARKER_CSS.read_text(encoding="utf-8")

    assert ".map-location-marker" in css
    assert ".map-location-marker__label" in css
    assert ".map-marker-layer" in css
    assert "Intentionally not loaded by V32 Stage 20 yet" in css
