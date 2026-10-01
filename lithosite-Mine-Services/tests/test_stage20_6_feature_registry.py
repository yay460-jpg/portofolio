from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "feature-registry.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_feature_registry_engine_exists():
    assert ENGINE.exists()
    assert "createFeatureRegistry" in SOURCE
    assert "addFeature" in SOURCE
    assert "updateFeature" in SOURCE
    assert "removeFeature" in SOURCE


def test_feature_registry_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_feature_requires_id_layer_and_geometry():
    assert "feature.id" in SOURCE
    assert "feature.layerId" in SOURCE
    assert "feature.geometry is required" in SOURCE
    assert "feature.geometry.type is required" in SOURCE


def test_feature_requires_geometry_crs():
    assert "feature.geometry CRS is required" in SOURCE


def test_feature_supports_properties_and_metadata():
    assert "properties:" in SOURCE
    assert "metadata:" in SOURCE


def test_feature_registry_rejects_duplicates():
    assert "Feature already exists:" in SOURCE


def test_feature_registry_supports_layer_queries():
    assert "getFeaturesByLayer" in SOURCE
    assert "feature.layerId === normalizedLayerId" in SOURCE


def test_feature_registry_update_is_validated():
    assert "feature patch is required" in SOURCE
    assert "const normalized = validateFeature(next)" in SOURCE


def test_feature_registry_exports_are_frozen():
    assert "MineServicesMapFeatureRegistry" in SOURCE
    assert "Object.freeze" in SOURCE
