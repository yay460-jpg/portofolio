import json

from mine_services import (
    ApplicationService,
    PersistenceStore,
    RuntimeAdapter,
    RuntimeInterface,
    SnapshotManager,
)


def test_restore_rejects_unrecognized_entity_keys_without_mutating_runtime():
    # In-memory store only: this adversarial test never opens a workbook.
    store = PersistenceStore()
    snapshot_manager = SnapshotManager(store)
    adapter = RuntimeAdapter(
        RuntimeInterface(application=ApplicationService(store=store))
    )

    snapshot = snapshot_manager.capture(source="security-adversarial-test")
    snapshot["payload"]["data"]["UnexpectedEntity"] = {
        "hidden-1": {"id": "hidden-1", "value": "unexpected runtime state"}
    }
    # The checksum detects accidental modification, not the authenticity of a
    # payload. Recompute it to exercise schema validation after integrity passes.
    snapshot["checksum"] = snapshot_manager._hash_payload(snapshot["payload"])

    result = adapter.handle({
        "request_id": "security-unknown-entity-restore",
        "operation": "RESTORE",
        "mode": "REPLACE_RUNTIME",
        "snapshot": snapshot,
    })

    assert result["status"] == "REJECTED"
    assert store.all("UnexpectedEntity") == []


def test_dataset_load_rejects_unrecognized_entity_keys_without_mutating_runtime(tmp_path):
    # Dataset file is confined to pytest's temporary directory; runtime store is
    # in-memory and does not open or modify the operational workbook.
    store = PersistenceStore()
    runtime = RuntimeInterface(application=ApplicationService(store=store))
    runtime._datasets.directory = tmp_path
    adapter = RuntimeAdapter(runtime)

    saved = runtime.save_dataset(name="security-dataset-test")
    dataset_path = tmp_path / saved["filename"]
    document = json.loads(dataset_path.read_text(encoding="utf-8"))
    document["payload"]["data"]["UnexpectedEntity"] = {
        "hidden-1": {"id": "hidden-1", "value": "unexpected runtime state"}
    }
    dataset_path.write_text(
        json.dumps(document, ensure_ascii=False),
        encoding="utf-8",
    )

    result = adapter.handle({
        "request_id": "security-unknown-entity-dataset",
        "operation": "LOAD_DATASET",
        "name": saved["dataset_name"],
    })

    assert result["status"] == "REJECTED"
    assert store.all("UnexpectedEntity") == []
