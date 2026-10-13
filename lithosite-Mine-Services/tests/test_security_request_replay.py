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
    runtime._topography.directory = tmp_path / "topography"
    runtime._topography.directory.mkdir(parents=True, exist_ok=True)
    runtime._marker_location.directory = tmp_path / "marker-location"
    runtime._marker_location.directory.mkdir(parents=True, exist_ok=True)
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


def test_load_dataset_rejects_reused_request_id_for_different_dataset(tmp_path):
    adapter = make_adapter(tmp_path)

    first_save = adapter.handle({
        "request_id": "replay-load-seed-001",
        "operation": "SAVE_AS_DATASET",
        "name": "Dataset One",
    })
    second_save = adapter.handle({
        "request_id": "replay-load-seed-002",
        "operation": "SAVE_AS_DATASET",
        "name": "Dataset Two",
    })
    assert first_save["status"] == "SAVED_AS"
    assert second_save["status"] == "SAVED_AS"

    first_load = adapter.handle({
        "request_id": "replay-load-001",
        "operation": "LOAD_DATASET",
        "name": "Dataset One",
    })
    assert first_load["status"] not in {"REJECTED", "ERROR"}

    replay_with_changed_payload = adapter.handle({
        "request_id": "replay-load-001",
        "operation": "LOAD_DATASET",
        "name": "Dataset Two",
    })

    assert replay_with_changed_payload["status"] == "REJECTED"
    assert replay_with_changed_payload["errors"][0]["code"] == "ADP-006"


def test_restore_rejects_reused_request_id_for_different_snapshot(tmp_path):
    from mine_services import SnapshotManager

    adapter = make_adapter(tmp_path)
    manager = SnapshotManager(adapter._runtime._application.store)
    first_snapshot = manager.capture(source="replay-restore-first")
    second_snapshot = manager.capture(source="replay-restore-second")

    first = adapter.handle({
        "request_id": "replay-restore-001",
        "operation": "RESTORE",
        "mode": "REPLACE_RUNTIME",
        "snapshot": first_snapshot,
    })
    assert first["status"] not in {"REJECTED", "ERROR"}

    replay_with_changed_payload = adapter.handle({
        "request_id": "replay-restore-001",
        "operation": "RESTORE",
        "mode": "REPLACE_RUNTIME",
        "snapshot": second_snapshot,
    })

    assert replay_with_changed_payload["status"] == "REJECTED"
    assert replay_with_changed_payload["errors"][0]["code"] == "ADP-006"


def test_topography_backup_rejects_reused_request_id_for_different_filename(tmp_path):
    import base64

    adapter = make_adapter(tmp_path)
    first_payload = base64.b64encode(b"LITHODTM" + (2).to_bytes(4, "little") + b"first").decode("ascii")
    second_payload = base64.b64encode(b"LITHODTM" + (2).to_bytes(4, "little") + b"second").decode("ascii")

    first = adapter.handle({
        "request_id": "replay-topo-001",
        "operation": "SAVE_TOPOGRAPHY_BACKUP",
        "filename": "first.ltdtm",
        "package_base64": first_payload,
    })
    assert first["status"] == "SAVED"

    replay_with_changed_payload = adapter.handle({
        "request_id": "replay-topo-001",
        "operation": "SAVE_TOPOGRAPHY_BACKUP",
        "filename": "second.ltdtm",
        "package_base64": second_payload,
    })

    assert replay_with_changed_payload["status"] == "REJECTED"
    assert replay_with_changed_payload["errors"][0]["code"] == "ADP-006"
    assert len(list((tmp_path / "topography").glob("*.ltdtm"))) == 1


def test_marker_location_backup_rejects_reused_request_id_for_different_package(tmp_path):
    import base64
    import json

    adapter = make_adapter(tmp_path)
    first_bytes = b"LITMARKR" + (1).to_bytes(4, "little") + json.dumps({
        "format": "LT-MARKER", "version": 1, "markers": []
    }).encode()
    second_bytes = b"LITMARKR" + (1).to_bytes(4, "little") + json.dumps({
        "format": "LT-MARKER", "version": 1, "markers": [],
        "metadata": {"source": "different"}
    }).encode()

    first = adapter.handle({
        "request_id": "replay-marker-001",
        "operation": "SAVE_MARKER_LOCATION_BACKUP",
        "filename": "first.ltmarker",
        "package_base64": base64.b64encode(first_bytes).decode("ascii"),
    })
    assert first["status"] == "SAVED"

    replay_with_changed_payload = adapter.handle({
        "request_id": "replay-marker-001",
        "operation": "SAVE_MARKER_LOCATION_BACKUP",
        "filename": "second.ltmarker",
        "package_base64": base64.b64encode(second_bytes).decode("ascii"),
    })

    assert replay_with_changed_payload["status"] == "REJECTED"
    assert replay_with_changed_payload["errors"][0]["code"] == "ADP-006"
    assert len(list((tmp_path / "marker-location").glob("*.ltmarker"))) == 1


def test_save_as_dataset_same_request_id_and_payload_returns_cached_response(tmp_path):
    adapter = make_adapter(tmp_path)
    request = {
        "request_id": "replay-save-same-001",
        "operation": "SAVE_AS_DATASET",
        "name": "Stable Review",
    }

    first = adapter.handle(dict(request))
    replay = adapter.handle(dict(request))

    assert first["status"] == "SAVED_AS"
    assert replay == first
    assert replay is not first
    assert len(list((tmp_path / "datasets").glob("*.json"))) == 1
    assert len(adapter._runtime._application.store.audit()) == 1
