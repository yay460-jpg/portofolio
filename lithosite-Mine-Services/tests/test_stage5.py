import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import RuntimeAdapter, RuntimeInterface


def valid_equipment(equipment_id="EQ-ADAPTER"):
    return {
        "equipment_id": equipment_id,
        "unit_no": "DT-001",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def test_adapter_routes_mutation_through_runtime_interface():
    runtime = RuntimeInterface()
    adapter = RuntimeAdapter(runtime)

    result = adapter.handle({
        "request_id": "adapter-create",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment(),
    })

    assert result["request_id"] == "adapter-create"
    assert result["status"] == "COMMITTED"
    assert runtime.read("Equipment", "EQ-ADAPTER") is not None


def test_adapter_routes_update_and_delete_commands():
    runtime = RuntimeInterface()
    adapter = RuntimeAdapter(runtime)
    created = adapter.handle({
        "request_id": "adapter-update-create",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-UPDATE"),
    })
    assert created["status"] == "COMMITTED"

    updated = adapter.handle({
        "request_id": "adapter-update",
        "operation": "UPDATE",
        "entity": "Equipment",
        "entity_id": "EQ-UPDATE",
        "patch": {"status": "Inactive"},
    })
    assert updated["status"] == "COMMITTED"
    assert runtime.read("Equipment", "EQ-UPDATE")["status"] == "Inactive"

    deleted = adapter.handle({
        "request_id": "adapter-delete",
        "operation": "DELETE",
        "entity": "Equipment",
        "entity_id": "EQ-UPDATE",
    })
    assert deleted["status"] == "COMMITTED"
    assert runtime.read("Equipment", "EQ-UPDATE") is None


def test_adapter_preserves_runtime_errors_without_redefining_them():
    adapter = RuntimeAdapter(RuntimeInterface())

    first = adapter.handle({
        "request_id": "adapter-idempotent",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-ERROR"),
    })
    assert first["status"] == "COMMITTED"

    duplicate = adapter.handle({
        "request_id": "adapter-idempotent",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-ERROR-2"),
    })
    assert duplicate["status"] == "DUPLICATE_REQUEST"


def test_adapter_validates_envelope_before_runtime():
    adapter = RuntimeAdapter()

    missing_operation = adapter.handle({"request_id": "adapter-invalid"})
    assert missing_operation["status"] == "REJECTED"
    assert missing_operation["errors"][0]["code"] == "ADP-003"

    unsupported = adapter.handle({
        "request_id": "adapter-unsupported",
        "operation": "DROP_DATABASE",
    })
    assert unsupported["errors"][0]["code"] == "ADP-002"

    missing_path = adapter.handle({
        "request_id": "adapter-missing-path",
        "operation": "IMPORT_XLSX",
    })
    assert missing_path["errors"][0]["code"] == "ADP-003"


def test_adapter_read_backup_and_dry_run_restore():
    adapter = RuntimeAdapter()

    create = adapter.handle({
        "request_id": "adapter-data",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment("EQ-DATA"),
    })
    assert create["status"] == "COMMITTED"

    read = adapter.handle({
        "request_id": "adapter-read",
        "operation": "READ",
        "entity": "Equipment",
        "entity_id": "EQ-DATA",
    })
    assert read["equipment_id"] == "EQ-DATA"

    audit = adapter.handle({
        "request_id": "adapter-audit-read",
        "operation": "READ",
        "entity": "AuditLog",
    })
    assert audit["status"] == "OK"
    assert any(
        event["entity"] == "Equipment"
        and event["entity_id"] == "EQ-DATA"
        and event["action"] == "CREATE"
        for event in audit["data"]
    )

    backup = adapter.handle({
        "request_id": "adapter-backup",
        "operation": "BACKUP",
    })
    assert backup["status"] == "SEALED"

    restore = adapter.handle({
        "request_id": "adapter-restore",
        "operation": "RESTORE",
        "snapshot": backup,
        "mode": "DRY_RUN",
    })
    assert restore["status"] == "VALIDATED"


def test_adapter_sanitizes_unexpected_runtime_failure():
    class BrokenRuntime:
        def read(self, entity, entity_id=None):
            raise RuntimeError("secret internal detail")

    adapter = RuntimeAdapter(BrokenRuntime())
    result = adapter.handle({
        "request_id": "adapter-failure",
        "operation": "READ",
        "entity": "Equipment",
    })

    assert result["status"] == "REJECTED"
    assert result["errors"][0]["code"] == "ADP-005"
    assert "secret internal detail" not in result["errors"][0]["message"]
    assert not hasattr(adapter, "store")
    assert not hasattr(adapter, "validator")
