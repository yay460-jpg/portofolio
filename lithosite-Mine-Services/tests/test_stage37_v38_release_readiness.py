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
        "daily-report.js?v=20261010",
        "weekly-report.js?v=20261007",
        "monthly-report.js?v=20261010",
        "report-engine.js?v=20261007",
        "report-validation.js?v=20261007",
        "report-snapshot.js?v=20261007",
        "report-pdf.js?v=20261007",
        "report-history.js?v=20261007",
        "reports.js?v=20261012",
    ]
    positions = [html.index(value) for value in order]
    assert positions == sorted(positions)

def test_report_kpi_uses_selected_period_scope():
    reports = read(REPORTS)
    assert "function reportKpiForPeriod(period)" in reports
    assert "calculateFleetAllDates(payload)" in reports
    assert "calculateFleet({...payload,date:period.start})" in reports
    assert "const k=reportKpiForPeriod(effectivePeriod)||state.kpi;" in reports

def test_report_preview_uses_specialized_report_contract_fields():
    reports = read(REPORTS)
    monthly = read(BASE / "ui/modules/reports/monthly-report.js")
    assert "model.total_source_records" in reports
    assert "model.total_records" in reports
    assert "const totalRecords=" in reports
    assert "equipment:Array.isArray(k?.equipment)?k.equipment:[]" in reports
    assert "validation_issues:Array.isArray(k.validation_issues)?k.validation_issues.slice():[]" in monthly
    daily = read(BASE / "ui/modules/reports/daily-report.js")
    assert "equipment:Array.isArray(k.equipment)?k.equipment:[]" in monthly
    assert "equipment:Array.isArray(k.equipment)?k.equipment:[]" in daily
    assert "totalRecords+' records</span>" in reports

def test_release_readiness_contract():
    for path in (ENGINE, VALIDATION, SNAPSHOT, PDF, HISTORY, REPORTS):
        assert path.exists()
        assert read(path).strip()
    reports = read(REPORTS)
    assert "function bind()" in reports
    assert "LithositeDataSync.register('Reports',load)" in reports

def test_report_period_contract_and_notice():
    reports = read(REPORTS)
    assert "if(type==='WEEKLY')periodEnd.setDate(periodStart.getDate()+6);" in reports
    assert "if(periodStart.getDate()!==1)return null;" in reports
    assert "periodEnd.setMonth(periodStart.getMonth()+1,0);" in reports
    assert "Monthly Report requires the report date to be the 1st day of the month." in reports
    assert "No data is available for the selected report period." in reports
    assert "report_data_status:requestedRows>0?'REQUESTED_PERIOD':'NO_DATA_FOR_PERIOD'" in reports
    html = read(ARTIFACT)
    assert 'id="reportCenterNotice"' in html
    css = read(BASE / "ui/modules/reports/reports.css")
    assert ".report-center-notice" in css
