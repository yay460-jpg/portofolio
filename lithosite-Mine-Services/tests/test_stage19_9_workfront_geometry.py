from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "workfront-geometry.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_workfront_geometry_engine_exists():
    assert ENGINE.exists()
    assert "createWorkFront" in SOURCE
    assert "boundsFromWorkFront" in SOURCE


def test_workfront_geometry_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_workfront_type_and_geometry_types_exist():
    assert "WORKFRONT: 'workfront'" in SOURCE
    assert "'Point'" in SOURCE
    assert "'LineString'" in SOURCE
    assert "'Polygon'" in SOURCE


def test_workfront_requires_id_and_geometry_crs():
    assert "workfront.id" in SOURCE
    assert "geometry CRS is required" in SOURCE


def test_workfront_supports_status_and_metadata():
    assert "status:" in SOURCE
    assert "metadata:" in SOURCE


def test_workfront_crs_must_match_reference():
    assert "assertSameCRS" in SOURCE
    assert "WorkFront CRS does not match reference CRS" in SOURCE


def test_workfront_bounds_cover_supported_geometry():
    assert "geometry.coordinates" in SOURCE
    assert "geometry.rings" in SOURCE
    assert "boundsFromGeometry" in SOURCE
    assert "minX" in SOURCE
    assert "maxX" in SOURCE
    assert "minY" in SOURCE
    assert "maxY" in SOURCE


def test_workfront_exports_are_frozen():
    assert "MineServicesMapWorkFront" in SOURCE
    assert "Object.freeze" in SOURCE
