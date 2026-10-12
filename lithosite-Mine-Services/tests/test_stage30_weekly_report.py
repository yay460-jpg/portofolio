from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
WEEKLY=ROOT/"ui"/"modules"/"reports"/"weekly-report.js"
REPORTS=ROOT/"ui"/"modules"/"reports"/"reports.js"
ARTIFACT=ROOT/"Artifacts"/"Mine-Services-Operations.html"

def test_weekly_contract():
    t=WEEKLY.read_text(encoding="utf-8")
    for token in ("LithositeWeeklyReport","buildWeeklyReport","Executive Summary","Planned vs Actual","Equipment Performance","Work Front Progress","HSE Summary","Maintenance and Downtime Analysis","Material Movement Summary","Issues and Recurring Issues","Outstanding Actions","KPI Trend","Top Management Concerns","Recommended Actions","VALIDATION REQUIRED"):
        assert token in t

def test_weekly_integration():
    r=REPORTS.read_text(encoding="utf-8")
    h=ARTIFACT.read_text(encoding="utf-8")
    assert "LithositeWeeklyReport.buildWeeklyReport" in r
    assert 'weekly-report.js?' in h
    assert h.index('weekly-report.js?') < h.index('reports.js?')

def test_weekly_is_read_only():
    t=WEEKLY.read_text(encoding="utf-8")
    assert "localStorage" not in t
    # Internal validation array construction is allowed; no runtime/source
    # persistence is performed by the Weekly engine.
    assert "source_data" in t
    assert ".setItem(" not in t
    assert ".removeItem(" not in t
