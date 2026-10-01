from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "runtime-bootstrap.js"
HTML = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v31-STAGE19.html"
SOURCE = ENGINE.read_text(encoding="utf-8")
HTML_SOURCE = HTML.read_text(encoding="utf-8")


def test_runtime_bootstrap_exists():
    assert ENGINE.exists()
    assert "createMapBootstrap" in SOURCE
    assert "MineServicesMapBootstrap" in SOURCE


def test_runtime_bootstrap_creates_map_layers():
    for layer in ["site", "workfront", "route", "equipment", "operations", "maintenance", "hse", "issue"]:
        assert "id: '" + layer + "'" in SOURCE


def test_runtime_bootstrap_creates_sample_map_features():
    assert "SITE-01" in SOURCE
    assert "WF-01" in SOURCE
    assert "WF-02" in SOURCE
    assert "WF-03" in SOURCE
    assert "WF-04" in SOURCE
    assert "RT-01" in SOURCE
    assert "RT-02" in SOURCE
    assert "RT-03" in SOURCE


def test_runtime_bootstrap_configures_viewport():
    assert "navigation.setViewport" in SOURCE
    assert "width: 1000" in SOURCE
    assert "height: 560" in SOURCE


def test_runtime_bootstrap_prepares_engine():
    assert "engine.prepare" in SOURCE
    assert "engine.ready" in SOURCE


def test_runtime_bootstrap_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_runtime_bootstrap_exports_are_frozen():
    assert "Object.freeze" in SOURCE


def test_v31_loads_map_engine_runtime_components():
    for script in [
        "coordinate.js?v=20261001",
        "geometry.js?v=20261001",
        "navigation.js?v=20261001",
        "layer-management.js?v=20261001",
        "feature-registry.js?v=20261001",
        "map-model.js?v=20261001",
        "interaction.js?v=20261001",
        "map-engine-core.js?v=20261001",
        "runtime-bootstrap.js?v=20261001",
    ]:
        assert script in HTML_SOURCE


def test_v31_bootstraps_and_binds_map_host():
    assert "MineServicesMapBootstrap.createMapBootstrap" in HTML_SOURCE
    assert "MineServicesMapEngineHost.init(host,snapshot)" in HTML_SOURCE
    assert "lithosite:map-engine-ready" in HTML_SOURCE
