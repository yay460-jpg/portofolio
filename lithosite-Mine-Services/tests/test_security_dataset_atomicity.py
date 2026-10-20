import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeInterface


def make_runtime(directory):
    runtime = RuntimeInterface(application=ApplicationService(PersistenceStore()))
    runtime._datasets.directory = directory
    return runtime


def test_save_dataset_as_cleans_up_file_and_active_state_when_audit_fails(tmp_path, monkeypatch):
    runtime = make_runtime(tmp_path)

    def fail_audit(**kwargs):
        raise RuntimeError("simulated audit append failure")

    monkeypatch.setattr(runtime._application.audit_repository, "append", fail_audit)

    with pytest.raises(RuntimeError, match="simulated audit append failure"):
        runtime.save_dataset_as("Audit Failure Dataset")

    assert list(tmp_path.glob("*.json")) == []
    assert runtime._datasets.active_info() is None


def test_save_dataset_as_rolls_back_audit_and_file_when_store_save_fails(tmp_path, monkeypatch):
    runtime = make_runtime(tmp_path)
    audit_before = runtime._application.store.audit()

    def fail_store_save():
        raise OSError("simulated workbook save failure")

    monkeypatch.setattr(runtime._application.store, "save", fail_store_save)

    with pytest.raises(OSError, match="simulated workbook save failure"):
        runtime.save_dataset_as("Store Failure Dataset")

    assert list(tmp_path.glob("*.json")) == []
    assert runtime._datasets.active_info() is None
    assert runtime._application.store.audit() == audit_before


def test_save_dataset_restores_existing_file_and_active_state_when_store_save_fails(tmp_path, monkeypatch):
    runtime = make_runtime(tmp_path)
    created = runtime.save_dataset_as("Existing Dataset")
    assert created["status"] == "SAVED_AS"

    target = tmp_path / "Existing Dataset.json"
    original_bytes = target.read_bytes()
    active_before = runtime._datasets.active_info()
    audit_before = runtime._application.store.audit()

    def fail_store_save():
        raise OSError("simulated workbook save failure")

    monkeypatch.setattr(runtime._application.store, "save", fail_store_save)

    with pytest.raises(OSError, match="simulated workbook save failure"):
        runtime.save_dataset("Existing Dataset")

    assert target.read_bytes() == original_bytes
    assert runtime._datasets.active_info() == active_before
    assert runtime._application.store.audit() == audit_before
