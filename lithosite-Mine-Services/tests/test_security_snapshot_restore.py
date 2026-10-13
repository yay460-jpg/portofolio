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
