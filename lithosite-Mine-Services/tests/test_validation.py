import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"src"))
from mine_services import ApplicationService

def seed():
    app=ApplicationService()
    assert app.create("Equipment",{"equipment_id":"EQ-01","equipment_type":"Truck","owner_type":"Company"},"r1")["status"]=="COMMITTED"
    assert app.create("WorkFront",{"work_front_id":"WF-01","name":"Pit A","status":"Active"},"r2")["status"]=="COMMITTED"
    return app

def test_valid_create():
    app=seed()
    result=app.create("Maintenance",{"maintenance_id":"M-01","equipment_id":"EQ-01","status":"Open","downtime_hours":2},"r3")
    assert result["status"]=="COMMITTED"

def test_duplicate_pk_rejected():
    app=seed()
    result=app.create("Equipment",{"equipment_id":"EQ-01","equipment_type":"Truck","owner_type":"Company"},"r3")
    assert result["status"]=="REJECTED"
    assert any(e.code=="PK_DUPLICATE" for e in result["errors"])

def test_missing_fk_rejected():
    app=seed()
    result=app.create("Maintenance",{"maintenance_id":"M-01","equipment_id":"NOPE","status":"Open"},"r3")
    assert any(e.code=="FK_NOT_FOUND" for e in result["errors"])

def test_closed_requires_timestamp():
    app=seed()
    result=app.create("Issues",{"issue_id":"I-01","status":"Closed"},"r3")
    assert any(e.code=="CONDITIONAL_INVALID" for e in result["errors"])

def test_negative_numeric_rejected():
    app=seed()
    result=app.create("Maintenance",{"maintenance_id":"M-01","equipment_id":"EQ-01","status":"Open","downtime_hours":-1},"r3")
    assert any(e.code=="RANGE_INVALID" for e in result["errors"])

def test_pk_immutable():
    app=seed()
    result=app.update("Equipment","EQ-01",{"equipment_id":"EQ-01-NEW"},"r3")
    assert any(e.code=="PK_IMMUTABLE" for e in result["errors"])

def test_idempotent_request():
    app=seed()
    row={"equipment_id":"EQ-02","equipment_type":"Dozer","owner_type":"Company"}
    assert app.create("Equipment",row,"same")["status"]=="COMMITTED"
    assert app.create("Equipment",row,"same")["status"]=="DUPLICATE_REQUEST"
