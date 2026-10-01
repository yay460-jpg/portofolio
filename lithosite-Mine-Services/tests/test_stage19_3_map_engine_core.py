from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "map-engine-core.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_engine_core_exists_and_is_platform_neutral():
    assert ENGINE.exists()
    assert "document." not in SOURCE
    assert "window.document" not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_engine_lifecycle_is_explicit():
    for marker in (
        "CREATED",
        "PREPARED",
        "READY",
        "DESTROYED",
        "prepare",
        "ready",
        "destroy",
    ):
        assert marker in SOURCE


def test_engine_is_instance_owned_not_global_singleton():
    assert "function MineServicesMapEngine(options)" in SOURCE
    assert "new MineServicesMapEngine" not in SOURCE


def test_engine_owns_viewport_and_layers():
    for marker in (
        "this.viewport",
        "this.layers = new Map()",
        "getViewport",
        "setViewport",
        "addLayer",
        "removeLayer",
        "getLayers",
        "clear",
    ):
        assert marker in SOURCE


def test_engine_has_renderer_boundary():
    assert "setRenderer" in SOURCE
    assert "getRenderer" in SOURCE
    assert "renderer.destroy" in SOURCE


def test_engine_supports_explicit_crs_without_selecting_one():
    assert "this.crs = options.crs || null" in SOURCE
    assert "config.crs !== undefined" in SOURCE


def test_viewport_validation_is_present():
    assert "viewport.width" in SOURCE
    assert "viewport.height" in SOURCE
    assert "viewport.zoom" in SOURCE
    assert "Number.isFinite" in SOURCE


def test_layer_ids_are_unique():
    assert "Layer already exists" in SOURCE
    assert "this.layers.has(layer.id)" in SOURCE


def test_destroy_releases_owned_state():
    for marker in (
        "this.renderer = null",
        "this.layers.clear()",
        "this.viewport = null",
        "this.crs = null",
        "this.state = STATES.DESTROYED",
    ):
        assert marker in SOURCE


def test_destroyed_engine_rejects_mutation():
    assert "Map engine has been destroyed" in SOURCE
    assert "_assertAlive" in SOURCE
