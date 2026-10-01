from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "operations-location.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_operations_location_engine_exists():
    assert ENGINE.exists()
    assert "createOperation" in SOURCE
    assert "boundsFromOperation" in SOURCE


def test_operations_location_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_operation_requires_id_and_location_crs():
    assert "operation.id" in SOURCE
    assert "location CRS is required" in SOURCE


def test_operation_preserves_domain_attributes():
    assert "name:" in SOURCE
    assert "status:" in SOURCE
    assert "metadata:" in SOURCE


def test_operation_crs_must_match_reference():
    assert "assertSameCRS" in SOURCE
    assert "Operation CRS does not match reference CRS" in SOURCE


def test_operation_bounds_are_location_based():
    assert "minX: operation.location.x" in SOURCE
    assert "maxX: operation.location.x" in SOURCE
    assert "minY: operation.location.y" in SOURCE
    assert "maxY: operation.location.y" in SOURCE


def test_operations_location_exports_are_frozen():
    assert "MineServicesMapOperationsLocation" in SOURCE
    assert "Object.freeze" in SOURCE
