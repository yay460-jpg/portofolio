import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, RuntimeAdapter, RuntimeInterface


def valid_work_front(work_front_id="WF-HSE-01"):
    return {
        "work_front_id": work_front_id,
        "domain": "Road & Hauling",
        "location": "Pit North",
        "responsible": "HSE Team",
        "status": "Active",
    }


def valid_hse(hse_id="HSE-01"):
    return {
        "hse_id": hse_id,
        "event_date": "2026-09-30",
        "domain": "Road & Hauling",
        "work_front_id": "WF-HSE-01",
        "event_type": "Near Miss",
        "severity": "Medium",
        "description": "Functional HSE observation.",
        "action": "Corrective Action",
        "status": "Open",
    }


def seed():
    app = ApplicationService()
    assert app.create("WorkFront", valid_work_front(), "stage14-wf")["status"] == "COMMITTED"
    return app


def test_hse_crud_and_audit():
    app = seed()
    assert app.create("HSE", valid_hse(), "stage14-create")["status"] == "COMMITTED"
    assert app.read("HSE", "HSE-01")["severity"] == "Medium"

    updated = app.update(
        "HSE",
        "HSE-01",
        {"severity": "High", "status": "In Progress"},
        "stage14-update",
    )
    assert updated["status"] == "COMMITTED"
    assert app.read("HSE", "HSE-01")["severity"] == "High"

    deleted = app.delete("HSE", "HSE-01", "stage14-delete")
    assert deleted["status"] == "COMMITTED"
    assert app.read("HSE", "HSE-01") is None
    assert [event["action"] for event in app.store.audit()] == ["CREATE", "CREATE", "UPDATE", "DELETE"]


def test_hse_fk_and_controlled_values_are_rejected():
    app = seed()

    bad_fk = valid_hse("HSE-BAD-FK")
    bad_fk["work_front_id"] = "NO-SUCH-WORK-FRONT"
    result = app.create("HSE", bad_fk, "stage14-bad-fk")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E005" for error in result["errors"])

    bad_enum = valid_hse("HSE-BAD-ENUM")
    bad_enum["severity"] = "Extreme"
    result = app.create("HSE", bad_enum, "stage14-bad-enum")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])

    bad_type = valid_hse("HSE-BAD-TYPE")
    bad_type["event_type"] = "Unsafe Condition"
    result = app.create("HSE", bad_type, "stage14-bad-type")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])


def test_hse_closed_requires_timestamp_and_open_must_be_blank():
    app = seed()

    closed_without_time = valid_hse("HSE-CLOSED-NO-TIME")
    closed_without_time["status"] = "Closed"
    result = app.create("HSE", closed_without_time, "stage14-closed-no-time")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E008" for error in result["errors"])

    open_with_time = valid_hse("HSE-OPEN-WITH-TIME")
    open_with_time["closed_at"] = "2026-09-30T20:00"
    result = app.create("HSE", open_with_time, "stage14-open-with-time")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E008" for error in result["errors"])


def test_hse_open_or_in_progress_with_timestamp_is_rejected():
    app = seed()

    for status in ("Open", "In Progress"):
        row = valid_hse(f"HSE-{status.replace(' ', '-')}-WITH-TIME")
        row["status"] = status
        row["closed_at"] = "2026-09-30T20:00"
        result = app.create("HSE", row, f"stage14-{status.lower().replace(' ', '-')}-with-time")
        assert result["status"] == "REJECTED"
        assert any(error.code == "VAL-E008" for error in result["errors"])


def test_runtime_adapter_returns_structured_validation_errors():
    app = seed()
    adapter = RuntimeAdapter(RuntimeInterface(application=app))
    row = valid_hse("HSE-ADAPTER-ERROR")
    row["closed_at"] = "2026-09-30T20:00"
    result = adapter.handle({
        "request_id": "stage14-adapter-error",
        "operation": "CREATE",
        "entity": "HSE",
        "row": row,
    })
    assert result["status"] == "REJECTED"
    assert result["errors"][0]["code"] == "VAL-E008"
    assert result["errors"][0]["field"] == "closed_at"
    assert "must be blank unless Closed" in result["errors"][0]["message"]


def test_hse_closed_with_timestamp_commits():
    app = seed()
    row = valid_hse("HSE-CLOSED")
    row["status"] = "Closed"
    row["closed_at"] = "2026-09-30T20:00"
    result = app.create("HSE", row, "stage14-closed")
    assert result["status"] == "COMMITTED"
    assert app.read("HSE", "HSE-CLOSED")["closed_at"] == "2026-09-30T20:00"


def test_current_hse_shell_contract():
    root = Path(__file__).parents[1]
    html = (root / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v35-STAGE24.html").read_text(encoding="utf-8")
    shell = (root / "ui" / "shared" / "shell-navigation-v31.js").read_text(encoding="utf-8")
    module = (root / "ui" / "modules" / "hse" / "hse.js").read_text(encoding="utf-8")

    assert 'id="hseScreen"' in html
    assert 'id="hseModal"' in html
    assert 'data-screen="HSE"' in html
    assert "shell-navigation-v31.js" in html
    assert "../ui/modules/hse/hse.js?v=20261005" in html
    assert "function syncClosedAtField()" in module
    assert "closed.disabled=true" in module
    assert "if(status==='Closed')" in module
    assert "HSE: 'hseScreen'" in shell
    assert "'HSE'" in shell
    assert "entity:'HSE'" in module
    assert "RuntimeAdapter" in module
