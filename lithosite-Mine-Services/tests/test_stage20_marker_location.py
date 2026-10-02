from pathlib import Path


ROOT = Path(__file__).parents[1]
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"
MARKER_CSS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.css"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v32-STAGE20.html"


def test_stage20_marker_location_model_exists_and_is_centralized():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "MineServicesMarkerLocation" in js
    assert "createMarker" in js
    assert "placeMarker" in js
    assert "setMarkerLocation" in js
    assert "updateMarker" in js
    assert "removeMarker" in js
    assert "getMarker" in js
    assert "listMarkers" in js
    assert "getVisibleMarkers" in js
    assert "clearMarkers" in js
    assert "renderMarkers" in js
    assert "projectCoordinate(marker.easting,marker.northing,marker.elevation)" in js
    assert "map-marker-layer" in js


def test_stage20_marker_location_contract_has_all_domain_types():
    js = MARKER_JS.read_text(encoding="utf-8")

    for marker_type in (
        "HSE",
        "ASSET",
        "FACILITY",
        "WORKFRONT",
        "STOCKPILE",
        "DISPOSAL",
        "DRAINAGE",
        "WORKSHOP",
        "OTHER",
    ):
        assert "'%s'" % marker_type in js


def test_stage20_marker_location_type_definitions_are_centralized():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "TYPE_DEFINITIONS" in js
    assert "getMarkerTypeDefinition" in js
    assert "listMarkerTypeDefinitions" in js
    assert "category:'HSE'" in js
    assert "category:'Asset / Equipment'" in js
    assert "category:'Facility'" in js
    assert "category:'WorkFront'" in js
    assert "category:'Stockpile'" in js
    assert "category:'Disposal'" in js
    assert "category:'Drainage'" in js
    assert "category:'Workshop'" in js
    assert "category:'Other'" in js


def test_stage20_marker_location_domain_links_are_centralized():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "DOMAIN_LINK_DEFINITIONS" in js
    assert "HSE:'HSE'" in js
    assert "ASSET:'Equipment'" in js
    assert "WORKFRONT:'WorkFront'" in js
    assert "FACILITY:'Facility'" in js
    assert "getDomainLinkDefinition" in js
    assert "listDomainLinkDefinitions" in js


def test_stage20_marker_location_domain_link_api_is_reference_only():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "function setMarkerSource(markerId, sourceEntity, sourceId)" in js
    assert "function getMarkerSource(markerId)" in js
    assert "function resolveMarkerLink(markerId)" in js
    assert "Marker domain link requires source_entity and source_id" in js
    assert "source_entity:entity" in js
    assert "source_id:source" in js


def test_stage20_marker_location_domain_link_does_not_replace_spatial_coordinates():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function setMarkerSource")
    end = js.index("function getMarkerSource", start)
    link_block = js[start:end]

    assert "easting" not in link_block
    assert "northing" not in link_block
    assert "elevation" not in link_block
    assert "setMarkerLocation" not in link_block


def test_stage20_marker_location_domain_spatial_adapter_requires_explicit_coordinates():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "function createDomainSpatialMarker(input)" in js
    assert "Domain spatial marker requires source_entity" in js
    assert "Domain spatial marker requires source_id" in js
    assert "Domain spatial marker requires explicit finite easting, northing, and elevation" in js
    assert "createDomainSpatialMarker:createDomainSpatialMarker" in js


def test_stage20_marker_location_domain_spatial_adapter_preserves_source_contract():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function createDomainSpatialMarker")
    end = js.index("function createHSESpatialMarker", start)
    block = js[start:end]

    assert "source_entity:entity" in block
    assert "source_id:sourceId" in block
    assert "easting:input.easting" in block
    assert "northing:input.northing" in block
    assert "elevation:input.elevation" in block
    assert "DOMAIN_LINK_DEFINITIONS[markerType]" in block
    assert "location" not in block.lower()


def test_stage20_marker_location_domain_spatial_adapter_maps_equipment_and_workfront():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "ASSET:'Equipment'" in js
    assert "WORKFRONT:'WorkFront'" in js


def test_stage20_marker_location_type_icons_are_centralized():
    js = MARKER_JS.read_text(encoding="utf-8")
    for marker_type, symbol in (
        ("HSE", "⚠"),
        ("ASSET", "◆"),
        ("FACILITY", "⌂"),
        ("WORKFRONT", "▦"),
        ("STOCKPILE", "▲"),
        ("DISPOSAL", "▼"),
        ("DRAINAGE", "≋"),
        ("WORKSHOP", "⚙"),
        ("OTHER", "•"),
    ):
        assert "visual_symbol:'%s'" % symbol in js
    assert "map-location-marker__icon" in js
    assert "icon.textContent=typeDefinition.visual_symbol" in js
    assert "label.textContent=marker.label" in js


def test_stage20_marker_location_rendering_uses_central_type_definition():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "el.dataset.markerType=marker.marker_type" in js
    assert "var typeDefinition=getMarkerTypeDefinition(marker.marker_type)" in js
    assert "el.dataset.markerCategory=typeDefinition.category" in js


def test_stage20_marker_location_contract_has_spatial_and_domain_fields():
    js = MARKER_JS.read_text(encoding="utf-8")

    for field in (
        "marker_id",
        "marker_type",
        "label",
        "easting",
        "northing",
        "elevation",
        "source_entity",
        "source_id",
        "status",
    ):
        assert field in js

    assert "Marker coordinates must contain finite easting, northing, and elevation" in js
    assert "Marker location must contain finite easting, northing, and elevation" in js
    assert "setMarkerLocation(markerId,easting,northing,elevation)" in js


