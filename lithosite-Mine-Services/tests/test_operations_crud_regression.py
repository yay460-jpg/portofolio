import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore


def work_front():
    return {
        "work_front_id": "WF-SYS-TEST",
        "domain": "Road & Hauling",
        "location": "Test Pit",
        "responsible": "Test Supervisor",
        "status": "Active",
        "effective_from": "2026-09-28",
    }


def operation():
    return {
        "transaction_id": "TRX-SYS-TEST",
        "transaction_date": "2026-09-28",
        "transaction_time": "08:00",
        "domain": "Road & Hauling",
        "work_front_id": "WF-SYS-TEST",
        "equipment_id": None,
        "activity": "Test Operation",
        "quantity": 100,
        "unit": "ton",
        "actual_hours": 2,
        "target_hours": 3,
        "status": "DRAFT",
        "source": "Test",
    }


def test_operations_update_allows_runtime_owned_timestamps():
    app = ApplicationService(PersistenceStore())
    assert app.create("WorkFront", work_front(), "wf-create")["status"] == "COMMITTED"
    assert app.create("Operations", operation(), "ops-create")["status"] == "COMMITTED"

    result = app.update(
        "Operations",
        "TRX-SYS-TEST",
        {"quantity": 150, "status": "VALIDATED"},
        "ops-update",
    )

    assert result["status"] == "COMMITTED"
    row = app.store.get("Operations", "TRX-SYS-TEST")
    assert row["quantity"] == 150
    assert row["status"] == "VALIDATED"
    assert row["created_at"]
    assert row["updated_at"]
    assert row["updated_at"] != row["created_at"]


def test_operations_update_rejects_explicit_generated_field_patch():
    app = ApplicationService(PersistenceStore())
    assert app.create("WorkFront", work_front(), "wf-protected")["status"] == "COMMITTED"
    assert app.create("Operations", operation(), "ops-protected")["status"] == "COMMITTED"

    result = app.update(
        "Operations",
        "TRX-SYS-TEST",
        {"created_at": "2020-01-01T00:00:00+00:00"},
        "ops-protected-update",
    )

    assert result["status"] == "REJECTED"
    assert result["errors"][0]["code"] == "VAL-E010"
    assert result["errors"][0]["field"] == "created_at"
