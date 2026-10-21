import subprocess
from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
KPI_ENGINE = ROOT / "ui" / "modules" / "reports" / "kpi-engine.js"
FOUNDATION = ROOT / "ui" / "modules" / "reports" / "kpi-foundation.js"
ADAPTER = ROOT / "src" / "mine_services" / "adapter.py"
RUNTIME = ROOT / "src" / "mine_services" / "runtime.py"
SERVER = ROOT / "desktop-host" / "server.py"
BAT = ROOT / "desktop-host" / "start-mine-services.bat"


def test_stage23_artifact_wires_foundation():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "kpi-foundation.js?v=20261022-shift-pair-1800-0600-2" in html
    assert "reports.css?v=20261012-cascade-owner-17" in html
    assert 'class="report-body"' in html
    assert "report-operational-panel" in html
    assert 'id="equipmentKpiRows"' in html
    assert 'id="reportsFinalizeKpi"' in html
    assert 'id="reportsKpiDate"' in html
    assert "Day 06:00–18:00 (rest 12:00–13:00) + Night 18:00–06:00 next day (rest 00:00–01:00)" in html
    assert "TB-PROJECT-DAY-0700-1800" not in html


def test_stage23_foundation_contracts():
    js = FOUNDATION.read_text(encoding="utf-8")
    for term in (
        "V35-KPI-FOUNDATION-E2E-0.1",
        "buildEquipmentTimeline",
        "NIGHT_BASELINE",
        "DEFAULT_SHIFT_PAIR",
        "TIME_BASELINE_PAIRS",
        "TB-PROJECT-NIGHT-1800-0600",
        "TB-PROJECT-PAIR-0600-0600",
        "shiftAnchorDate",
        "collectShiftEntries",
        "calculateEquipment",
        "calculateFleet",
        "buildSnapshot",
        "sourceVersion",
        "PROJECT_DEFAULT",
    ):
        assert term in js


def test_stage23_kpi_engine_allows_pa_ua_while_eu_pending():
    js = KPI_ENGINE.read_text(encoding="utf-8")
    assert "requireEffectiveness: false" in js
    assert "config.requireEffectiveness" in js


def test_stage23_runtime_dispatch():
    adapter = ADAPTER.read_text(encoding="utf-8")
    runtime = RUNTIME.read_text(encoding="utf-8")
    assert '"FINALIZE_KPI"' in adapter
    assert '"READ_KPI_SNAPSHOTS"' in adapter
    assert "def finalize_kpi" in runtime
    assert "def read_kpi_snapshots" in runtime


def test_stage23_default_entry():
    server = SERVER.read_text(encoding="utf-8")
    bat = BAT.read_text(encoding="utf-8")
    assert "/Artifacts/Mine-Services-Operations.html" in server
    assert "/Artifacts/Mine-Services-Operations.html" in bat


def test_kpi_foundation_javascript_regressions():
    result = subprocess.run(
        ["node", str(ROOT / "tests" / "test_kpi_foundation.js")],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "KPI FOUNDATION TEST PASS" in result.stdout
