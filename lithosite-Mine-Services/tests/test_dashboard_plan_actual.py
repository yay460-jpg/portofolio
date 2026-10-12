from pathlib import Path

ROOT = Path(__file__).parents[1]
HTML = (ROOT / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
DASHBOARD_JS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
CALCULATOR = (ROOT / "ui" / "modules" / "dashboard" / "dashboard-plan-actual.js").read_text(encoding="utf-8")
PLAN_CSS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard-plan-actual.css").read_text(encoding="utf-8")
DASHBOARD_CSS = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")


def test_plan_actual_dialog_isolated_from_existing_dashboard_geometry():
    assert 'id="dashboardPlanActualOpen"' in HTML
    assert 'id="dashboardPlanActualDialog"' in HTML
    assert 'id="dashboardPlanActualClose"' in HTML
    assert 'dashboard-plan-actual.css' in HTML
    assert 'dashboard-plan-actual.js' in HTML
    assert 'dashboard.js' in HTML
    assert '#dashboardPlanActualDialog[hidden]{display:none!important}' in PLAN_CSS
    assert '#dashboardScreen .kpis{height:72px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr))' in DASHBOARD_CSS


def test_plan_actual_reads_target_plan_without_breaking_existing_dashboard_load():
    assert "async function loadPlanData()" in DASHBOARD_JS
    assert "runtimeClient.request({ operation: 'READ', entity: 'Plans' })" in DASHBOARD_JS
    assert "loadData();\n    loadPlanData();" in DASHBOARD_JS
    assert "Target Plan load failed" in DASHBOARD_JS
    assert "state.plansStatus = 'error';" in DASHBOARD_JS


def test_plan_actual_uses_validated_operations_and_existing_match_dimensions():
    assert "String(r.status||'').trim().toUpperCase()==='VALIDATED'" in CALCULATOR
    for expression in ("norm(op.domain)!==norm(p.domain)","norm(op.activity)!==norm(p.activity)","norm(op.measurement)!==norm(p.measurement)","String(op.work_front_id||'').trim()===wf","d<item.range.start||d>item.range.end"):
        assert expression in CALCULATOR


def test_plan_actual_protects_units_ambiguity_and_no_proration():
    assert "if(candidates.length>1)" in CALCULATOR
    assert "ambiguousCount" in CALCULATOR
    assert "Measurement units remain separate." in CALCULATOR
    assert "Multi-day targets are not prorated." in CALCULATOR
    assert "SHIFT_NOT_COMPARABLE" in CALCULATOR
    assert "a/target*100" in CALCULATOR


def test_plan_actual_does_not_replace_existing_dashboard_panels():
    for existing_id in ('id="dashboardSiteMap"','id="dashboardEquipmentDonut"','id="dashboardMaterialBars"','id="dashboardRecentOperationsBody"','id="dashboardIssuesAlertsBody"'):
        assert existing_id in HTML
    for call in ("updateKpis();","updateEquipmentStatus();","updateRecentOperations();","updateIssuesAlerts();","updateMaterialMovement();"):
        assert call in DASHBOARD_JS



def test_desktop_runtime_entrypoint_includes_plan_actual_feature():
    entrypoint = (ROOT / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
    launcher = (ROOT / "desktop-host" / "start-mine-services.bat").read_text(encoding="utf-8")
    assert "Artifacts/Mine-Services-Operations.html" in launcher
    assert 'id="dashboardPlanActualOpen"' in entrypoint
    assert 'id="dashboardPlanActualDialog"' in entrypoint
    assert "dashboard-plan-actual.css" in entrypoint
    assert "dashboard-plan-actual.js" in entrypoint
    assert "dashboard.js" in entrypoint
