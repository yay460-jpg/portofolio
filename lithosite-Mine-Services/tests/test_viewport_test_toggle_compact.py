from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "ui" / "shared" / "viewport-test.css"
JS = ROOT / "ui" / "shared" / "viewport-test.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_temporary_monitor_toggle_uses_compact_header_geometry():
    css = CSS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;" in css
    assert ".viewport-test-toggle svg{width:14px;height:14px;display:block}" in css
    assert ".topbar .viewport-test-toggle{margin-left:8px}" in css
    assert "viewport-test.css?v=20261022-temporary-monitor-compact-1" in html


def test_temporary_monitor_toggle_keeps_its_viewport_test_behavior():
    js = JS.read_text(encoding="utf-8")

    assert "button.id='viewportTestToggle';" in js
    assert "button.setAttribute('aria-label','Enable 14-inch viewport test');" in js
    assert "button.title='Temporary 14-inch viewport test (1366 × 768)';" in js
    assert "document.body.classList.toggle('viewport-test-mode',enabled);" in js
    assert "if(event.key==='Escape'&&button.getAttribute('aria-pressed')==='true')setMode(false);" in js
