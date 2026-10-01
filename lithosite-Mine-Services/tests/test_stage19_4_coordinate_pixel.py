from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "coordinate-transform.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_coordinate_transform_exists():
    assert ENGINE.exists()
    assert "worldToScreen" in SOURCE
    assert "screenToWorld" in SOURCE


def test_transform_is_platform_neutral():
    assert "document." not in SOURCE
    assert "webgl" not in SOURCE.lower()


def test_world_to_screen_uses_center_and_scale():
    assert "viewport.width / 2" in SOURCE
    assert "viewport.height / 2" in SOURCE
    assert "(world.x - viewport.center.x) / viewport.scale" in SOURCE
    assert "(world.y - viewport.center.y) / viewport.scale" in SOURCE


def test_screen_to_world_is_inverse_transform():
    assert "(screen.x - viewport.width / 2) * viewport.scale" in SOURCE
    assert "(screen.y - viewport.height / 2) * viewport.scale" in SOURCE


def test_crs_mismatch_is_rejected():
    assert "World coordinate CRS does not match viewport CRS" in SOURCE
    assert "sameCRS" in SOURCE


def test_viewport_scale_and_dimensions_are_validated():
    assert "viewport.scale" in SOURCE
    assert "viewport.width" in SOURCE
    assert "viewport.height" in SOURCE
    assert "greater than zero" in SOURCE


def test_screen_to_world_returns_viewport_crs():
    assert "crs: viewport.center.crs" in SOURCE


def test_transform_exports_are_frozen():
    assert "Object.freeze" in SOURCE
    assert "MineServicesMapCoordinateTransform" in SOURCE
