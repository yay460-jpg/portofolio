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


def test_import_xlsx_rejects_reused_request_id_for_different_path(tmp_path):
    adapter = make_adapter(tmp_path)
    calls = []

    def fake_import(path):
        calls.append(path)
        return {"status": "COMMITTED", "rows_committed": 3, "errors": []}

    adapter._runtime.import_xlsx = fake_import

    first = adapter.handle({
        "request_id": "replay-import-001",
        "operation": "IMPORT_XLSX",
        "path": "first.xlsx",
    })
    conflict = adapter.handle({
        "request_id": "replay-import-001",
        "operation": "IMPORT_XLSX",
        "path": "second.xlsx",
    })

    assert first["status"] == "COMMITTED"
    assert conflict["status"] == "REJECTED"
    assert conflict["errors"][0]["code"] == "ADP-006"
    assert calls == ["first.xlsx"]


def test_import_xlsx_same_request_reuses_cached_response_copy(tmp_path):
    adapter = make_adapter(tmp_path)
    calls = []

    def fake_import(path):
        calls.append(path)
        return {"status": "COMMITTED", "rows_committed": 3, "errors": []}

    adapter._runtime.import_xlsx = fake_import
    request = {
        "request_id": "replay-import-same-001",
        "operation": "IMPORT_XLSX",
        "path": "stable.xlsx",
    }

    first = adapter.handle(dict(request))
    replay = adapter.handle(dict(request))
    replay["errors"].append({"code": "TEST-MUTATION"})

    assert first["status"] == "COMMITTED"
    assert first["errors"] == []
    assert calls == ["stable.xlsx"]


def test_import_xlsx_rejected_attempt_is_not_cached_as_success(tmp_path):
    adapter = make_adapter(tmp_path)
    calls = []

    def flaky_import(path):
        calls.append(path)
        if len(calls) == 1:
            return {"status": "REJECTED", "errors": [{"code": "E001"}]}
        return {"status": "COMMITTED", "rows_committed": 3, "errors": []}

    adapter._runtime.import_xlsx = flaky_import
    request = {
        "request_id": "replay-import-retry-001",
        "operation": "IMPORT_XLSX",
        "path": "retry.xlsx",
    }

    first = adapter.handle(dict(request))
    retry = adapter.handle(dict(request))

    assert first["status"] == "REJECTED"
    assert retry["status"] == "COMMITTED"
    assert calls == ["retry.xlsx", "retry.xlsx"]


