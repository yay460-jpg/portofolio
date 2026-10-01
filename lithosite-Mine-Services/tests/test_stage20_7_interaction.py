from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "interaction.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_map_interaction_engine_exists():
    assert ENGINE.exists()
    assert "createInteraction" in SOURCE
    assert "select" in SOURCE
    assert "hover" in SOURCE


def test_map_interaction_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_interaction_events_exist():
    assert "SELECT: 'select'" in SOURCE
    assert "CLEAR_SELECTION: 'clear-selection'" in SOURCE
    assert "HOVER: 'hover'" in SOURCE
    assert "CLEAR_HOVER: 'clear-hover'" in SOURCE


def test_selection_state_is_supported():
    assert "selectedFeatureId" in SOURCE
    assert "getSelectedFeatureId" in SOURCE
    assert "clearSelection" in SOURCE


def test_hover_state_is_supported():
    assert "hoveredFeatureId" in SOURCE
    assert "getHoveredFeatureId" in SOURCE
    assert "clearHover" in SOURCE


def test_interaction_subscriptions_are_supported():
    assert "listeners" in SOURCE
    assert "function on(type, handler)" in SOURCE
    assert "return function unsubscribe()" in SOURCE


def test_interaction_emits_events():
    assert "emit(EVENTS.SELECT" in SOURCE
    assert "emit(EVENTS.HOVER" in SOURCE
    assert "emit(EVENTS.CLEAR_SELECTION" in SOURCE
    assert "emit(EVENTS.CLEAR_HOVER" in SOURCE


def test_interaction_exports_are_frozen():
    assert "MineServicesMapInteraction" in SOURCE
    assert "Object.freeze" in SOURCE
