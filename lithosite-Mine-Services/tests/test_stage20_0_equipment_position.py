from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "equipment-position.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_equipment_position_engine_exists():
    assert ENGINE.exists()
    assert "createEquipment" in SOURCE
    assert "boundsFromEquipment" in SOURCE


def test_equipment_position_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_equipment_requires_id_and_position_crs():
    assert "equipment.id" in SOURCE
    assert "position CRS is required" in SOURCE


def test_equipment_preserves_domain_attributes():
    assert "category:" in SOURCE
    assert "status:" in SOURCE
    assert "heading:" in SOURCE
    assert "elevation:" in SOURCE
    assert "metadata:" in SOURCE


def test_equipment_crs_must_match_reference():
    assert "assertSameCRS" in SOURCE
    assert "Equipment CRS does not match reference CRS" in SOURCE


def test_equipment_bounds_are_position_based():
    assert "minX: equipment.position.x" in SOURCE
    assert "maxX: equipment.position.x" in SOURCE
    assert "minY: equipment.position.y" in SOURCE
    assert "maxY: equipment.position.y" in SOURCE


def test_equipment_exports_are_frozen():
    assert "MineServicesMapEquipmentPosition" in SOURCE
    assert "Object.freeze" in SOURCE
