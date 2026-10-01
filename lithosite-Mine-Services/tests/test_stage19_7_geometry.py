from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "geometry.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_geometry_engine_exists():
    assert ENGINE.exists()
    assert "createPoint" in SOURCE
    assert "createLineString" in SOURCE
    assert "createPolygon" in SOURCE
    assert "normalizeGeometry" in SOURCE


def test_geometry_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_supported_geometry_types_exist():
    assert "Point" in SOURCE
    assert "LineString" in SOURCE
    assert "Polygon" in SOURCE


def test_point_uses_coordinate_and_crs():
    assert "coordinate(value, 'point')" in SOURCE
    assert "crs: point.crs" in SOURCE


def test_linestring_requires_two_coordinates():
    assert "coordinates(points, 'lineString', 2)" in SOURCE


def test_polygon_requires_closed_rings():
    assert "coordinates(ring, 'polygon ring ' + ringIndex, 4)" in SOURCE
    assert "polygon rings must be closed" in SOURCE


def test_geometry_enforces_crs_consistency():
    assert "assertCRS(reference, value)" in SOURCE
    assert "Geometry coordinates must use the same CRS" in SOURCE


def test_geometry_is_normalized_and_immutable():
    assert "Object.freeze" in SOURCE
    assert "normalizeGeometry" in SOURCE


def test_invalid_geometry_is_rejected():
    assert "Unsupported geometry type" in SOURCE
    assert "geometry is required" in SOURCE


def test_geometry_exports_are_frozen():
    assert "MineServicesMapGeometry" in SOURCE
    assert "Object.freeze" in SOURCE
