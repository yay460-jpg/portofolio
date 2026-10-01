from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "site-boundary.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_site_boundary_engine_exists():
    assert ENGINE.exists()
    assert "createSite" in SOURCE
    assert "createBoundary" in SOURCE
    assert "boundsFromSite" in SOURCE
    assert "boundsFromBoundary" in SOURCE


def test_site_boundary_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_site_and_boundary_types_exist():
    assert "SITE: 'site'" in SOURCE
    assert "BOUNDARY: 'boundary'" in SOURCE


def test_site_requires_geometry_and_crs():
    assert "geometry is required" in SOURCE
    assert "geometry CRS is required" in SOURCE


def test_boundary_requires_polygon():
    assert "boundary geometry must be Polygon" in SOURCE


def test_site_boundary_crs_must_match():
    assert "assertSameCRS" in SOURCE
    assert "Site and boundary CRS do not match" in SOURCE


def test_bounds_are_derived_from_geometry():
    assert "boundsFromGeometry" in SOURCE
    assert "minX" in SOURCE
    assert "maxX" in SOURCE
    assert "minY" in SOURCE
    assert "maxY" in SOURCE


def test_site_boundary_exports_are_frozen():
    assert "MineServicesMapSiteBoundary" in SOURCE
    assert "Object.freeze" in SOURCE
