import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import (
    ApplicationService,
    ImportCoordinator,
    PersistenceStore,
    SnapshotManager,
)


def valid_equipment(equipment_id="EQ-01"):
    return {
        "equipment_id": equipment_id,
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def valid_work_front(work_front_id="WF-01"):
    return {
        "work_front_id": work_front_id,
        "domain": "Road & Hauling",
        "location": "Pit A",
        "status": "Active",
    }


def seed():
    app = ApplicationService()
    assert app.create("Equipment", valid_equipment(), "s1")["status"] == "COMMITTED"
    assert app.create("WorkFront", valid_work_front(), "s2")["status"] == "COMMITTED"
    return app


def test_update_read_and_delete():
    app = seed()
    assert app.update("Equipment", "EQ-01", {"status": "Inactive"}, "u1")["status"] == "COMMITTED"
    assert app.read("Equipment", "EQ-01")["status"] == "Inactive"
    assert app.delete("Equipment", "EQ-01", "d1")["status"] == "COMMITTED"
    assert app.read("Equipment", "EQ-01") is None
    assert app.store.audit()[-1]["action"] == "DELETE"


def test_import_is_atomic_on_validation_error():
    store = PersistenceStore()
    imp = ImportCoordinator(store)
    result = imp.import_dataset(
        {
            "Equipment": [
                valid_equipment("EQ-01"),
                valid_equipment("EQ-01"),
            ]
        }
    )
    assert result["status"] == "REJECTED"
    assert store.all("Equipment") == []


def test_import_commits_valid_dataset():
    store = PersistenceStore()
    imp = ImportCoordinator(store)
    result = imp.import_dataset({"Equipment": [valid_equipment("EQ-01")]})
    assert result["status"] == "COMMITTED"
    assert store.exists("Equipment", "EQ-01")


def test_snapshot_checksum_and_restore():
    app = seed()
    snap = SnapshotManager(app.store).capture()
    assert SnapshotManager(app.store).verify(snap)

    assert app.create("Equipment", valid_equipment("EQ-02"), "s3")["status"] == "COMMITTED"
    assert SnapshotManager(app.store).restore(snap)["status"] == "COMMITTED"
    assert app.read("Equipment", "EQ-02") is None


def test_snapshot_tamper_rejected():
    app = seed()
    snap = SnapshotManager(app.store).capture()
    snap["payload"]["data"]["Equipment"]["EQ-01"]["type"] = "Tampered"
    assert SnapshotManager(app.store).restore(snap)["status"] == "REJECTED"
