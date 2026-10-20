from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER_JS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.js"
MARKER_CSS = ROOT / "ui" / "modules" / "map-engine" / "marker-location.css"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_marker_location_backup_controls_use_shared_lithosite_button_contract():
    js = MARKER_JS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert '<label class="marker-location-backup-select-label" for="markerLocationBackupSelect">Select backup</label>' in js
    assert 'id="markerLocationBackupSelect" class="marker-location-backup-select"' in js
    assert 'id="markerLocationBackupClose">Close</button>' in js
    assert 'id="markerLocationBackupRestore">Restore Selected</button>' in js
    assert 'class="control mini secondary" id="markerLocationBackupClose"' in js
    assert 'class="control mini primary" id="markerLocationBackupRestore"' in js
    assert "topo3d-modal-button" not in js
    assert 'marker-location.css?v=20261012-backup-controls' in html


def test_marker_location_backup_select_styles_have_one_css_owner_and_no_inline_style():
    js = MARKER_JS.read_text(encoding="utf-8")
    css = MARKER_CSS.read_text(encoding="utf-8")

    assert js.count('class="marker-location-backup-select-label"') == 1
    assert js.count('class="marker-location-backup-select"') == 1
    assert css.count(".marker-location-backup-select-label{") == 1
    assert css.count(".marker-location-backup-select{") == 1
    assert css.count(".marker-location-backup-footer{") == 1
    assert "style=\"display:block;margin-bottom:4px;color:#93c5fd\"" not in js
    assert "style=\"width:100%;height:30px;box-sizing:border-box;padding:0 8px" not in js
    assert ".marker-location-backup-actions{" in css
    assert ".marker-location-backup-footer{" in css
