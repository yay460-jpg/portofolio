import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import (
    ApplicationService,
    ImportCoordinator,
    PersistenceStore,
    RuntimeInterface,
    SnapshotManager,
)


def valid_equipment(equipment_id="EQ-1"):
    return {
        "equipment_id": equipment_id,
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def test_validation_and_crud():
    app = ApplicationService(PersistenceStore())
    assert app.create("Equipment", valid_equipment(), "r1")["status"] == "COMMITTED"
    assert app.update("Equipment", "EQ-1", {"status": "Inactive"}, "r2")["status"] == "COMMITTED"
    assert app.delete("Equipment", "EQ-1", "r3")["status"] == "COMMITTED"
    assert len(app.store.audit()) == 3


def test_runtime_reads_audit_log_through_audit_repository():
    app = ApplicationService(PersistenceStore())
    runtime = RuntimeInterface(application=app)

    assert app.create("Equipment", valid_equipment("EQ-AUDIT"), "audit-create")["status"] == "COMMITTED"

    events = runtime.read("AuditLog")
    assert len(events) == 1
    assert events[0]["entity"] == "Equipment"
    assert events[0]["entity_id"] == "EQ-AUDIT"
    assert events[0]["action"] == "CREATE"
    assert events[0]["source"] == "audit-create"

    event = runtime.read("AuditLog", events[0]["audit_id"])
    assert event["audit_id"] == events[0]["audit_id"]


def test_fk_and_enum_rejected():
    app = ApplicationService()
    fk_result = app.create(
        "Maintenance",
        {
            "maintenance_id": "M1",
            "equipment_id": "NOPE",
            "event_type": "Preventive",
            "status": "Open",
        },
        "r1",
    )
    assert fk_result["status"] == "REJECTED"

    enum_result = app.create(
        "Equipment",
        {
            "equipment_id": "E1",
            "category": "Invalid Category",
            "type": "Dump Truck",
            "owner_type": "Owner",
            "status": "Active",
        },
        "r2",
    )
    assert enum_result["status"] == "REJECTED"


def test_import_atomic_duplicate():
    store = PersistenceStore()
    result = ImportCoordinator(store).import_dataset(
        {
            "Equipment": [
                valid_equipment("E"),
                valid_equipment("E"),
            ]
        }
    )
    assert result["status"] == "REJECTED"
    assert store.all("Equipment") == []


def test_snapshot_tamper():
    store = PersistenceStore()
    app = ApplicationService(store)
    assert app.create("Equipment", valid_equipment("E"), "r")["status"] == "COMMITTED"
    snap = SnapshotManager(store).capture()
    snap["checksum"] = "tampered"
    assert SnapshotManager(store).restore(snap)["status"] == "REJECTED"


def test_runtime_exposes_authoritative_controlled_lists():
    runtime = RuntimeInterface(application=ApplicationService(PersistenceStore()))
    lists = runtime.read("_Lists")
    assert lists["equipment_category"] == ["Heavy Equipment", "Light Vehicle", "Support Equipment"]
    assert lists["equipment_type"] == ["Dozer", "Dump Truck", "Excavator", "Grader", "Light Vehicle", "Loader", "Other", "Water Truck"]
    assert lists["owner_type"] == ["Contractor", "Owner"]
    assert lists["equipment_status"] == ["Active", "Inactive", "Retired"]


def valid_workfront(work_front_id="WF-1"):
    return {
        "work_front_id": work_front_id,
        "domain": "Road & Hauling",
        "location": "Pit North",
        "responsible": "Operations Team",
        "status": "Active",
    }


def test_workfront_crud_and_audit():
    app = ApplicationService(PersistenceStore())
    assert app.create("WorkFront", valid_workfront(), "wf-create")["status"] == "COMMITTED"
    assert app.update("WorkFront", "WF-1", {"location": "Pit South"}, "wf-update")["status"] == "COMMITTED"
    assert app.get("WorkFront", "WF-1")["location"] == "Pit South"
    assert app.delete("WorkFront", "WF-1", "wf-delete")["status"] == "COMMITTED"
    assert [event["action"] for event in app.store.audit()] == ["CREATE", "UPDATE", "DELETE"]


def test_workfront_delete_is_rejected_when_referenced():
    app = ApplicationService(PersistenceStore())
    assert app.create("WorkFront", valid_workfront("WF-REF"), "wf-ref")["status"] == "COMMITTED"
    operation = {
        "transaction_id": "TR-WF-REF",
        "transaction_date": "2026-09-29",
        "transaction_time": "08:00",
        "domain": "Road & Hauling",
        "work_front_id": "WF-REF",
        "activity": "Functional Test",
        "quantity": 10,
        "unit": "ton",
        "actual_hours": 1,
        "target_hours": 2,
        "status": "VALIDATED",
        "source": "Stage10",
    }
    assert app.create("Operations", operation, "wf-operation")["status"] == "COMMITTED"
    result = app.delete("WorkFront", "WF-REF", "wf-delete-ref")
    assert result["status"] == "REJECTED"
    assert app.store.exists("WorkFront", "WF-REF")
