from pathlib import Path


ROOT = Path(__file__).parents[1]
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"
MARKER_CSS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.css"
EQUIPMENT_JS = ROOT / "ui" / "modules" / "equipment" / "equipment.js"
WORKFRONT_JS = ROOT / "ui" / "modules" / "workfront" / "workfront.js"
HSE_JS = ROOT / "ui" / "modules" / "hse" / "hse.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v37-STAGE26.html"


def test_stage20_10_marker_click_opens_domain_popup():
    js = MARKER_JS.read_text(encoding="utf-8")
    assert "function ensureDomainPopup(container)" in js
    assert "function showMarkerDomainPopup(marker, container)" in js
    assert "function positionDomainPopup(engine, container)" in js
    assert "mine-services:open-domain-record" in js
    assert "showMarkerDomainPopup(marker,container)" in js
    assert "showMarkerDomainPopup:showMarkerDomainPopup" in js


def test_stage20_10_popup_uses_marker_domain_reference_only():
    js = MARKER_JS.read_text(encoding="utf-8")
    start = js.index("function showMarkerDomainPopup")
    end = js.index("function positionDomainPopup", start)
    block = js[start:end]
    assert "marker.source_entity" in block
    assert "marker.source_id" in block
    assert "easting" not in block
    assert "northing" not in block
    assert "location" not in block


def test_stage20_10_domain_modules_listen_for_marker_navigation():
    equipment = EQUIPMENT_JS.read_text(encoding="utf-8")
    workfront = WORKFRONT_JS.read_text(encoding="utf-8")
    hse = HSE_JS.read_text(encoding="utf-8")

    for module, entity, screen in (
        (equipment, "Equipment", "Equipment"),
        (workfront, "WorkFront", "Work Front"),
        (hse, "HSE", "HSE"),
    ):
        assert "mine-services:open-domain-record" in module
        assert "detail.source_entity!=='" + entity + "'" in module
        assert "openEdit(detail.source_id)" in module
        assert "setScreen('" + screen + "')" in module


def test_stage20_10_popup_is_map_overlay_not_layout_content():
    css = MARKER_CSS.read_text(encoding="utf-8")
    assert ".map-marker-domain-popup" in css
    assert "position:absolute" in css
    assert ".map-marker-domain-popup[hidden]{display:none!important;}" in css
    assert ".map-marker-domain-popup__open" in css


def test_stage20_10_v32_loads_current_assets():
    html = ARTIFACT.read_text(encoding="utf-8")
    for marker in (
        "../ui/modules/map-engine/marker-location.js?v=20261015",
        "../ui/modules/map-engine/marker-location.css?v=20261011",
        "../ui/modules/equipment/equipment.js?v=20261005",
        "../ui/modules/workfront/workfront.js?v=20261007",
        "../ui/modules/hse/hse.js?v=20261005",
    ):
        assert marker in html

