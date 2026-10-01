from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "geometry-projection.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_geometry_projection_exists():
    assert ENGINE.exists()
    assert "projectGeometry" in SOURCE
    assert "projectFeature" in SOURCE
    assert "projectSnapshot" in SOURCE


def test_geometry_projection_supports_core_geometry_types():
    for geometry_type in ["Point", "LineString", "Polygon"]:
        assert "'" + geometry_type + "'" in SOURCE


def test_geometry_projection_uses_coordinate_transform():
    assert "worldToScreen" in SOURCE
    assert "projectPoint" in SOURCE


def test_geometry_projection_projects_snapshot_features():
    assert "snapshot.model.features" in SOURCE
    assert "snapshot.viewport" in SOURCE
    assert "projectFeature" in SOURCE


def test_geometry_projection_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_geometry_projection_exports_are_frozen():
    assert "MineServicesMapGeometryProjection" in SOURCE
    assert "Object.freeze" in SOURCE
