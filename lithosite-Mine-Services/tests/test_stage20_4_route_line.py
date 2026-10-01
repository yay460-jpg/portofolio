from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "route-line.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_route_line_engine_exists():
    assert ENGINE.exists()
    assert "createRoute" in SOURCE
    assert "boundsFromRoute" in SOURCE


def test_route_line_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_route_requires_linestring_and_crs():
    assert "route geometry must be LineString" in SOURCE
    assert "geometry CRS is required" in SOURCE
    assert "at least two coordinates" in SOURCE


def test_route_preserves_domain_attributes():
    assert "status:" in SOURCE
    assert "routeType:" in SOURCE
    assert "direction:" in SOURCE
    assert "metadata:" in SOURCE


def test_route_crs_must_match_reference():
    assert "assertSameCRS" in SOURCE
    assert "Route CRS does not match reference CRS" in SOURCE


def test_route_bounds_cover_all_coordinates():
    assert "route.geometry.coordinates" in SOURCE
    assert "minX" in SOURCE
    assert "maxX" in SOURCE
    assert "minY" in SOURCE
    assert "maxY" in SOURCE


def test_route_exports_are_frozen():
    assert "MineServicesMapRouteLine" in SOURCE
    assert "Object.freeze" in SOURCE
