from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html"
SHELL = ROOT / "ui" / "shared" / "shell-navigation.js"
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
    assert "lithosite-active-screen" in text


def test_stage16_reports_runtime_contract():
    text = MODULE.read_text(encoding="utf-8")
    assert "LithositeRuntimeClient" in text
    assert "for(const entity of entities)" in text
    assert "rc.request({operation:'READ',entity})" in text
    for entity in ("Operations", "Equipment", "WorkFront", "Maintenance", "Issues", "Plans", "HSE"):
        assert entity in text
    assert "read-only" in text
    assert "LithositeReports" in text
