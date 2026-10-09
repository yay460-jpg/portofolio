import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService


def valid_equipment(equipment_id="EQ-01"):
    return {
        "equipment_id": equipment_id,
        "unit_no": "DT-001",
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
    assert app.create("Equipment", valid_equipment(), "r1")["status"] == "COMMITTED"
    assert app.create("WorkFront", valid_work_front(), "r2")["status"] == "COMMITTED"
    return app


def test_valid_create():
    app = seed()
    result = app.create(
        "Maintenance",
        {
            "maintenance_id": "M-01",
            "equipment_id": "EQ-01",
            "event_type": "Preventive",
            "status": "Open",
            "downtime_hours": 2,
        },
        "r3",
    )
    assert result["status"] == "COMMITTED"


def test_duplicate_pk_rejected():
    app = seed()
    result = app.create("Equipment", valid_equipment(), "r3")
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E004" for e in result["errors"])


def test_missing_fk_rejected():
    app = seed()
    result = app.create(
        "Maintenance",
        {
            "maintenance_id": "M-01",
            "equipment_id": "NOPE",
            "event_type": "Preventive",
            "status": "Open",
        },
        "r3",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E005" for e in result["errors"])


def test_closed_requires_timestamp():
    app = seed()
    result = app.create(
        "Issues",
        {"issue_id": "I-01", "status": "Closed"},
        "r3",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E008" for e in result["errors"])


def test_negative_numeric_rejected():
    app = seed()
    result = app.create(
        "Maintenance",
        {
            "maintenance_id": "M-01",
            "equipment_id": "EQ-01",
            "event_type": "Preventive",
            "status": "Open",
            "downtime_hours": -1,
        },
        "r3",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E007" for e in result["errors"])


def test_pk_immutable():
    app = seed()
    result = app.update(
        "Equipment",
        "EQ-01",
        {"equipment_id": "EQ-01-NEW"},
        "r3",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E010" for e in result["errors"])


def test_idempotent_request():
    app = seed()
    row = valid_equipment("EQ-02")
    assert app.create("Equipment", row, "same")["status"] == "COMMITTED"
    assert app.create("Equipment", row, "same")["status"] == "DUPLICATE_REQUEST"


def test_invalid_date_type_rejected():
    app = seed()
    result = app.create(
        "Maintenance",
        {
            "maintenance_id": "M-TYPE",
            "equipment_id": "EQ-01",
            "event_date": "not-a-date",
            "event_type": "Preventive",
            "status": "Open",
        },
        "type-date",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E002" for e in result["errors"])


def test_invalid_time_type_rejected():
    app = seed()
    result = app.create(
        "Operations",
        {
            "transaction_id": "TX-TYPE",
            "transaction_date": "2026-09-28",
            "transaction_time": "not-a-time",
            "domain": "Road & Hauling",
            "work_front_id": "WF-01",
            "activity": "Hauling",
            "status": "DRAFT",
        },
        "type-time",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E002" for e in result["errors"])


def test_invalid_period_month_rejected():
    app = seed()
    result = app.create(
        "Plans",
        {
            "plan_id": "P-TYPE",
            "period": "2026-13",
            "domain": "Road & Hauling",
            "activity": "Hauling",
            "status": "Draft",
        },
        "type-period",
    )
    assert result["status"] == "REJECTED"
    assert any(e.code == "VAL-E009" for e in result["errors"])



def test_plan_date_range_validated_and_saved():
    app = seed()
    result = app.create(
        "Plans",
        {
            "plan_id": "P-RANGE-01",
            "period": "2026-10",
            "start_date": "2026-10-09",
            "end_date": "2026-10-15",
            "domain": "Road & Hauling",
            "work_front_id": "WF-01",
            "activity": "Hauling",
            "target_quantity": 500,
            "measurement": "ton",
            "target_hours": 8,
            "status": "Draft",
        },
        "plan-range-valid",
    )
    assert result["status"] == "COMMITTED", result
    row = app.read("Plans", "P-RANGE-01")
    assert row["start_date"] == "2026-10-09"
    assert row["end_date"] == "2026-10-15"


def test_plan_end_date_cannot_precede_start_date():
    app = seed()
    result = app.create(
        "Plans",
        {
            "plan_id": "P-RANGE-02",
            "period": "2026-10",
            "start_date": "2026-10-16",
            "end_date": "2026-10-15",
            "domain": "Road & Hauling",
            "work_front_id": "WF-01",
            "activity": "Hauling",
            "target_quantity": 500,
            "measurement": "ton",
            "target_hours": 8,
            "status": "Draft",
        },
        "plan-range-invalid",
    )
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E008" and error.field == "end_date" for error in result["errors"])
