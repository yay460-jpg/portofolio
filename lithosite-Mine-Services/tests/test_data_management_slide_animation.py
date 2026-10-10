from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
CSS = ROOT / "ui" / "modules" / "data-management" / "data-management.css"
JS = ROOT / "ui" / "modules" / "data-management" / "data-management.js"


def test_data_management_modal_uses_slide_only_motion():
    css = CSS.read_text(encoding="utf-8")
    assert "#stage15DataModal.show:not(.is-closing) .dm-card" in css
    assert "#stage15DataModal.show.is-closing .dm-card" in css
    assert "@keyframes dataManagementSlideIn" in css
    assert "@keyframes dataManagementSlideOut" in css
    assert "transform:translateX(-24px)" in css
    assert "opacity:" not in css
    assert "prefers-reduced-motion:reduce" in css


def test_data_management_close_waits_for_slide_out_and_can_be_cancelled():
    js = JS.read_text(encoding="utf-8")
    assert "modal.classList.add('is-closing')" in js
    assert "event.animationName !== 'dataManagementSlideOut'" in js
    assert "finishClose(modal, token)" in js
    assert "closeToken += 1" in js
    assert "clearTimeout(closeTimer)" in js


def test_active_artifact_loads_updated_data_management_stylesheet():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "data-management.css?v=20261011-slide" in html
