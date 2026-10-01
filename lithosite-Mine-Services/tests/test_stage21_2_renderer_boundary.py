from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "renderer-boundary.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_renderer_boundary_exists():
    assert ENGINE.exists()
    assert "createRendererBoundary" in SOURCE
    assert "validateRenderer" in SOURCE


def test_renderer_contract_is_explicit():
    for method in ["prepare", "render", "resize", "destroy"]:
        assert "'" + method + "'" in SOURCE


def test_renderer_lifecycle_is_guarded():
    assert "prepared" in SOURCE
    assert "destroyed" in SOURCE
    assert "must be prepared before render" in SOURCE


def test_renderer_resize_is_validated():
    assert "renderer width must be greater than zero" in SOURCE
    assert "renderer height must be greater than zero" in SOURCE


def test_renderer_boundary_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_renderer_boundary_exports_are_frozen():
    assert "MineServicesMapRendererBoundary" in SOURCE
    assert "Object.freeze" in SOURCE
