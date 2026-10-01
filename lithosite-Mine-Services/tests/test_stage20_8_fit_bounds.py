from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "map" / "fit-bounds.js"
SOURCE = ENGINE.read_text(encoding="utf-8")


def test_fit_bounds_engine_exists():
    assert ENGINE.exists()
    assert "fitBounds" in SOURCE
    assert "MineServicesMapFitBounds" in SOURCE


def test_fit_bounds_is_platform_neutral():
    assert "document." not in SOURCE
    assert "canvas" not in SOURCE.lower()
    assert "webgl" not in SOURCE.lower()


def test_fit_bounds_validates_bounds():
    assert "bounds.minX" in SOURCE
    assert "bounds.maxX" in SOURCE
    assert "bounds.minY" in SOURCE
    assert "bounds.maxY" in SOURCE
    assert "bounds CRS is required" in SOURCE


def test_fit_bounds_validates_crs():
    assert "sameCRS" in SOURCE
    assert "Bounds CRS does not match viewport CRS" in SOURCE


def test_fit_bounds_supports_padding():
    assert "padding" in SOURCE
    assert "usableWidth" in SOURCE
    assert "usableHeight" in SOURCE


def test_fit_bounds_calculates_center_and_scale():
    assert "center:" in SOURCE
    assert "scale:" in SOURCE
    assert "(bounds.minX + bounds.maxX) / 2" in SOURCE
    assert "(bounds.minY + bounds.maxY) / 2" in SOURCE
