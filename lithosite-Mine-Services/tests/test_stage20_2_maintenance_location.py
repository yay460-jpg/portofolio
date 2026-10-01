from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "maintenance-location.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_maintenance_location_engine_exists():
    assert ENGINE.exists()
    assert "createMaintenance" in SOURCE
    assert "boundsFromMaintenance" in SOURCE


def test_maintenance_location_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_maintenance_requires_id_and_location_crs():
    assert "maintenance.id" in SOURCE
    assert "location CRS is required" in SOURCE


def test_maintenance_preserves_domain_attributes():
    assert "name:" in SOURCE
    assert "status:" in SOURCE
    assert "maintenanceType:" in SOURCE
    assert "metadata:" in SOURCE


def test_maintenance_crs_must_match_reference():
    assert "assertSameCRS" in SOURCE
    assert "Maintenance CRS does not match reference CRS" in SOURCE


def test_maintenance_bounds_are_location_based():
    assert "minX: maintenance.location.x" in SOURCE
    assert "maxX: maintenance.location.x" in SOURCE
    assert "minY: maintenance.location.y" in SOURCE
    assert "maxY: maintenance.location.y" in SOURCE


def test_maintenance_location_exports_are_frozen():
    assert "MineServicesMapMaintenanceLocation" in SOURCE
    assert "Object.freeze" in SOURCE
