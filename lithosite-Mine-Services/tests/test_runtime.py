import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import (
    ApplicationService,
    ImportCoordinator,
    PersistenceStore,
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
