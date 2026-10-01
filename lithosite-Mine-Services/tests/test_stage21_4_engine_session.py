from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "engine-session.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_engine_session_exists():
    assert ENGINE.exists()
    assert "createEngineSession" in SOURCE
    assert "MineServicesMapEngineSession" in SOURCE


def test_engine_session_validates_boundaries():
    assert "map engine is required" in SOURCE
    assert "renderer boundary is required" in SOURCE
    assert "typeof rendererBoundary.prepare" in SOURCE


def test_engine_session_lifecycle():
    assert "prepare(context)" in SOURCE
    assert "render(snapshot)" in SOURCE
    assert "resize(width, height)" in SOURCE
    assert "destroy()" in SOURCE
    assert "must be prepared before render" in SOURCE


def test_engine_session_owns_render_lifecycle():
    assert "rendererBoundary.prepare" in SOURCE
    assert "rendererBoundary.render" in SOURCE
    assert "rendererBoundary.resize" in SOURCE
    assert "rendererBoundary.destroy" in SOURCE
    assert "engine.destroy" in SOURCE


def test_engine_session_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()
    assert "Leaflet" not in SOURCE
    assert "MapLibre" not in SOURCE


def test_engine_session_exports_are_frozen():
    assert "Object.freeze" in SOURCE
