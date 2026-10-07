import pytest

from src.mine_services.application import ApplicationService
from src.mine_services.persistence import PersistenceStore
from src.mine_services import schema_a3


def service():
    return ApplicationService(store=PersistenceStore(schema_module=schema_a3))


def create(svc, entity, row, request_id):
    result = svc.create(entity, row, request_id)
    assert result["status"] == "COMMITTED", result
    return result


def test_global_capacity_accepts_decimal_values():
    svc = service()
    create(svc, "GlobalCapacity", {
        "capacity_profile_id": "GC-275",
        "capacity_name": "10 Wheel Heavy",
        "capacity_value": 27.5,
        "unit": "ton",
        "status": "Active",
        "effective_from": "2026-10-08",
        "effective_to": None,
    }, "test-gc-create")
    assert svc.read("GlobalCapacity", "GC-275")["capacity_value"] == 27.5


def test_dump_truck_hauling_calculates_quantity_from_checker_retase():
    svc = service()
    create(svc, "GlobalCapacity", {
        "capacity_profile_id": "GC-275",
        "capacity_name": "10 Wheel Heavy",
        "capacity_value": 27.5,
        "unit": "ton",
        "status": "Active",
    }, "test-gc")
    create(svc, "WorkFront", {
        "work_front_id": "WF-A",
        "domain": "Road & Hauling",
        "location": "Pit A",
        "responsible": "Ops",
        "status": "Active",
        "capacity_profile_id": "GC-275",
    }, "test-wf")
    create(svc, "Equipment", {
        "equipment_id": "DT-001",
        "unit_no": "DT-001",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "owner_name": "",
        "status": "Active",
        "effective_from": "2026-10-08",
        "effective_to": None,
    }, "test-eq")
    result = svc.create("Operations", {
        "transaction_id": "OPS-001",
        "transaction_date": "2026-10-08",
        "transaction_time": "06:00",
        "domain": "Road & Hauling",
        "work_front_id": "WF-A",
        "equipment_id": "DT-001",
        "activity": "Hauling",
        "retase": 4,
        "unit": "",
        "actual_hours": 4,
        "target_hours": 4,
        "status": "DRAFT",
        "source": "Checker",
    }, "test-op")
    assert result["status"] == "COMMITTED", result
    row = svc.read("Operations", "OPS-001")
    assert row["capacity_profile_id"] == "GC-275"
    assert row["applied_capacity"] == 27.5
    assert row["capacity_unit"] == "ton"
    assert row["quantity"] == 110.0
    assert row["retase"] == 4


def test_historical_applied_capacity_is_preserved_on_update():
    svc = service()
    create(svc, "GlobalCapacity", {
        "capacity_profile_id": "GC-275",
        "capacity_name": "Initial",
        "capacity_value": 27.5,
        "unit": "ton",
        "status": "Active",
    }, "gc")
    create(svc, "GlobalCapacity", {
        "capacity_profile_id": "GC-300",
        "capacity_name": "Later",
        "capacity_value": 30,
        "unit": "ton",
        "status": "Active",
    }, "gc2")
    create(svc, "WorkFront", {
        "work_front_id": "WF-A",
        "domain": "Road & Hauling",
        "location": "Pit A",
        "responsible": "Ops",
        "status": "Active",
        "capacity_profile_id": "GC-275",
    }, "wf")
    create(svc, "Equipment", {
        "equipment_id": "DT-001",
        "unit_no": "DT-001",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "owner_name": "",
        "status": "Active",
        "effective_from": "2026-10-08",
        "effective_to": None,
    }, "eq")
    create(svc, "Operations", {
        "transaction_id": "OPS-001",
        "transaction_date": "2026-10-08",
        "transaction_time": "06:00",
        "domain": "Road & Hauling",
        "work_front_id": "WF-A",
        "equipment_id": "DT-001",
        "activity": "Hauling",
        "retase": 4,
        "unit": "",
        "actual_hours": 4,
        "target_hours": 4,
        "status": "DRAFT",
        "source": "Checker",
    }, "op")
    svc.update("GlobalCapacity", "GC-275", {"capacity_value": 30}, "gc-update")
    result = svc.update("Operations", "OPS-001", {"retase": 4}, "op-update")
    assert result["status"] == "COMMITTED", result
    row = svc.read("Operations", "OPS-001")
    assert row["applied_capacity"] == 27.5
    assert row["quantity"] == 110.0
