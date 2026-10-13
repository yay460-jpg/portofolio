import sys
from pathlib import Path
from threading import Event, Thread

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


def test_adapter_serializes_shared_runtime_requests_across_threads():
    create_entered = Event()
    release_create = Event()
    second_started = Event()
    read_entered = Event()

    class BlockingRuntime:
        def create(self, entity, row, request_id):
            create_entered.set()
            if not release_create.wait(timeout=3):
                raise AssertionError("test did not release the blocked create")
            return {"status": "COMMITTED", "entity_id": row["equipment_id"]}

        def read(self, entity, entity_id=None):
            read_entered.set()
            return {"status": "OK", "data": []}

    adapter = RuntimeAdapter(BlockingRuntime())
    results = {}

    first = Thread(
        target=lambda: results.setdefault("create", adapter.handle({
            "request_id": "concurrency-create",
            "operation": "CREATE",
            "entity": "Equipment",
            "row": valid_equipment("EQ-CONCURRENT"),
        }))
    )

    def run_read():
        second_started.set()
        results["read"] = adapter.handle({
            "request_id": "concurrency-read",
            "operation": "READ",
            "entity": "Equipment",
        })

    second = Thread(target=run_read)
    first.start()
    try:
        assert create_entered.wait(timeout=1), "create request did not enter runtime"
        second.start()
        assert second_started.wait(timeout=1), "second request did not start"
        read_entered_while_create_blocked = read_entered.wait(timeout=0.05)
    finally:
        release_create.set()
        first.join(timeout=3)
        if second.ident is not None:
            second.join(timeout=3)

    assert not first.is_alive()
    assert not second.is_alive()
    assert not read_entered_while_create_blocked
    assert read_entered.is_set()
    assert results["create"]["status"] == "COMMITTED"
    assert results["read"]["status"] == "OK"


def test_adapter_holds_runtime_lock_through_dependent_postprocess():
    create_entered = Event()
    release_postprocess = Event()
    second_started = Event()
    read_entered = Event()

    class BlockingRuntime:
        def create(self, entity, row, request_id):
            create_entered.set()
            return {"status": "COMMITTED", "entity_id": row["equipment_id"]}

        def read(self, entity, entity_id=None):
            read_entered.set()
            return {"status": "OK", "data": []}

    adapter = RuntimeAdapter(BlockingRuntime())
    results = {}

    def postprocess(request, result):
        if request.get("operation") == "CREATE":
            if not release_postprocess.wait(timeout=3):
                raise AssertionError("test did not release post-processing")
        return result

    first = Thread(
        target=lambda: results.setdefault("create", adapter.handle_with_postprocess({
            "request_id": "postprocess-create",
            "operation": "CREATE",
            "entity": "Equipment",
            "row": valid_equipment("EQ-POSTPROCESS"),
        }, postprocess))
    )

    def run_read():
        second_started.set()
        results["read"] = adapter.handle({
            "request_id": "postprocess-read",
            "operation": "READ",
            "entity": "Equipment",
        })

    second = Thread(target=run_read)
    first.start()
    try:
        assert create_entered.wait(timeout=1), "create request did not enter runtime"
        second.start()
        assert second_started.wait(timeout=1), "read request did not start"
        read_entered_while_postprocessing = read_entered.wait(timeout=0.05)
    finally:
        release_postprocess.set()
        first.join(timeout=3)
        if second.ident is not None:
            second.join(timeout=3)

    assert not first.is_alive()
    assert not second.is_alive()
    assert not read_entered_while_postprocessing
    assert read_entered.is_set()
    assert results["create"]["status"] == "COMMITTED"
    assert results["read"]["status"] == "OK"
