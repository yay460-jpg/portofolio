from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v34-STAGE22.html"
REPORTS_JS = ROOT / "ui" / "modules" / "reports" / "reports.js"


def test_stage22_reports_kpi_workspace_contract():
    text = ARTIFACT.read_text(encoding="utf-8")
    assert 'data-screen="Reports"' in text
    assert '<div class="nav-text">Reports &amp; KPI</div>' in text
    assert '<h1>Reports &amp; KPI</h1>' in text
    assert 'Equipment KPI' in text
    assert 'PA — Physical Availability' in text
    assert 'UA — Utilization of Availability' in text
    assert 'EU — Effective Utilization' in text
    assert 'Available / Scheduled' in text
    assert 'Used / Available' in text
    assert 'Formula final pending SOP' in text
    assert 'Pending event/time history' in text
    assert 'V34 learning baselines' in text
    assert 'lithosite-v31-active-screen' not in text


def test_stage22_reports_kpi_does_not_create_a_separate_sidebar_screen():
    text = ARTIFACT.read_text(encoding="utf-8")
    assert text.count('data-screen="Reports"') == 1
    assert 'data-screen="KPI"' not in text
    assert 'data-screen="Reports &amp; KPI"' not in text


def test_stage22_reports_runtime_remains_read_only():
    text = REPORTS_JS.read_text(encoding="utf-8")
    assert "LithositeRuntimeClient" in text
    assert "operation:'READ'" in text
    assert "read-only" in text
    assert "LithositeReports" in text
