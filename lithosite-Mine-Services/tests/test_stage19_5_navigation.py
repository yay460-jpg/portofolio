from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "navigation.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_navigation_exists():
    assert ENGINE.exists()
    assert "createNavigation" in SOURCE
    assert "pan" in SOURCE
    assert "zoom" in SOURCE
    assert "zoomAtPoint" in SOURCE


def test_navigation_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_pan_updates_world_center_using_scale():
    assert "deltaX * state.scale" in SOURCE
    assert "deltaY * state.scale" in SOURCE


def test_zoom_has_limits():
    assert "minZoom" in SOURCE
    assert "maxZoom" in SOURCE
    assert "Math.max(minZoom, Math.min(maxZoom" in SOURCE


def test_zoom_uses_power_of_two_scale():
    assert "Math.pow(2, state.zoom)" in SOURCE


def test_zoom_at_point_preserves_world_anchor():
    assert "zoomAtPoint" in SOURCE
    assert "anchor.x - state.width / 2" in SOURCE
    assert "anchor.y - state.height / 2" in SOURCE


def test_bounds_are_available():
    assert "getBounds" in SOURCE
    assert "minX" in SOURCE
    assert "maxX" in SOURCE
    assert "minY" in SOURCE
    assert "maxY" in SOURCE


def test_navigation_exports_are_frozen():
    assert "Object.freeze" in SOURCE
    assert "MineServicesMapNavigation" in SOURCE


def test_navigation_keeps_crs_with_center():
    assert "crs: state.center.crs" in SOURCE
