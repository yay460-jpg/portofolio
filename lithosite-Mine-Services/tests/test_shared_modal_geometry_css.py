import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
USER_GUIDE_CSS = ROOT / "ui" / "shared" / "user-guide.css"
MODAL_SHELL_CSS = ROOT / "ui" / "shared" / "modal-shell-contract.css"
REPORTS_CSS = ROOT / "ui" / "modules" / "reports" / "reports.css"
REPORTS_JS = ROOT / "ui" / "modules" / "reports" / "reports.js"


def test_user_guide_reader_has_one_generic_geometry_owner():
    css = USER_GUIDE_CSS.read_text(encoding="utf-8")
    assert len(re.findall(r"(?m)^\\.user-guide-reader-modal\\s*\\{", css)) == 1
    assert len(re.findall(r"(?m)^\\.user-guide-reader-dialog\\s*\\{", css)) == 1
    assert "top:64px;" not in css
    assert "bottom:34px;" not in css
    assert "dynamically appended to document.body" not in css
    assert "#reportsScreen .user-guide-reader-modal{" in css
    assert "position:absolute;" in css
    assert "height:calc(100% - 56px)" in css
    assert "height:calc(100% - 28px)" in css
    assert "@media(max-width:700px)" in css


def test_pdf_reader_is_nested_in_reports_and_assets_use_updated_css():
    html = ARTIFACT.read_text(encoding="utf-8")
    reports = html.index('id="reportsScreen"')
    reader = html.index('id="reportPdfReaderModal"')
    assert reader > reports
    assert 'class="user-guide-reader-modal"' in html
    assert "user-guide.css?v=20261011-reader-geometry" in html
    js = REPORTS_JS.read_text(encoding="utf-8")
    assert "document.getElementById('reportPdfReaderModal')" in js
    assert "appendChild(" not in js


def test_report_pdf_reader_slide_down_animation_remains_intact():
    css = REPORTS_CSS.read_text(encoding="utf-8")
    motion = css.split("/* Selective report-reader motion:", 1)[1]
    assert "@keyframes reportPdfReaderSlideOut" in motion
    assert "from{transform:translateY(0)}" in motion
    assert "to{transform:translateY(36px)}" in motion
    assert "opacity:" not in motion
    assert "prefers-reduced-motion:reduce" in motion


def test_shared_modal_shell_keeps_intentional_short_viewport_overrides():
    css = MODAL_SHELL_CSS.read_text(encoding="utf-8")
    assert "max-height:calc(100vh - 64px - 34px - 24px)" in css
    assert "@media(max-height:560px)" in css
    assert "flex-basis:44px" in css
    assert "flex-basis:52px" in css
    assert "V38" not in css
    assert "@keyframes" not in css
    assert not re.search(r"(?m)^\\s*animation\\s*:", css)
