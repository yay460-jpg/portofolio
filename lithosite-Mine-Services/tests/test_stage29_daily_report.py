from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "ui" / "modules" / "reports" / "reports.js"
DAILY = ROOT / "ui" / "modules" / "reports" / "daily-report.js"
ENGINE = ROOT / "ui" / "modules" / "reports" / "report-engine.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v38-STAGE27.html"


def test_daily_report_engine_contract():
    text = DAILY.read_text(encoding="utf-8")
    for token in (
        "LithositeDailyReport",
        "buildDailyReport",
        "Executive Summary",
        "Work / Task Completed",
        "Equipment Status",
        "Work Front Status",
        "HSE Events / Safety Notes",
        "Maintenance / Downtime",
        "Material Movement",
        "Issues and Abnormalities",
        "Site Map / Spatial Activities",
        "KPI Summary",
        "Outstanding / Carry-over Tasks",
        "Supporting Evidence / References",
        "VALIDATION REQUIRED",
    ):
        assert token in text


def test_daily_report_is_read_only():
    text = DAILY.read_text(encoding="utf-8")
    assert "localStorage" not in text
    assert "RuntimeAdapter" not in text
    # Internal validation arrays may use push(); the engine does not write
    # to localStorage, RuntimeAdapter, or source-domain records.
    assert "source_data" in text
    assert ".setItem(" not in text
    assert ".removeItem(" not in text


def test_daily_report_uses_formal_report_engine():
    reports = REPORTS.read_text(encoding="utf-8")
    engine = ENGINE.read_text(encoding="utf-8")
    assert "LithositeDailyReport.buildDailyReport" in reports
    assert "LithositeReportEngine.buildReportModel" in reports
    assert "function buildReportModel" in engine
    assert "STATUS.VALIDATION_REQUIRED" in engine


def test_v38_artifact_wires_daily_report_engine():
    html = ARTIFACT.read_text(encoding="utf-8")
    daily = '<script src="../ui/modules/reports/daily-report.js?v=20261007"></script>'
    formal = '<script src="../ui/modules/reports/report-engine.js?v=20261007"></script>'
    assert daily in html
    assert formal in html
    assert html.index(daily) < html.index(formal)
