from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT
REPORTS = BASE / "ui/modules/reports/reports.js"
ENGINE = BASE / "ui/modules/reports/report-engine.js"
VALIDATION = BASE / "ui/modules/reports/report-validation.js"
SNAPSHOT = BASE / "ui/modules/reports/report-snapshot.js"
PDF = BASE / "ui/modules/reports/report-pdf.js"
HISTORY = BASE / "ui/modules/reports/report-history.js"
ARTIFACT = BASE / "Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v38-STAGE27.html"

def read(path):
    return path.read_text(encoding="utf-8")

def test_stage32_validation_and_lineage():
    text = read(VALIDATION)
    assert "LithositeReportValidation" in text
    assert "VALIDATION REQUIRED" in text
    assert "kpi_snapshot_id" in text
    assert "source_snapshot_id" in text
    assert "baseline" in text
    assert "generated_from" in text
    reports = read(REPORTS)
    assert "LithositeReportValidation.apply" in reports

def test_stage33_immutable_snapshot():
    text = read(SNAPSHOT)
    for token in ("immutable:true", "snapshot_id", "fingerprint", "SHA-256", "deepFreeze"):
        assert token in text
    assert "LithositeReportSnapshot" in text

def test_stage34_report_center_issue_flow():
    html = read(ARTIFACT)
    reports = read(REPORTS)
    for token in ("reportCenterValidate", "reportCenterIssue", "reportCenterHistory"):
        assert token in html
    assert "Report issued" in reports
    assert "LithositeReportHistory.save" in reports

def test_stage35_pdf_renderer():
    text = read(PDF)
    assert "LithositePdfRenderer" in text
    assert "window.print" in text
    reports = read(REPORTS)
    assert "LithositePdfRenderer.render" in reports

def test_stage36_report_history():
    text = read(HISTORY)
    assert "LithositeReportHistory" in text
    assert "lithosite.mine-services.v38.report-history" in text
    assert "Only immutable issued snapshots" in text

def test_artifact_stage_order():
    html = read(ARTIFACT)
    order = [
        "daily-report.js?v=20261007",
        "weekly-report.js?v=20261007",
        "monthly-report.js?v=20261010",
        "report-engine.js?v=20261007",
        "report-validation.js?v=20261007",
        "report-snapshot.js?v=20261007",
        "report-pdf.js?v=20261007",
        "report-history.js?v=20261007",
        "reports.js?v=20261010",
    ]
    positions = [html.index(value) for value in order]
    assert positions == sorted(positions)

def test_report_preview_uses_specialized_report_contract_fields():
    reports = read(REPORTS)
    monthly = read(BASE / "ui/modules/reports/monthly-report.js")
    assert "model.total_source_records" in reports
    assert "model.total_records" in reports
    assert "const totalRecords=" in reports
    assert "equipment:Array.isArray(k.equipment)?k.equipment:[]" in reports
    assert "equipment:Array.isArray(k.equipment)?k.equipment:[]" in monthly

def test_release_readiness_contract():
    for path in (ENGINE, VALIDATION, SNAPSHOT, PDF, HISTORY, REPORTS):
        assert path.exists()
        assert read(path).strip()
    reports = read(REPORTS)
    assert "function bind()" in reports
    assert "LithositeDataSync.register('Reports',load)" in reports
