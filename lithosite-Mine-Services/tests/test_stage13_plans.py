import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService


def valid_work_front(work_front_id="WF-PLAN-01"):
    return {
        "work_front_id": work_front_id,
        "domain": "Road & Hauling",
        "location": "Pit North",
        "responsible": "Operations Team",
        "status": "Active",
    }


def valid_plan(plan_id="PLN-01"):
    return {
        "plan_id": plan_id,
        "period": "2026-10",
        "domain": "Road & Hauling",
        "work_front_id": "WF-PLAN-01",
        "activity": "Hauling target",
        "target_quantity": 1200,
        "measurement": "ton",
        "target_hours": 8,
        "status": "Draft",
    }


def seed():
    app = ApplicationService()
    assert app.create("WorkFront", valid_work_front(), "stage13-wf")["status"] == "COMMITTED"
    return app


def test_plans_crud_and_audit():
    app = seed()
    assert app.create("Plans", valid_plan(), "stage13-create")["status"] == "COMMITTED"
    legacy_plan = app.read("Plans", "PLN-01")
    assert legacy_plan["target_quantity"] == 1200
    assert legacy_plan["start_date"] == "2026-10-01"
    assert legacy_plan["end_date"] == "2026-10-31"

    updated = app.update(
        "Plans",
        "PLN-01",
        {"target_quantity": 1500, "target_hours": 9},
        "stage13-update",
    )
    assert updated["status"] == "COMMITTED"
    assert app.read("Plans", "PLN-01")["target_quantity"] == 1500

    deleted = app.delete("Plans", "PLN-01", "stage13-delete")
    assert deleted["status"] == "COMMITTED"
    assert app.read("Plans", "PLN-01") is None
    assert [event["action"] for event in app.store.audit()] == ["CREATE", "CREATE", "UPDATE", "DELETE"]


def test_plans_fk_and_controlled_values_are_rejected():
    app = seed()

    bad_fk = valid_plan("PLN-BAD-FK")
    bad_fk["work_front_id"] = "NO-SUCH-WORK-FRONT"
    result = app.create("Plans", bad_fk, "stage13-bad-fk")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E005" for error in result["errors"])

    bad_domain = valid_plan("PLN-BAD-DOMAIN")
    bad_domain["domain"] = "Not A Controlled Domain"
    result = app.create("Plans", bad_domain, "stage13-bad-domain")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])

    bad_measurement = valid_plan("PLN-BAD-UNIT")
    bad_measurement["measurement"] = "Not A Unit"
    result = app.create("Plans", bad_measurement, "stage13-bad-measurement")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])

    bad_status = valid_plan("PLN-BAD-STATUS")
    bad_status["status"] = "Not A Plan Status"
    result = app.create("Plans", bad_status, "stage13-bad-status")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E006" for error in result["errors"])


def test_plans_period_and_numeric_validation():
    app = seed()

    bad_period = valid_plan("PLN-BAD-PERIOD")
    bad_period["period"] = "2026-13"
    result = app.create("Plans", bad_period, "stage13-bad-period")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E009" for error in result["errors"])

    bad_quantity = valid_plan("PLN-BAD-QTY")
    bad_quantity["target_quantity"] = -1
    result = app.create("Plans", bad_quantity, "stage13-bad-qty")
    assert result["status"] == "REJECTED"
    assert any(error.code == "VAL-E007" for error in result["errors"])


def test_v27_plans_shell_contract():
    root = Path(__file__).parents[1]
    html = (root / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")
    shell = (root / "ui" / "shared" / "shell-navigation.js").read_text(encoding="utf-8")
    module = (root / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")

    assert 'id="plansScreen"' in html
    assert 'id="plansModal"' in html
    assert "shell-navigation.js?v=20261011" in html
    assert "../ui/modules/plans/plans.js?v=20261013" in html
    assert "Plans: 'plansScreen'" in shell
    assert "let initialized = false;" in shell
    assert "event.preventDefault();" in shell
    assert "event.stopPropagation();" in shell
    assert "const STORAGE_KEY = 'lithosite-active-screen';" in shell
    assert "sessionStorage.setItem(STORAGE_KEY, name)" in shell
    assert "sessionStorage.getItem(STORAGE_KEY)" in shell
    assert "setScreen(readInitialScreen(), false);" in shell
    assert "LithositeShellNavigation" not in module
    for screen in ["Dashboard", "Operations", "Equipment", "Work Front", "Maintenance", "Issues", "Plans"]:
        assert f'data-screen="{screen}"' in html
    assert "'Plans'" in shell
    assert "entity:'Plans'" in module
    assert "RuntimeAdapter" in module







