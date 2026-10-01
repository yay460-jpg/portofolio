from pathlib import Path


ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v32-STAGE20.html"
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"
EQUIPMENT_JS = ROOT / "ui" / "modules" / "equipment" / "equipment.js"
WORKFRONT_JS = ROOT / "ui" / "modules" / "workfront" / "workfront.js"
HSE_JS = ROOT / "ui" / "modules" / "hse" / "hse.js"


def test_stage20_9_domain_show_on_map_api_is_centralized():
    js = MARKER_JS.read_text(encoding="utf-8")
    assert "function showDomainRecordOnMap(sourceEntity, sourceId)" in js
    assert "SPATIAL_LOCATION_NOT_ASSIGNED" in js
    assert "SHOWN_ON_MAP" in js
    assert "selectMarker(matches[0].marker_id)" in js
    assert "LithositeShellNavigation.setScreen('Dashboard')" in js
    assert "showDomainRecordOnMap:showDomainRecordOnMap" in js


def test_stage20_9_domain_show_on_map_never_invents_coordinates():
    js = MARKER_JS.read_text(encoding="utf-8")
    start = js.index("function showDomainRecordOnMap")
    end = js.index("function findMarkersBySource", start)
    block = js[start:end]
    assert "easting" not in block
    assert "northing" not in block
    assert "elevation" not in block
    assert "findMarkersBySource(entity,id)" in block


def test_stage20_9_domain_screens_expose_show_on_map_action():
    equipment = EQUIPMENT_JS.read_text(encoding="utf-8")
    workfront = WORKFRONT_JS.read_text(encoding="utf-8")
    hse = HSE_JS.read_text(encoding="utf-8")

    assert "show-map-equipment" in equipment
    assert "showDomainRecordOnMap('Equipment',showMap.dataset.id)" in equipment
    assert "Spatial location not assigned for Equipment" in equipment

    assert "show-map-workfront" in workfront
    assert "showDomainRecordOnMap('WorkFront',showMap.dataset.id)" in workfront
    assert "Spatial location not assigned for Work Front" in workfront

    assert "show-map-hse" in hse
    assert "showDomainRecordOnMap('HSE',showMap.dataset.id)" in hse
    assert "Spatial location not assigned for HSE" in hse


def test_stage20_9_v32_loads_current_domain_interaction_scripts():
    html = ARTIFACT.read_text(encoding="utf-8")
    for marker in (
        "../ui/modules/map-engine/marker-location.js?v=20261003",
        "../ui/modules/equipment/equipment.js?v=20261004",
        "../ui/modules/workfront/workfront.js?v=20261005",
        "../ui/modules/hse/hse.js?v=20261005",
    ):
        assert marker in html
