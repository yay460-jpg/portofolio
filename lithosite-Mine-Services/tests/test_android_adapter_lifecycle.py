import json
import sys
from pathlib import Path

PYTHON_ROOT = Path(__file__).parents[1] / "android-host" / "app" / "src" / "main" / "python"
sys.path.insert(0, str(PYTHON_ROOT))

import android_entry


class FakeStore:
    def __init__(self, database):
        self.database = database


class FakeAuditRepository:
    def __init__(self, store):
        self.store = store


class FakeApplicationService:
    def __init__(self, store, audit_repository):
        self.store = store
        self.audit_repository = audit_repository


class FakeImportCoordinator:
    def __init__(self, store, audit_repository):
        pass


class FakeSnapshotManager:
    def __init__(self, store, audit_repository):
        pass


class FakeRuntimeInterface:
    def __init__(self, application, importer, snapshots):
        self.application = application


class FakeRuntimeAdapter:
    side_effects = 0

    def __init__(self, runtime):
        self.runtime = runtime
        self._request_results = {}

    def handle(self, request):
        request_id = request.get("request_id")
        if request_id in self._request_results:
            return self._request_results[request_id]
        type(self).side_effects += 1
        response = {"status": "COMMITTED", "request_id": request_id}
        self._request_results[request_id] = response
        return response


def test_android_handle_preserves_request_replay_guard_across_bridge_calls(tmp_path, monkeypatch):
    database = tmp_path / "Mine-Services-Database.xlsx"
    database.write_bytes(b"isolated-test-seed")

    monkeypatch.setattr(android_entry, "PersistenceStore", FakeStore)
    monkeypatch.setattr(android_entry, "AuditRepository", FakeAuditRepository)
    monkeypatch.setattr(android_entry, "ApplicationService", FakeApplicationService)
    monkeypatch.setattr(android_entry, "ImportCoordinator", FakeImportCoordinator)
    monkeypatch.setattr(android_entry, "SnapshotManager", FakeSnapshotManager)
    monkeypatch.setattr(android_entry, "RuntimeInterface", FakeRuntimeInterface)
    monkeypatch.setattr(android_entry, "RuntimeAdapter", FakeRuntimeAdapter)
    FakeRuntimeAdapter.side_effects = 0

    request = json.dumps({
        "request_id": "android-replay-lifecycle-001",
        "operation": "SAVE_AS_DATASET",
        "name": "Isolated Dataset",
    })

    first = json.loads(android_entry.handle(str(tmp_path), request))
    replay = json.loads(android_entry.handle(str(tmp_path), request))

    assert first == replay
    assert FakeRuntimeAdapter.side_effects == 1
