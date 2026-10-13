from mine_services import ApplicationService, PersistenceStore, RuntimeInterface

def test_stage16_reports_read_aggregation():
    app = ApplicationService(PersistenceStore())

    equipment = {
        "equipment_id":"EQ-RPT-01","unit_no":"DT-RPT-01",
        "category":"Heavy Equipment","type":"Dump Truck",
        "owner_type":"Owner","status":"Active"
    }
    workfront = {
        "work_front_id":"WF-RPT-01","domain":"Road & Hauling",
        "location":"Pit North","responsible":"Reports Test","status":"Active"
    }

    assert app.create("Equipment", equipment, "stage16-report-wf-create")["status"] == "COMMITTED"
    assert app.create("WorkFront", workfront, "stage16-report-wf-create-2")["status"] == "COMMITTED"

    runtime = RuntimeInterface(application=app)

    counts = {
        entity: len(runtime.read(entity))
        for entity in ("Operations","Equipment","WorkFront","Maintenance","Issues","Plans","HSE")
    }

    assert counts["Equipment"] == 1
    assert counts["WorkFront"] == 1
    assert sum(counts.values()) == 2

def test_stage16_reports_search_filter_contract():
    from pathlib import Path

    text = (Path(__file__).resolve().parents[1] / "ui" / "modules" / "reports" / "reports.js").read_text(encoding="utf-8")

    assert "JSON.stringify(r).toLowerCase().includes(text)" in text
    assert "matching records" in text
    assert "reportsSearch" in text
    assert "addEventListener('input',filteredCount)" in text
