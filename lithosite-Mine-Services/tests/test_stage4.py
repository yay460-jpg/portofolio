import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import RuntimeInterface


def valid_equipment(equipment_id="EQ-01"):
    return {
        "equipment_id": equipment_id,
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def test_runtime_interface_is_single_integration_boundary():
    runtime = RuntimeInterface()
    result = runtime.create("Equipment", valid_equipment("EQ-RUNTIME"), "runtime-create")

    assert result["status"] == "COMMITTED"
    assert runtime.read("Equipment", "EQ-RUNTIME")["equipment_id"] == "EQ-RUNTIME"
    assert not hasattr(runtime, "store")
    assert not hasattr(runtime, "validator")


def test_runtime_interface_backup_and_dry_run_restore():
    runtime = RuntimeInterface()
    assert runtime.create("Equipment", valid_equipment("EQ-BACKUP"), "runtime-backup")["status"] == "COMMITTED"

    snapshot = runtime.backup(source="Stage-4-Test")
    assert snapshot["source"] == "Stage-4-Test"

    assert runtime.create("Equipment", valid_equipment("EQ-AFTER"), "runtime-after")["status"] == "COMMITTED"
    result = runtime.restore(snapshot, mode="DRY_RUN")

    assert result["status"] == "VALIDATED"
    assert runtime.read("Equipment", "EQ-AFTER") is not None


def test_runtime_interface_mutations_share_application_contract():
    runtime = RuntimeInterface()

    missing_request = runtime.create("Equipment", valid_equipment("EQ-REQ"), "")
    assert missing_request["status"] == "REJECTED"
    assert missing_request["errors"][0]["code"] == "APP-001"

    first = runtime.create("Equipment", valid_equipment("EQ-IDEMP"), "runtime-idempotent")
    second = runtime.create("Equipment", valid_equipment("EQ-IDEMP-2"), "runtime-idempotent")

    assert first["status"] == "COMMITTED"
    assert second["status"] == "DUPLICATE_REQUEST"


def test_runtime_data_operations_share_audit_repository_boundary():
    runtime = RuntimeInterface()

    runtime._importer.audit_repository is runtime._application.audit_repository
    assert runtime._snapshots.audit_repository is runtime._application.audit_repository

    result = runtime.create("Equipment", valid_equipment("EQ-AUDIT"), "runtime-audit")
    assert result["status"] == "COMMITTED"

    events = runtime._application.audit_repository.all()
    assert events[-1]["entity"] == "Equipment"
    assert events[-1]["action"] == "CREATE"
