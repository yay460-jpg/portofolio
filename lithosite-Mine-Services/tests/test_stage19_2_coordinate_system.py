from pathlib import Path


def test_stage19_2_coordinate_model_contract():
    root = Path(__file__).parents[1]
    source = (root / 'engine' / 'map' / 'coordinate.js').read_text(encoding='utf-8')
    doc = (root / 'engine' / 'map' / 'COORDINATE-SYSTEM.md').read_text(encoding='utf-8')

    for token in ('createCRS', 'createCoordinate', 'isCoordinate', 'assertSameCRS'):
        assert token in source

    for token in ('projected', 'geographic', 'xy', 'lonlat', 'latlon', 'meter', 'degree'):
        assert token in source
        assert token in doc

    assert 'No CRS is inherited from Mine Geologist' in doc
    assert 'CRS id is mandatory' in doc
    assert 'Coordinates cannot silently mix CRS definitions' in doc


def test_stage19_2_coordinate_model_is_platform_neutral():
    root = Path(__file__).parents[1]
    source = (root / 'engine' / 'map' / 'coordinate.js').read_text(encoding='utf-8').lower()

    for token in ('leaflet', 'maplibre', 'google.maps', 'document.', 'canvas', 'android'):
        assert token not in source