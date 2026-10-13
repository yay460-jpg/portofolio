import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeInterface
from mine_services.adapter import RuntimeAdapter
from mine_services.kpi_snapshot_store import KPIHistoryStore
from test_stage23_kpi_snapshot import snapshot


def make_adapter(tmp_path):
    runtime = RuntimeInterface(application=ApplicationService(PersistenceStore()))
    runtime._datasets.directory = tmp_path / "datasets"
    runtime._datasets.directory.mkdir(parents=True, exist_ok=True)
    runtime._kpi_history = KPIHistoryStore(tmp_path / "KPI-History.json")
    return RuntimeAdapter(runtime)


def test_save_as_dataset_rejects_reused_request_id_before_second_side_effect(tmp_path):
    adapter = make_adapter(tmp_path)

    first = adapter.handle({
        "request_id": "replay-save-as-001",
        "operation": "SAVE_AS_DATASET",
        "name": "First Review",
    })
    assert first["status"] == "SAVED_AS"

    replay_with_changed_payload = adapter.handle({
        "request_id": "replay-save-as-001",
        "operation": "SAVE_AS_DATASET",
        "name": "Second Review",
    })

    assert replay_with_changed_payload["status"] in {"DUPLICATE_REQUEST", "REJECTED"}
    assert len(list((tmp_path / "datasets").glob("*.json"))) == 1
    assert len(adapter._runtime._application.store.audit()) == 1


def test_finalize_kpi_rejects_reused_request_id_before_new_revision(tmp_path):
    adapter = make_adapter(tmp_path)

    first = adapter.handle({
        "request_id": "replay-kpi-001",
        "operation": "FINALIZE_KPI",
        "snapshot": snapshot(81.8, 77.7, "V-KPI-REPLAY-A"),
    })
    assert first["status"] == "COMMITTED"

    replay_with_changed_payload = adapter.handle({
        "request_id": "replay-kpi-001",
        "operation": "FINALIZE_KPI",
        "snapshot": snapshot(92.0, 84.0, "V-KPI-REPLAY-B"),
    })

    assert replay_with_changed_payload["status"] in {"DUPLICATE_REQUEST", "REJECTED"}
    history = adapter._runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04")
    assert len(history) == 1
    assert len(adapter._runtime._application.store.audit()) == 1
