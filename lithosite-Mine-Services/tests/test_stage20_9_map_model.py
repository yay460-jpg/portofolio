from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "map-model.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_map_model_exists():
    assert ENGINE.exists()
    assert "createMapModel" in SOURCE
    assert "addFeature" in SOURCE
    assert "snapshot" in SOURCE


def test_map_model_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_map_model_integrates_layers_and_features():
    assert "layerManager" in SOURCE
    assert "featureRegistry" in SOURCE
    assert "Layer not found" in SOURCE
    assert "featureRegistry.addFeature" in SOURCE


def test_map_model_exposes_feature_lifecycle():
    assert "updateFeature" in SOURCE
    assert "removeFeature" in SOURCE
    assert "getFeature" in SOURCE
    assert "getFeaturesByLayer" in SOURCE


def test_map_model_snapshot_contains_layers_and_features():
    assert "layers:" in SOURCE
    assert "features:" in SOURCE
    assert "layerManager.listLayers()" in SOURCE
    assert "featureRegistry.listFeatures()" in SOURCE


def test_map_model_exports_are_frozen():
    assert "MineServicesMapModel" in SOURCE
    assert "Object.freeze" in SOURCE
