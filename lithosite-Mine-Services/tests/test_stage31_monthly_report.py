from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "ui/modules/reports/monthly-report.js"
REPORTS = ROOT / "ui/modules/reports/reports.js"
ARTIFACT = ROOT / "Artifacts/Mine-Services-Operations.html"

def read(path):
    return path.read_text(encoding="utf-8")

def test_monthly_engine_contract():
    text = read(ENGINE)
    for value in [
        "V38 Stage 31",
        "buildMonthlyReport",
        "Management Executive Summary",
        "Monthly KPI",
        "Target vs Actual",
        "Equipment Performance",
        "Work Front Progress",
        "HSE Performance",
        "Maintenance / Downtime",
        "Material Movement",
        "Major Issues / Events",
        "Recurring Problems",
        "Outstanding Actions",
        "Trend vs Previous Month",
        "Performance Highlights",
        "Management Attention / Decision Required",
        "Recommendations",
        "Appendix / Evidence",
        "VALIDATION REQUIRED",
        "comparison_available:false",
        "global.LithositeMonthlyReport"
    ]:
        assert value in text

def test_monthly_engine_is_read_only():
    text = read(ENGINE)
    assert "localStorage" not in text
    assert "RuntimeAdapter" not in text
    # Internal validation array construction may use push(); no runtime/source persistence is performed.\n    assert ".setItem(" not in text\n    assert ".removeItem(" not in text\n    assert "source_data" in text

def test_reports_integrates_monthly_engine():
    text = read(REPORTS)
    assert "global.LithositeMonthlyReport" in text
    assert "buildMonthlyReport" in text
    assert "report_type:'MONTHLY'" in text
    assert "DRAFT-MONTHLY-" in text

def test_artifact_wires_monthly_before_formal_engine():
    text = read(ARTIFACT)
    monthly = '<script src="../ui/modules/reports/monthly-report.js?"></script>'
    formal = '<script src="../ui/modules/reports/report-engine.js?"></script>'
    assert monthly in text
    assert formal in text
    assert text.index(monthly) < text.index(formal)
