from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER_JS = (ROOT / "ui" / "modules" / "map-engine" / "marker-location.js").read_text(encoding="utf-8")
ARTIFACT = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")


def test_marker_location_migrates_existing_browser_markers_into_a3():
    assert "lithosite-mine-services-active-markers-v1" in MARKER_JS
    assert "async function initializeRuntimeMarkerPersistence()" in MARKER_JS
    assert "var stored=await readRuntimeMarkers();" in MARKER_JS
    assert "var localRows=listMarkers();" in MARKER_JS
    assert "if(!storedById[String(row.marker_id)])merged.push(row);" in MARKER_JS
    assert "migrated '+writeReport.created+' marker(s) from browser storage." in MARKER_JS


def test_marker_location_crud_is_mirrored_to_runtime_mapmarker():
    for operation in (
        "operation:'READ',entity:'MapMarker'",
        "operation:'CREATE',entity:'MapMarker',row:marker",
        "operation:'UPDATE',entity:'MapMarker',entity_id:marker.marker_id,patch:marker",
        "operation:'DELETE',entity:'MapMarker',entity_id:existingId",
    ):
        assert operation in MARKER_JS
    assert "queueRuntimeMarkerSync(listMarkers());" in MARKER_JS
    assert "queueRuntimeMarkerSync([]);" in MARKER_JS


def test_marker_location_keeps_browser_data_when_runtime_sync_fails():
    assert "Browser marker data was retained." in MARKER_JS
    assert "Existing browser markers were retained." in MARKER_JS
    assert "runtimeMarkerSyncReady=false;" in MARKER_JS


def test_marker_location_uses_a_fresh_script_cache_key():
    assert "marker-location.js?v=20261017" in ARTIFACT
    assert "../ui/modules/map-engine/marker-location.js?v=20261017" in ARTIFACT
