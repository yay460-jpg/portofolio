from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "map-engine-core.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_core_exposes_integration_boundaries():
    assert "setModel" in SOURCE
    assert "getModel" in SOURCE
    assert "setNavigation" in SOURCE
    assert "getNavigation" in SOURCE
    assert "setInteraction" in SOURCE
    assert "getInteraction" in SOURCE


def test_core_prepare_accepts_engine_components():
    assert "config.model" in SOURCE
    assert "config.navigation" in SOURCE
    assert "config.interaction" in SOURCE


def test_core_viewport_uses_navigation_when_available():
    assert "this.navigation.getViewport" in SOURCE
    assert "this.navigation.setViewport" in SOURCE


def test_core_remains_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_core_version_is_bumped():
    assert "version: '0.2.0'" in SOURCE
