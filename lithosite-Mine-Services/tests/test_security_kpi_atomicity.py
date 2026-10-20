import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeInterface
from mine_services.kpi_snapshot_store import KPIHistoryStore
from test_kpi_snapshot import snapshot


def make_runtime(tmp_path):
    runtime = RuntimeInterface(application=ApplicationService(PersistenceStore()))
    runtime._kpi_history = KPIHistoryStore(tmp_path / "KPI-History.json")
    return runtime


def test_finalize_kpi_does_not_commit_history_when_audit_append_fails(tmp_path, monkeypatch):
    runtime = make_runtime(tmp_path)

    def fail_audit(**kwargs):
        raise RuntimeError("simulated audit append failure")

    monkeypatch.setattr(runtime._application.audit_repository, "append", fail_audit)

    result = runtime.finalize_kpi(snapshot(81.8, 77.7, "V-KPI-AUDIT-FAIL"))

    assert result["status"] != "COMMITTED"
    assert runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04") == []
    assert runtime._application.store.audit() == []


def test_finalize_kpi_does_not_commit_history_when_store_save_fails(tmp_path, monkeypatch):
    runtime = make_runtime(tmp_path)

    def fail_store_save():
        raise OSError("simulated workbook save failure")

    monkeypatch.setattr(runtime._application.store, "save", fail_store_save)

    result = runtime.finalize_kpi(snapshot(81.8, 77.7, "V-KPI-STORE-FAIL"))

    assert result["status"] != "COMMITTED"
    assert runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04") == []
    assert runtime._application.store.audit() == []


def test_finalize_kpi_restores_existing_history_file_when_store_save_fails(tmp_path, monkeypatch):
    runtime = make_runtime(tmp_path)
    committed = runtime.finalize_kpi(snapshot(81.8, 77.7, "V-KPI-BASELINE"))
    assert committed["status"] == "COMMITTED"

    history_path = runtime._kpi_history.path
    original_bytes = history_path.read_bytes()
    original_records = runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04")
    audit_before = runtime._application.store.audit()

    def fail_store_save():
        raise OSError("simulated workbook save failure")

    monkeypatch.setattr(runtime._application.store, "save", fail_store_save)
    failed = runtime.finalize_kpi(snapshot(92.0, 84.0, "V-KPI-ROLLBACK"))

    assert failed["status"] != "COMMITTED"
    assert history_path.read_bytes() == original_bytes
    assert runtime.read_kpi_snapshots("FLEET:ALL", "2026-10-04") == original_records
    assert runtime._application.store.audit() == audit_before
