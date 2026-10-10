from pathlib import Path


ROOT = Path(__file__).parents[1]
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"
HSE_JS = ROOT / "ui" / "modules" / "hse" / "hse.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html"


def test_stage20_hse_spatial_record_uses_central_marker_model():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "function createHSESpatialMarker(input)" in js
    assert "marker_type:'HSE'" in js
    assert "source_entity:'HSE'" in js
    assert "source_id:hseId" in js
    assert "return createMarker" in js


def test_stage20_hse_spatial_record_requires_hse_id():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function createHSESpatialMarker")
    end = js.index("function resolveDomainSpatialLink", start)
    block = js[start:end]

    assert "HSE spatial marker requires hse_id" in block
    assert "String(input.hse_id||'').trim()" in block


def test_stage20_hse_spatial_record_keeps_coordinates_explicit():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function createHSESpatialMarker")
    end = js.index("function resolveDomainSpatialLink", start)
    block = js[start:end]

    assert "easting:input.easting" in block
    assert "northing:input.northing" in block
    assert "elevation:input.elevation" in block
    assert "source_id:hseId" in block


def test_stage20_hse_spatial_record_does_not_duplicate_hse_domain_fields():
    js = MARKER_JS.read_text(encoding="utf-8")

    start = js.index("function createHSESpatialMarker")
    end = js.index("function resolveDomainSpatialLink", start)
    block = js[start:end]

    for field in (
        "event_date",
        "domain",
        "event_type",
        "severity",
        "description",
        "closed_at",
    ):
        assert field not in block

    assert "status:input.status" in block
    assert "status" not in block.replace("status:input.status", "")


def test_stage20_hse_spatial_record_can_resolve_by_hse_id():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "function findMarkersBySource(sourceEntity, sourceId)" in js
    assert "marker.source_entity===entity" in js
    assert "marker.source_id===source" in js
    assert "function listHSESpatialMarkers(hseId)" in js
    assert "return findMarkersBySource('HSE',hseId)" in js


def test_stage20_hse_spatial_record_exports_central_api():
    js = MARKER_JS.read_text(encoding="utf-8")

    assert "createHSESpatialMarker:createHSESpatialMarker" in js
    assert "findMarkersBySource:findMarkersBySource" in js
    assert "listHSESpatialMarkers:listHSESpatialMarkers" in js


def test_stage20_hse_spatial_record_preserves_existing_hse_runtime_domain():
    hse = HSE_JS.read_text(encoding="utf-8")

    assert "entity:'HSE'" in hse
    assert "operation:'READ',entity:'HSE'" in hse
    assert "operation:'CREATE',entity:'HSE'" in hse
    assert "operation:'UPDATE',entity:'HSE'" in hse
    assert "operation:'DELETE',entity:'HSE'" in hse


def test_stage20_hse_spatial_record_is_integrated_through_central_marker_overlay():
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "marker-location.js" in html
    assert "marker-location.css" in html
    assert "../ui/modules/map-engine/marker-location.js?v=20261017" in html
    assert "../ui/modules/map-engine/marker-location.css?v=20261013" in html

