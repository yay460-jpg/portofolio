import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeInterface
from mine_services.kpi_snapshot_store import KPIHistoryStore
from test_stage23_kpi_snapshot import snapshot


def make_runtime(tmp_path):
    runtime = RuntimeInterface(application=ApplicationService(PersistenceStore()))
    runtime._kpi_history = KPIHistoryStore(tmp_path / "KPI-History.json")
    return runtime


def test_read_kpi_snapshots_returns_detached_nested_data(tmp_path):
    runtime = make_runtime(tmp_path)
    result = runtime.finalize_kpi(snapshot(81.8, 77.7, "V-KPI-READ-COPY"))
    assert result["status"] == "COMMITTED"

    exposed = runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04")
    exposed[0]["result"]["PA"]["value"] = -999
    exposed[0]["policy"]["id"] = "TAMPERED"

    stored = runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04")
    assert stored[0]["result"]["PA"]["value"] == 81.8
    assert stored[0]["policy"]["id"] == "V34-PA-UA-BASELINE"
