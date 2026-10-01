from pathlib import Path


def test_stage19_map_engine_contract():
    root = Path(__file__).parents[1]
    contract = (root / 'engine' / 'map' / 'map-engine-contract.js').read_text(encoding='utf-8')
    readme = (root / 'engine' / 'map' / 'README.md').read_text(encoding='utf-8')

    assert 'MineServicesMapEngine' in contract
    assert 'platformNeutral: true' in contract
    assert 'domIndependent: true' in contract

    for method in (
        'setViewport', 'getViewport', 'worldToScreen', 'screenToWorld',
        'pan', 'zoom', 'zoomAtPoint', 'addLayer', 'removeLayer',
        'setLayerVisibility', 'addPoint', 'addLine', 'addPolygon',
        'fitBounds', 'clear',
    ):
        assert method in contract
        assert method in readme

    for geometry in ('Point', 'LineString', 'Polygon'):
        assert geometry in contract
        assert geometry in readme

    for layer_type in (
        'site', 'boundary', 'workfront', 'equipment', 'operations',
        'maintenance', 'hse', 'issue', 'route', 'stockpile', 'infrastructure',
    ):
        assert layer_type in contract
        assert layer_type in readme


def test_stage19_map_engine_has_no_renderer_dependency():
    root = Path(__file__).parents[1]
    contract = (root / 'engine' / 'map' / 'map-engine-contract.js').read_text(encoding='utf-8')
    lowered = contract.lower()

    for token in ('leaflet', 'maplibre', 'google.maps', 'document.', 'canvas', 'android'):
        assert token not in lowered