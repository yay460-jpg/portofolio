from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "ui" / "modules" / "map-engine" / "visual-binding.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_visual_binding_exists():
    assert ENGINE.exists()
    assert "createVisualBinding" in SOURCE
    assert "MineServicesMapVisualBinding" in SOURCE


def test_visual_binding_supports_projected_geometry():
    for geometry_type in ["Point", "LineString", "Polygon"]:
        assert "'" + geometry_type + "'" in SOURCE


def test_visual_binding_renders_engine_features():
    assert "projection.features.forEach" in SOURCE
    assert "data-map-engine-generated" in SOURCE
    assert "feature.id" in SOURCE


def test_visual_binding_uses_map_surface():
    assert "ms-map-engine__surface" in SOURCE
    assert "map surface is required" in SOURCE


def test_visual_binding_is_explicitly_visual():
    assert "document.createElement" in SOURCE
    assert "node.style" in SOURCE


def test_visual_binding_exports_are_frozen():
    assert "MineServicesMapVisualBinding" in SOURCE
    assert "Object.freeze" in SOURCE
