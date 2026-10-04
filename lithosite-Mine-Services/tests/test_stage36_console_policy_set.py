from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def test_stage36_console_policy_set_surface():
    html = read("Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v36-STAGE25.html")
    reports = read("ui/modules/reports/reports.js")
    foundation = read("ui/modules/reports/kpi-foundation.js")

    assert 'id="reportsConsoleModal"' in html
    assert 'id="reportsTimeBaseline"' in html
    assert 'id="reportsEUDenominator"' in html
    assert 'id="reportsEffectiveTimeRule"' in html
    assert "Apply Policy Set" in html

    assert "TIME_BASELINES" in reports
    assert "EU_DENOMINATOR_OPTIONS" in reports
    assert "EFFECTIVE_RULE_OPTIONS" in reports
    assert "renderConsolePolicy" in reports

    assert "TIME_BASELINES" in foundation
    assert "effectiveTimeRule" in foundation
    assert "EU-EFFECTIVE-OVER-SCHEDULED" in foundation
    assert "EU-EFFECTIVE-OVER-AVAILABLE" in foundation
    assert "STANDARD_CYCLE" in foundation
    assert "PURE_EFFECTIVE" in foundation
