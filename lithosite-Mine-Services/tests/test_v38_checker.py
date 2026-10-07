from src.mine_services.application import ApplicationService
from src.mine_services.persistence import PersistenceStore
from src.mine_services import schema_a3


def service():
    return ApplicationService(store=PersistenceStore(schema_module=schema_a3))


def create(svc, entity, row, request_id):
    result = svc.create(entity, row, request_id)
    assert result["status"] == "COMMITTED", result
    return result


def base_rows(svc):
    create(svc, "Equipment", {
        "equipment_id": "DT-CHK-001",
        "unit_no": "DT-CHK-001",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "owner_name": "",
        "status": "Active",
        "effective_from": "2026-10-08",
        "effective_to": None,
    }, "checker-eq")
    create(svc, "WorkFront", {
        "work_front_id": "WF-CHK-A",
        "domain": "Road & Hauling",
        "location": "Pit A",
        "responsible": "Ops",
        "status": "Active",
        "capacity_profile_id": None,
    }, "checker-wf")


def test_checker_stores_period_observation_and_retase():
    svc = service()
    base_rows(svc)
    result = svc.create("Checker", {
        "checker_id": "CHK-001",
        "checker_name": "Field Checker",
        "observation_date": "2026-10-08",
        "start_time": "06:00",
        "end_time": "09:00",
        "shift": "Day",
        "equipment_id": "DT-CHK-001",
        "work_front_id": "WF-CHK-A",
        "activity": "Hauling",
        "material": "Ore",
        "retase": 4,
        "source": "Checker",
    }, "checker-create")
    assert result["status"] == "COMMITTED", result
    row = svc.read("Checker", "CHK-001")
    assert row["retase"] == 4
    assert row["material"] == "Ore"
    assert row["start_time"] == "06:00"
    assert row["end_time"] == "09:00"


def test_checker_requires_retase_for_dump_truck_hauling():
    svc = service()
    base_rows(svc)
    result = svc.create("Checker", {
        "checker_id": "CHK-002",
        "checker_name": "Field Checker",
        "observation_date": "2026-10-08",
        "start_time": "09:00",
        "end_time": "12:00",
        "shift": "Day",
        "equipment_id": "DT-CHK-001",
        "work_front_id": "WF-CHK-A",
        "activity": "Hauling",
        "material": "OB",
        "retase": None,
        "source": "Checker",
    }, "checker-missing-retase")
    assert result["status"] == "REJECTED"
    assert any(error.field == "retase" for error in result["errors"])


def test_checker_does_not_force_retase_for_maintenance():
    svc = service()
    base_rows(svc)
    result = svc.create("Checker", {
        "checker_id": "CHK-003",
        "checker_name": "Field Checker",
        "observation_date": "2026-10-08",
        "start_time": "15:00",
        "end_time": "17:00",
        "shift": "Day",
        "equipment_id": "DT-CHK-001",
        "work_front_id": "WF-CHK-A",
        "activity": "Maintenance",
        "material": None,
        "retase": None,
        "source": "Checker",
    }, "checker-maintenance")
    assert result["status"] == "COMMITTED", result


def test_checker_rejects_invalid_shift_and_material():
    svc = service()
    base_rows(svc)
    result = svc.create("Checker", {
        "checker_id": "CHK-004",
        "checker_name": "Field Checker",
        "observation_date": "2026-10-08",
        "start_time": "06:00",
        "end_time": "09:00",
        "shift": "Morning",
        "equipment_id": "DT-CHK-001",
        "work_front_id": "WF-CHK-A",
        "activity": "Hauling",
        "material": "Coal",
        "retase": 4,
        "source": "Checker",
    }, "checker-invalid-controlled")
    assert result["status"] == "REJECTED"
    fields = {error.field for error in result["errors"]}
    assert "shift" in fields
    assert "material" in fields
