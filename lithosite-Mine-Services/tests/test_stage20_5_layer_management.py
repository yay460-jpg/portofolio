from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "layer-management.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_layer_management_engine_exists():
    assert ENGINE.exists()
    assert "createLayerManager" in SOURCE
    assert "addLayer" in SOURCE
    assert "removeLayer" in SOURCE
    assert "setLayerVisibility" in SOURCE


def test_layer_management_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_required_mine_services_layer_types_exist():
    for layer_type in (
        "site", "boundary", "workfront", "equipment", "operations",
        "maintenance", "hse", "issue", "route", "stockpile", "infrastructure"
    ):
        assert "'" + layer_type + "'" in SOURCE


def test_layer_validation_exists():
    assert "validateLayer" in SOURCE
    assert "layer.id is required" in SOURCE
    assert "unsupported layer type" in SOURCE
    assert "layer.visible must be boolean" in SOURCE


def test_layer_order_is_supported():
    assert "setLayerOrder" in SOURCE
    assert "layer.order must be finite" in SOURCE
    assert ".sort(function (a, b)" in SOURCE


def test_layer_visibility_is_supported():
    assert "setLayerVisibility" in SOURCE
    assert "visible = visible" in SOURCE


def test_layer_registry_rejects_duplicates():
    assert "Layer already exists:" in SOURCE


def test_layer_manager_exports_are_frozen():
    assert "MineServicesMapLayerManager" in SOURCE
    assert "Object.freeze" in SOURCE
