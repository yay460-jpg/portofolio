from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "public-api.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_public_api_exists():
    assert ENGINE.exists()
    assert "createPublicAPI" in SOURCE


def test_public_api_exposes_navigation():
    for name in ["setViewport", "getViewport", "pan", "zoom", "zoomAtPoint"]:
        assert "function " + name in SOURCE


def test_public_api_exposes_coordinate_transform():
    assert "worldToScreen" in SOURCE
    assert "screenToWorld" in SOURCE


def test_public_api_exposes_fit_bounds():
    assert "fitBounds" in SOURCE


def test_public_api_exposes_feature_model():
    for name in ["addFeature", "updateFeature", "removeFeature", "getFeature", "getFeaturesByLayer"]:
        assert name in SOURCE


def test_public_api_exposes_interaction():
    for name in ["select", "clearSelection", "getSelectedFeatureId", "hover", "clearHover", "getHoveredFeatureId"]:
        assert name in SOURCE


def test_public_api_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_public_api_is_frozen():
    assert "Object.freeze" in SOURCE
    assert "MineServicesMapPublicAPI" in SOURCE
