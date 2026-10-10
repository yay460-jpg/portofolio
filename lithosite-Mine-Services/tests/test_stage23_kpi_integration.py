from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v38-STAGE27.html"
KPI_ENGINE = ROOT / "ui" / "modules" / "reports" / "kpi-engine.js"
FOUNDATION = ROOT / "ui" / "modules" / "reports" / "kpi-foundation.js"
ADAPTER = ROOT / "src" / "mine_services" / "adapter.py"
RUNTIME = ROOT / "src" / "mine_services" / "runtime.py"
SERVER = ROOT / "desktop-host" / "server.py"
BAT = ROOT / "desktop-host" / "start-mine-services.bat"


def test_stage23_artifact_wires_foundation():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "kpi-foundation.js?v=20261006" in html
    assert "reports.css?v=20261012" in html
    assert 'class="report-body"' in html
    assert "report-operational-panel" in html
    assert 'id="equipmentKpiRows"' in html
    assert 'id="reportsFinalizeKpi"' in html
    assert 'id="reportsKpiDate"' in html


def test_stage23_foundation_contracts():
    js = FOUNDATION.read_text(encoding="utf-8")
    for term in (
        "V35-KPI-FOUNDATION-E2E-0.1",
        "buildEquipmentTimeline",
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
    assert "v39-STAGE28.html" in server
    assert "v39-STAGE28.html" in bat
