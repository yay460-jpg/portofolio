from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "ui" / "modules" / "map-engine" / "map-engine.css"
JS = ROOT / "ui" / "modules" / "map-engine" / "map-engine.js"
HTML = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v31-STAGE19.html"

def test_map_host_assets_exist():
    assert CSS.exists()
    assert JS.exists()

def test_map_host_isolated():
    source = CSS.read_text(encoding="utf-8")
    assert "ms-map-engine" in source
    assert "#operationsScreen" not in source
    assert "#equipmentScreen" not in source

def test_map_host_interaction_hooks():
    source = JS.read_text(encoding="utf-8")
    assert "lithosite:map-action" in source
    assert "lithosite:map-feature-select" in source

def test_stage19_artifact_remains_unchanged_for_this_stage():
    assert HTML.exists()
    source = HTML.read_text(encoding="utf-8")
    assert 'class="map"' in source
    assert "OFFLINE MAP" in source
