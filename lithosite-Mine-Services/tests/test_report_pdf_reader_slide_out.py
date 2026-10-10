from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
CSS = ROOT / "ui" / "modules" / "reports" / "reports.css"
JS = ROOT / "ui" / "modules" / "reports" / "reports.js"


def test_report_pdf_reader_uses_slide_down_only_on_close():
    css = CSS.read_text(encoding="utf-8")
    motion = css.split("/* Selective report-reader motion:", 1)[1]
    assert "#reportsScreen #reportPdfReaderModal.is-closing .user-guide-reader-dialog" in motion
    assert "@keyframes reportPdfReaderSlideOut" in motion
    assert "from{transform:translateY(0)}" in motion
    assert "to{transform:translateY(36px)}" in motion
    assert "opacity:" not in motion
    assert "prefers-reduced-motion:reduce" in motion


def test_report_pdf_reader_opens_instantly_and_closes_after_motion():
    js = JS.read_text(encoding="utf-8")
    generate = js[js.index("async function generatePdf"):js.index("function bind()", js.index("async function generatePdf"))]
    close = js[js.index("const closeReportPdfReader="):js.index("if(reportPdf)reportPdf.onclick", js.index("const closeReportPdfReader="))]
    assert "resetReportPdfReaderClose(reader.modal)" in generate
    assert "reader.modal.classList.add('show')" in generate
    assert "modal.classList.add('is-closing')" in close
    assert "reportPdfReaderSlideOut" in close
    assert "classList.remove('show','is-closing')" in close
    assert "reportPdfReaderFrame.src='about:blank'" in close
    assert "_reportPdfCloseTimer" in close


def test_active_artifact_uses_updated_report_assets():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "reports.css?v=20261011-preview-dedupe" in html
    assert "reports.js?v=20261011-slideout" in html