def valid_equipment(equipment_id):
    return {
        "equipment_id": equipment_id,
        "unit_no": f"DT-{equipment_id}",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def test_create_replay_preserves_application_duplicate_request_contract(tmp_path):
    adapter = make_adapter(tmp_path)
    request = {
        "request_id": "crud-create-replay-001",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-CREATE-REPLAY"),
    }

    first = adapter.handle(dict(request))
    audit_after_first = adapter._runtime._application.store.audit()
    conflict = adapter.handle({
        **request,
        "row": valid_equipment("EQ-CREATE-REPLAY-SECOND"),
    })

    assert first["status"] == "COMMITTED"
    assert conflict == {"request_id": request["request_id"], "status": "DUPLICATE_REQUEST"}
    assert adapter._runtime._application.store.exists("Equipment", "EQ-CREATE-REPLAY")
    assert not adapter._runtime._application.store.exists("Equipment", "EQ-CREATE-REPLAY-SECOND")
    assert adapter._runtime._application.store.audit() == audit_after_first


def test_update_replay_preserves_application_duplicate_request_contract(tmp_path):
    adapter = make_adapter(tmp_path)
    seed = adapter.handle({
        "request_id": "crud-update-seed-001",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-UPDATE-REPLAY"),
    })
    assert seed["status"] == "COMMITTED"
    request = {
        "request_id": "crud-update-replay-001",
        "operation": "UPDATE",
        "entity": "Equipment",
        "entity_id": "EQ-UPDATE-REPLAY",
        "patch": {"status": "Inactive"},
    }

    first = adapter.handle(dict(request))
    audit_after_first = adapter._runtime._application.store.audit()
    conflict = adapter.handle({**request, "patch": {"status": "Retired"}})

    assert first["status"] == "COMMITTED"
    assert conflict == {"request_id": request["request_id"], "status": "DUPLICATE_REQUEST"}
    assert adapter._runtime._application.store.get("Equipment", "EQ-UPDATE-REPLAY")["status"] == "Inactive"
    assert adapter._runtime._application.store.audit() == audit_after_first


def test_delete_replay_preserves_application_duplicate_request_contract(tmp_path):
    adapter = make_adapter(tmp_path)
    seed = adapter.handle({
        "request_id": "crud-delete-seed-001",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-DELETE-REPLAY"),
    })
    assert seed["status"] == "COMMITTED"
    request = {
        "request_id": "crud-delete-replay-001",
        "operation": "DELETE",
        "entity": "Equipment",
        "entity_id": "EQ-DELETE-REPLAY",
    }

    first = adapter.handle(dict(request))
    audit_after_first = adapter._runtime._application.store.audit()
    replay = adapter.handle(dict(request))

    assert first["status"] == "COMMITTED"
    assert replay == {"request_id": request["request_id"], "status": "DUPLICATE_REQUEST"}
    assert not adapter._runtime._application.store.exists("Equipment", "EQ-DELETE-REPLAY")
    assert adapter._runtime._application.store.audit() == audit_after_first


def test_finalize_kpi_same_request_returns_detached_cached_response(tmp_path):
    adapter = make_adapter(tmp_path)
    request = {
        "request_id": "replay-kpi-same-001",
        "operation": "FINALIZE_KPI",
        "snapshot": snapshot(81.8, 77.7, "V-KPI-REPLAY-SAME"),
    }

    first = adapter.handle(dict(request))
    assert first["status"] == "COMMITTED"
    first["audit_status"] = "MUTATED_BY_CALLER"

    replay = adapter.handle(dict(request))
    history = adapter._runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04")

    assert replay["status"] == "COMMITTED"
    assert replay["audit_status"] == "APPENDED"
    assert replay is not first
    assert len(history) == 1
    assert len(adapter._runtime._application.store.audit()) == 1


def test_backup_repeated_request_captures_fresh_read_only_snapshot(tmp_path):
    adapter = make_adapter(tmp_path)
    request = {"request_id": "backup-readonly-001", "operation": "BACKUP", "source": "test"}
    before_store = adapter._runtime._application.store.snapshot()
    before_audit = adapter._runtime._application.store.audit()

    first = adapter.handle(dict(request))
    second = adapter.handle(dict(request))

    assert first["status"] == "SEALED"
    assert second["status"] == "SEALED"
    assert first["snapshot_id"] != second["snapshot_id"]
    assert adapter._runtime._application.store.snapshot() == before_store
    assert adapter._runtime._application.store.audit() == before_audit


def test_list_operations_are_uncached_observational_reads(tmp_path):
    adapter = make_adapter(tmp_path)
    calls = {"datasets": 0, "topography": 0, "marker": 0}

    def list_datasets():
        calls["datasets"] += 1
        return [{"name": f"dataset-{calls['datasets']}"}]

    def list_topography():
        calls["topography"] += 1
        return [{"filename": f"topo-{calls['topography']}.ltdtm"}]

    def list_marker():
        calls["marker"] += 1
        return [{"filename": f"marker-{calls['marker']}.ltmarker"}]

    adapter._runtime._datasets.list = list_datasets
    adapter._runtime._topography.list = list_topography
    adapter._runtime._marker_location.list = list_marker
    adapter._runtime._datasets.active_info = lambda: {"name": "stable"}
    before_store = adapter._runtime._application.store.snapshot()
    before_audit = adapter._runtime._application.store.audit()

    operations = [
        ("LIST_DATASETS", "datasets", "datasets"),
        ("LIST_TOPOGRAPHY_BACKUPS", "topography", "backups"),
        ("LIST_MARKER_LOCATION_BACKUPS", "marker", "backups"),
    ]
    for operation, key, result_key in operations:
        request = {"request_id": f"list-repeat-{key}", "operation": operation}
        first = adapter.handle(dict(request))
        second = adapter.handle(dict(request))
        assert first[result_key] != second[result_key]
        assert calls[key] == 2

    assert adapter._runtime._application.store.snapshot() == before_store
    assert adapter._runtime._application.store.audit() == before_audit


def test_load_backup_operations_are_read_only_and_retryable(tmp_path):
    adapter = make_adapter(tmp_path)
    calls = {"topography": 0, "marker": 0}

    def read_topography(filename):
        calls["topography"] += 1
        return {"filename": filename, "data": "dG9wbw==", "format": "LITHODTM"}

    def read_marker(filename):
        calls["marker"] += 1
        return {"filename": filename, "data": "bWFya2Vy", "format": "LT-MARKER"}

    adapter._runtime._topography.read = read_topography
    adapter._runtime._marker_location.read = read_marker
    before_store = adapter._runtime._application.store.snapshot()
    before_audit = adapter._runtime._application.store.audit()

    cases = [
        ("LOAD_TOPOGRAPHY_BACKUP", "topography", "sample.ltdtm", "LITHODTM"),
        ("LOAD_MARKER_LOCATION_BACKUP", "marker", "sample.ltmarker", "LT-MARKER"),
    ]
    for operation, key, filename, expected_format in cases:
        request = {
            "request_id": f"load-backup-repeat-{key}",
            "operation": operation,
            "filename": filename,
        }
        first = adapter.handle(dict(request))
        second = adapter.handle(dict(request))
        assert first["status"] == "READY"
        assert second["status"] == "READY"
        assert first["format"] == expected_format
        assert second["format"] == expected_format
        # Successful LOAD requests are idempotently replayed from the adapter cache.
        assert calls[key] == 1

    assert adapter._runtime._application.store.snapshot() == before_store
    assert adapter._runtime._application.store.audit() == before_audit


def test_load_backup_failed_attempt_can_retry_same_request_id(tmp_path):
    adapter = make_adapter(tmp_path)
    calls = {"topography": 0, "marker": 0}

    def flaky_read(key, filename):
        calls[key] += 1
        if calls[key] == 1:
            raise FileNotFoundError("backup not found")
        return {"filename": filename, "data": "dGVzdA==", "format": key}

    adapter._runtime._topography.read = lambda filename: flaky_read("topography", filename)
    adapter._runtime._marker_location.read = lambda filename: flaky_read("marker", filename)

    for operation, key, filename in [
        ("LOAD_TOPOGRAPHY_BACKUP", "topography", "retry.ltdtm"),
        ("LOAD_MARKER_LOCATION_BACKUP", "marker", "retry.ltmarker"),
    ]:
        request = {
            "request_id": f"load-backup-retry-{key}",
            "operation": operation,
            "filename": filename,
        }
        first = adapter.handle(dict(request))
        assert first["status"] == "REJECTED"
        assert first["errors"][0]["code"] == "ADP-005"
        # Rejected/error responses must not be cached; same request ID can retry.
        retry = adapter.handle(dict(request))
        assert retry["status"] == "READY"
        assert calls[key] == 2
