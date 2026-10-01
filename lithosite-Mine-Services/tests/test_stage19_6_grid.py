from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "grid.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_grid_engine_exists():
    assert ENGINE.exists()
    assert "createGrid" in SOURCE
    assert "generate" in SOURCE
    assert "generateFromViewport" in SOURCE


def test_grid_is_platform_neutral():
    assert "document." not in SOURCE
    assert "webgl" not in SOURCE.lower()


def test_grid_uses_world_spacing():
    assert "spacing" in SOURCE
    assert "Math.floor(bounds.minX / spacing) * spacing" in SOURCE
    assert "Math.floor(bounds.minY / spacing) * spacing" in SOURCE


def test_grid_generates_both_orientations():
    assert "orientation: 'vertical'" in SOURCE
    assert "orientation: 'horizontal'" in SOURCE


def test_major_line_semantics_exist():
    assert "majorEvery" in SOURCE
    assert "major:" in SOURCE


def test_grid_propagates_crs():
    assert "crs: bounds.crs" in SOURCE
    assert "crs: viewport.center.crs" in SOURCE


def test_grid_viewport_generation_uses_scale():
    assert "viewport.width * viewport.scale / 2" in SOURCE
    assert "viewport.height * viewport.scale / 2" in SOURCE


def test_grid_options_are_validated():
    assert "field + ' must be greater than zero'" in SOURCE
    assert "majorEvery" in SOURCE


def test_grid_exports_are_frozen():
    assert "Object.freeze" in SOURCE
    assert "MineServicesMapGrid" in SOURCE
