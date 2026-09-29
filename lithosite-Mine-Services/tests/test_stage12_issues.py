import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService


def valid_equipment(equipment_id="EQ-ISS-01"):
    return {
        "equipment_id": equipment_id,
        "unit_no": "DT-001",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def valid_work_front(work_front_id="WF-ISS-01"):
    return {
        "work_front_id": work_front_id,
        "domain": "Road & Hauling",
        "location": "Pit North",
        "responsible": "Operations Team",
        "status": "Active",
    }


def valid_issue(issue_id="ISS-01"):
    return {
        "issue_id": issue_id,
        "issue_date": "2026-09-29",
        "domain": "Road & Hauling",
        "work_front_id": "WF-ISS-01",
        "equipment_id": "EQ-ISS-01",
        "description": "Haul road condition requires inspection.",
        "severity": "Medium",
        "status": "Open",
        "assigned_to": "Operations Team",
    }


def seed():
    app = ApplicationService()
    assert app.create("Equipment", valid_equipment(), "stage12-eq")["status"] == "COMMITTED"
    assert app.create("WorkFront", valid_work_front(), "stage12-wf")["status"] == "COMMITTED"
    return app


def test_issues_crud_and_audit():
    app = seed()
    assert app.create("Issues", valid_issue(), "stage12-create")["status"] == "COMMITTED"
    assert app.read("Issues", "ISS-01")["severity"] == "Medium"

    updated = app.update(
        "Issues",
        "ISS-01",
        {"status": "In Progress", "assigned_to": "Maintenance Team"},
        "stage12-update",
    )
    assert updated["status"] == "COMMITTED"
    assert app.read("Issues", "ISS-01")["status"] == "In Progress"

    deleted = app.delete("Issues", "ISS-01", "stage12-delete")
    assert deleted["status"] == "COMMITTED"
    assert app.read("Issues", "ISS-01") is None
    assert [event["action"] for event in app.store.audit()] == ["CREATE", "CREATE", "CREATE", "UPDATE", "DELETE"]


def test_issues_fk_and_controlled_values_are_rejected():
    app = seed()

    bad_fk = valid_issue("ISS-BAD-FK")
    bad_fk["equipment_id"] = "NO-SUCH-EQUIPMENT"
    result = app.create("Issues", bad_fk, "stage12-bad-fk")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E005" for error in result["errors"])

    bad_wf = valid_issue("ISS-BAD-WF")
    bad_wf["work_front_id"] = "NO-SUCH-WORK-FRONT"
    result = app.create("Issues", bad_wf, "stage12-bad-wf")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E005" for error in result["errors"])

    bad_enum = valid_issue("ISS-BAD-ENUM")
    bad_enum["severity"] = "Extreme"
    result = app.create("Issues", bad_enum, "stage12-bad-enum")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])

    bad_domain = valid_issue("ISS-BAD-DOMAIN")
    bad_domain["domain"] = "Not A Controlled Domain"
    result = app.create("Issues", bad_domain, "stage12-bad-domain")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])


def test_issues_closed_requires_timestamp_and_open_must_be_blank():
    app = seed()

    closed_without_time = valid_issue("ISS-CLOSED-NO-TIME")
    closed_without_time["status"] = "Closed"
    result = app.create("Issues", closed_without_time, "stage12-closed-no-time")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E008" for error in result["errors"])

    open_with_time = valid_issue("ISS-OPEN-WITH-TIME")
    open_with_time["closed_at"] = "2026-09-29T20:00"
    result = app.create("Issues", open_with_time, "stage12-open-with-time")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E008" for error in result["errors"])


def test_issues_closed_with_timestamp_commits_and_audits():
    app = seed()
    row = valid_issue("ISS-CLOSED")
    row["status"] = "Closed"
    row["closed_at"] = "2026-09-29T20:00"
    result = app.create("Issues", row, "stage12-closed")
    assert result["status"] == "COMMITTED"
    assert app.read("Issues", "ISS-CLOSED")["closed_at"] == "2026-09-29T20:00"


def test_v24_issues_shell_contract():
    root = Path(__file__).parents[1]
    html = (root / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v24-STAGE12.html").read_text(encoding="utf-8")
    shell = (root / "ui" / "shared" / "shell-navigation-v24.js").read_text(encoding="utf-8")
    module = (root / "ui" / "modules" / "issues" / "issues.js").read_text(encoding="utf-8")

    assert 'id="issuesScreen"' in html
    assert 'id="issuesModal"' in html
    assert "shell-navigation-v24.js?v=20260929" in html
    assert "../ui/modules/issues/issues.js?v=20260930" in html
    assert "Issues: 'issuesScreen'" in shell
    assert "'Issues'" in shell
    assert "entity:'Issues'" in module
    assert "RuntimeAdapter" in module
