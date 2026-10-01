from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "engine-adapter.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_engine_adapter_exists():
    assert ENGINE.exists()
    assert "createEngineAdapter" in SOURCE
    assert "MineServicesMapEngineAdapter" in SOURCE


def test_adapter_exposes_contract_methods():
    for method in [
        "setViewport", "getViewport", "worldToScreen", "screenToWorld",
        "pan", "zoom", "zoomAtPoint", "fitBounds",
        "addLayer", "removeLayer", "setLayerVisibility",
        "addPoint", "addLine", "addPolygon", "clear"
    ]:
        assert method in SOURCE


def test_adapter_validates_required_api():
    assert "map engine API is required" in SOURCE
    assert "map engine API." in SOURCE
    assert "REQUIRED.forEach" in SOURCE


def test_adapter_validates_navigation_arguments():
    assert "deltaX" in SOURCE
    assert "deltaY" in SOURCE
    assert "point must contain finite x and y" in SOURCE


def test_adapter_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_adapter_exports_are_frozen():
    assert "Object.freeze" in SOURCE
