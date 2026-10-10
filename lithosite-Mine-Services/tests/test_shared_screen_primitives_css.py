import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
MODULE_RULES = {
    "operations/operations.css": ("#operationsScreen .controls", "#operationsScreen .icon", "#operationsScreen .empty"),
    "equipment/equipment.css": ("#equipmentScreen .controls", "#equipmentScreen .empty"),
    "issues/issues.css": ("#issuesScreen .controls", "#issuesScreen .icon", "#issuesScreen .empty"),
    "checker/checker.css": ("#checkerScreen .controls", "#checkerScreen .empty"),
    "maintenance/maintenance.css": ("#maintenanceScreen .controls", "#maintenanceScreen .icon"),
    "plans/plans.css": ("#plansScreen .controls", "#plansScreen .icon"),
    "hse/hse.css": ("#hseScreen .controls", "#hseScreen .icon"),
    "workfront/workfront.css": ("#workfrontScreen .icon", ".wfempty"),
}


def read(path):
    return path.read_text(encoding="utf-8")


def compact(text):
    return re.sub(r"\s+", "", re.sub(r"/\*[\s\S]*?\*/", "", text))


def test_active_shell_owns_shared_control_icon_and_empty_state_rules():
    html = compact(read(ARTIFACT))
    assert ".controls{display:flex;gap:7px}" in html
    assert ".icon{width:15px;height:15px;display:block;color:currentColor}" in html
    expected = (
        "#operationsScreen .empty,#equipmentScreen .empty,#issuesScreen .empty,"
        "#checkerScreen .empty,#workfrontScreen .wfempty{display:grid;place-items:center;"
        "height:140px;color:#8ea3ba;font-size:10px}"
    )
    assert compact(expected) in html


def test_module_duplicates_are_removed_from_css():
    for relative, selectors in MODULE_RULES.items():
        css = compact(read(ROOT / "ui" / "modules" / relative))
        for selector in selectors:
            assert f"{compact(selector)}{{" not in css, (
                f"Shared screen primitive remains module-owned in {relative}: {selector}"
            )


def test_nonuniform_empty_states_remain_module_specific():
    plans = compact(read(ROOT / "ui" / "modules" / "plans" / "plans.css"))
    hse = compact(read(ROOT / "ui" / "modules" / "hse" / "hse.css"))
    workfront = compact(read(ROOT / "ui" / "modules" / "workfront" / "workfront.css"))
    maintenance = compact(read(ROOT / "ui" / "modules" / "maintenance" / "maintenance.css"))
    assert compact("#plansScreen .empty{padding:22px;color:#8ea3ba;font-size:10px;text-align:center;}") in plans
    assert compact("#hseScreen .empty{padding:22px;text-align:center;color:#8ea3ba;font-size:10px}") in hse
    assert compact("#workfrontScreen .empty{display:grid;place-items:center;height:140px;width:100%;color:#8ea3ba;font-size:10px;text-align:center}") in workfront
    assert compact("#maintenanceScreen .grid #maintenanceRows .empty{display:grid;place-items:center;width:100%;height:100%;min-height:140px;padding:20px;color:#8ea3ba;font-size:10px}") in maintenance


def test_shared_rules_live_in_active_shell_after_stylesheet_links():
    html = read(ARTIFACT)
    assert html.index("screen-header.css") < html.index("#operationsScreen .empty")
    assert html.index("</head>") > html.index("#operationsScreen .empty")
