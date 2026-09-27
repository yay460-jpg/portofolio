import sys,shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"src"))
from mine_services import *
def test_validation_and_crud(tmp_path):
 p=tmp_path/"db.xlsx"; shutil.copy("/mnt/data/Mine-Services-Database.xlsx",p)
 a=ApplicationService(PersistenceStore(p))
 assert a.create("Equipment",{"equipment_id":"EQ-1","category":"Heavy Equipment","type":"Dump Truck","owner_type":"Owner","status":"Active"},"r1")["status"]=="COMMITTED"
 assert a.update("Equipment","EQ-1",{"status":"Inactive"},"r2")["status"]=="COMMITTED"
 assert a.delete("Equipment","EQ-1","r3")["status"]=="COMMITTED"
 assert len(a.store.audit())==3
def test_fk_and_enum_rejected():
 a=ApplicationService()
 assert a.create("Maintenance",{"maintenance_id":"M1","equipment_id":"NOPE","status":"Open"},"r")["status"]=="REJECTED"
def test_import_atomic_duplicate():
 s=PersistenceStore()
 r=ImportCoordinator(s).import_dataset({"Equipment":[{"equipment_id":"E","owner_type":"Owner"},{"equipment_id":"E","owner_type":"Owner"}]})
 assert r["status"]=="REJECTED" and s.all("Equipment")==[]
def test_snapshot_tamper():
 s=PersistenceStore(); a=ApplicationService(s); a.create("Equipment",{"equipment_id":"E","owner_type":"Owner"},"r")
 snap=SnapshotManager(s).capture(); snap["checksum"]="tampered"
 assert SnapshotManager(s).restore(snap)["status"]=="REJECTED"
