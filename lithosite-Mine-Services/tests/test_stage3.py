import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"src"))
from mine_services import ApplicationService, PersistenceStore, ImportCoordinator, SnapshotManager

def seed():
    app=ApplicationService()
    assert app.create("Equipment",{"equipment_id":"EQ-01","equipment_type":"Truck","owner_type":"Company"},"s1")["status"]=="COMMITTED"
    assert app.create("WorkFront",{"work_front_id":"WF-01","name":"Pit A"},"s2")["status"]=="COMMITTED"
    return app

def test_update_read_and_delete():
    app=seed()
    assert app.update("Equipment","EQ-01",{"status":"Active"},"u1")["status"]=="COMMITTED"
    assert app.read("Equipment","EQ-01")["status"]=="Active"
    assert app.delete("Equipment","EQ-01","d1")["status"]=="COMMITTED"
    assert app.read("Equipment","EQ-01") is None
    assert app.audit.all()[-1]["action"]=="DELETE"

def test_import_is_atomic_on_validation_error():
    store=PersistenceStore(); imp=ImportCoordinator(store)
    result=imp.import_dataset({"Equipment":[{"equipment_id":"EQ-01","equipment_type":"Truck","owner_type":"Company"},{"equipment_id":"EQ-01","equipment_type":"Truck","owner_type":"Company"}]})
    assert result["status"]=="REJECTED" and store.all("Equipment")==[]

def test_import_commits_valid_dataset():
    store=PersistenceStore(); imp=ImportCoordinator(store)
    result=imp.import_dataset({"Equipment":[{"equipment_id":"EQ-01","equipment_type":"Truck","owner_type":"Company"}]})
    assert result["status"]=="COMMITTED" and store.exists("Equipment","EQ-01")

def test_snapshot_checksum_and_restore():
    app=seed(); snap=SnapshotManager(app.store).capture(); assert SnapshotManager(app.store).verify(snap)
    app.create("Equipment",{"equipment_id":"EQ-02","equipment_type":"Dozer","owner_type":"Company"},"s3")
    assert SnapshotManager(app.store).restore(snap)["status"]=="COMMITTED"
    assert app.read("Equipment","EQ-02") is None

def test_snapshot_tamper_rejected():
    app=seed(); snap=SnapshotManager(app.store).capture(); snap["payload"]["Equipment"]["EQ-01"]["equipment_type"]="Tampered"
    assert SnapshotManager(app.store).restore(snap)["status"]=="REJECTED"