def test_stage20_marker_location_visibility_is_non_destructive():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "setMarkerVisibility" in js
    assert "getMarkerVisibility" in js
    assert "showAllMarkers" in js
    assert "hideAllMarkers" in js
    assert "visibility[normalized]=!!visible" in js
    assert "delete markers" in js
    assert "getVisibleMarkers" in js


def test_stage20_marker_location_visibility_filter_supports_all_none_and_multi_select():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "getVisibilityState" in js
    assert "setMarkerVisibilityFilter" in js
    assert "Marker visibility filter must be an array of marker types" in js
    assert "selected_types:selected" in js
    assert "all:selected.length===TYPES.length" in js
    assert "none:selected.length===0" in js


def test_stage20_marker_location_visibility_filter_reuses_type_validation():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "selected[normalizeType(type)]=true" in js
    assert "visibility[type]=selected[type]===true" in js


def test_stage20_marker_location_visibility_actions_return_state():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "return getVisibilityState();" in js


def test_stage20_marker_location_selection_is_id_based_and_non_spatial():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "var selectedMarkerId = null;" in js
    assert "function selectMarker(markerId)" in js
    assert "selectedMarkerId=id;" in js
    assert "function getSelectedMarker()" in js
    assert "function clearSelectedMarker()" in js
    assert "function handleMarkerClick(markerElement)" in js
    assert "getAttribute('data-marker-id')" in js
    assert "var marker=selectMarker(id);" in js


def test_stage20_marker_location_selection_rejects_removed_markers():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "Cannot select a removed marker" in js
    assert "selectedMarkerId===id" in js
    assert "selectedMarkerId=null" in js


def test_stage20_marker_location_rendering_binds_selection_without_coordinate_mutation():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "addEventListener('click',function(){ handleMarkerClick(el); })" in js
    assert "el.classList.toggle('is-selected',selectedMarkerId===marker.marker_id)" in js
    assert "el.style.left=projected.x+'px'" in js
    assert "el.style.top=projected.y+'px'" in js
    assert "setMarkerLocation" in js


def test_stage20_marker_location_placement_uses_explicit_coordinates():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "return createMarker(input)" in js
    assert "easting:Number(easting)" in js
    assert "northing:Number(northing)" in js
    assert "elevation:Number(elevation)" in js


def test_stage20_marker_location_is_integrated_into_v32_overlay_layer():
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "marker-location.js" in html
    assert "marker-location.css" in html
    assert html.index("../ui/modules/map-engine/marker-location.js?v=20261013") < html.index("../ui/modules/map-engine/map-engine.js?v=20261005")


def test_stage20_marker_location_css_is_namespaced_and_ready_for_v32_overlay():
    css = MARKER_CSS.read_text(encoding="utf-8")

    assert ".map-location-marker" in css
    assert ".map-location-marker__label" in css
    assert ".map-marker-layer" in css
    assert ".map-location-marker.is-selected" in css
    assert ".map-location-marker__icon" in css
    assert ".map-location-marker__icon" in css
    assert "Loaded by V32 Stage 20 as the centralized marker overlay presentation layer." in css


def test_stage20_marker_location_has_operational_active_limits_by_type():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "var MAX_ACTIVE_MARKERS_BY_TYPE" in js
    for marker_type, limit in (
        ("HSE", 5),
        ("ASSET", 5),
        ("WORKFRONT", 5),
        ("FACILITY", 1),
        ("STOCKPILE", 3),
        ("DISPOSAL", 5),
        ("DRAINAGE", 3),
        ("WORKSHOP", 1),
        ("OTHER", 3),
    ):
        assert "%s:%s" % (marker_type, limit) in js

    assert "function getActiveMarkerCount(markerType, excludeMarkerId)" in js
    assert "function getMarkerLimit(markerType)" in js
    assert "function getMarkerCapacity(markerType)" in js
    assert "function assertMarkerCapacity(marker, excludeMarkerId)" in js
    assert "Marker Location limit reached for " in js
    assert "active spatial markers maximum" in js
    assert "getActiveMarkerCount:getActiveMarkerCount" in js
    assert "getMarkerLimit:getMarkerLimit" in js
    assert "getMarkerCapacity:getMarkerCapacity" in js


def test_stage20_marker_location_limit_applies_only_to_active_spatial_markers():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function getActiveMarkerCount")
    end = js.index("function createMarker", start)
    block = js[start:end]
    assert "marker.status==='ACTIVE'" in block
    assert "Math.max(0,limit-active)" in block

    start = js.index("function assertMarkerCapacity")
    end = js.index("function createMarker", start)
    block = js[start:end]
    assert "if(marker.status!=='ACTIVE')return;" in block


def test_stage20_marker_location_ui_surfaces_capacity_before_add():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "refreshMarkerLocationCapacityMessage" in js
    assert "spatial markers: '+capacity.active+'/'+capacity.limit+' active" in js
    assert "Batas tercapai; nonaktifkan/hapus marker spatial untuk membuat lokasi baru." in js
    assert "refreshMarkerLocationCapacityMessage();" in js


def test_stage20_marker_location_rejects_duplicate_active_domain_source():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "function findActiveMarkerBySource(sourceEntity, sourceId, excludeMarkerId)" in js
    assert "marker.source_entity===entity && marker.source_id===source" in js
    assert "Spatial marker already assigned to " in js
    assert "findActiveMarkerBySource(marker.source_entity,marker.source_id,excludeMarkerId)" in js
    assert "findActiveMarkerBySource:findActiveMarkerBySource" in js


def test_stage20_marker_location_duplicate_source_check_ignores_inactive_and_removed_markers():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function findActiveMarkerBySource")
    end = js.index("function assertMarkerCapacity", start)
    block = js[start:end]
    assert "marker.status==='ACTIVE'" in block
    assert "ids[i]!==exclude" in block
