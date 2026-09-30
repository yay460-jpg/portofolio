from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v28-STAGE16.html"
SHELL = ROOT / "ui" / "shared" / "shell-navigation-v28.js"
MODULE = ROOT / "ui" / "modules" / "reports" / "reports.js"


def test_stage16_reports_artifact_contract():
    text = ARTIFACT.read_text(encoding="utf-8")
    assert 'id="reportsScreen"' in text
    assert "Reports" in text
    assert "../ui/modules/reports/reports.js" in text
    assert "Operational Data Summary" in text


def test_stage16_reports_shell_contract():
    text = SHELL.read_text(encoding="utf-8")
    assert "Reports: 'reportsScreen'" in text
    assert "'Reports'" in text
    assert "lithosite-v28-active-screen" in text


def test_stage16_reports_runtime_contract():
    text = MODULE.read_text(encoding="utf-8")
    assert "LithositeRuntimeClient" in text
    for entity in ("Operations", "Equipment", "WorkFront", "Maintenance", "Issues", "Plans", "HSE"):
        assert "operation:'READ'" in text
        assert f"entity:{entity}" in text
    assert "read-only" in text
    assert "LithositeReports" in text
