import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
OPERATIONS = ROOT / "ui" / "modules" / "operations" / "operations.css"
EQUIPMENT = ROOT / "ui" / "modules" / "equipment" / "equipment.css"
MAINTENANCE = ROOT / "ui" / "modules" / "maintenance" / "maintenance.css"
HSE = ROOT / "ui" / "modules" / "hse" / "hse.css"
REPORTS = ROOT / "ui" / "modules" / "reports" / "reports.css"


def rule_bodies(css: str, selector_pattern: str) -> list[str]:
    return re.findall(selector_pattern + r"\s*\{([^{}]*)\}", css, flags=re.S)


def test_operations_focus_and_timeline_title_have_no_redundant_rules():
    css = OPERATIONS.read_text(encoding="utf-8")
    focus = rule_bodies(
        css,
        r"#operationsScreen\s+\.field\s+input:hover,\s*"
        r"#operationsScreen\s+\.field\s+select:hover,\s*"
        r"#operationsScreen\s+\.field\s+input:focus,\s*"
        r"#operationsScreen\s+\.field\s+select:focus",
    )
    assert len(focus) == 1
    assert "border-color:#4d8dff" in focus[0]
    assert "#operationsScreen .field input:focus,#operationsScreen .field select:focus{border-color:#4d8dff}" not in css

    title = rule_bodies(css, r"#timelineModal\s+\.modalhead\s+\.ptitle")
    assert len(title) == 1
    for token in ("display:flex", "font-weight:700", "line-height:1", "white-space:nowrap"):
        assert token in title[0]


def test_equipment_row_actions_keep_layout_with_one_rule():
    css = EQUIPMENT.read_text(encoding="utf-8")
    rules = rule_bodies(css, r"#equipmentScreen\s+\.row-actions")
    assert len(rules) == 1
    for token in ("display:flex", "align-items:center", "justify-content:flex-start", "gap:4px", "white-space:nowrap", "overflow:visible"):
        assert token in rules[0]



def test_maintenance_boundary_has_one_min_height_declaration():
    css = MAINTENANCE.read_text(encoding="utf-8")
    boundary = rule_bodies(css, r"#maintenanceScreen\s+\.boundary")
    assert len(boundary) == 1
    assert len(re.findall(r"(?<![-\w])min-height\s*:", boundary[0])) == 1
    assert "min-height:0!important" in boundary[0]

def test_maintenance_timeline_title_keeps_complete_shared_header_style():
    css = MAINTENANCE.read_text(encoding="utf-8")
    title = rule_bodies(css, r"#maintenanceTimelineModal\s+\.modalhead\s+\.ptitle")
    assert len(title) == 1
    for token in ("display:flex", "font-weight:700", "line-height:1", "white-space:nowrap"):
        assert token in title[0]

    # Keep the compact timeline title/icon alignment intact.
    icon = rule_bodies(css, r"#maintenanceTimelineModal\s+\.modalhead\s+\.ptitle\s+\.icon")
    assert len(icon) == 1
    for token in ("flex:0 0 15px", "width:15px", "height:15px"):
        assert token in icon[0]


def test_hse_panel_title_has_one_complete_rule():
    css = HSE.read_text(encoding="utf-8")
    title = rule_bodies(css, r"#hseScreen\s+\.ptitle")
    assert len(title) == 1
    for token in ("font-size:11.5px", "font-weight:700", "display:flex", "align-items:center", "gap:6px"):
        assert token in title[0]








def test_reports_preview_body_shared_properties_are_not_repeated():
    css = REPORTS.read_text(encoding="utf-8")
    rules = rule_bodies(css, r"#reportsScreen\s+\.report-preview-body")
    assert len(rules) == 1
    for token in ("flex:1 1 auto", "min-height:0", "padding:10px", "overflow:auto", "max-height:none", "font-size:8px"):
        assert token in rules[0]

def test_reports_preview_kpi_grid_has_one_base_rule_and_mobile_override_after_it():
    css = REPORTS.read_text(encoding="utf-8")
    base = "#reportsScreen .report-preview-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}"
    assert css.count(base) == 1

    mobile = "@media(max-width:900px){#reportsScreen .report-preview-kpis{grid-template-columns:repeat(2,1fr)}}"
    assert css.count(mobile) == 1
    assert css.index(mobile) > css.index("#reportsScreen .report-preview-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}")

def test_reports_kpi_summary_mobile_columns_use_single_effective_override():
    css = REPORTS.read_text(encoding="utf-8")
    mobile_columns = "#reportsScreen .kpi-summary{grid-template-columns:repeat(2,minmax(0,1fr))}"
    assert css.count(mobile_columns) == 1
    assert "@media(max-width:1200px){" + mobile_columns + "}" in css


def test_reports_mobile_filter_grid_columns_are_not_redeclared_identically():
    css = REPORTS.read_text(encoding="utf-8")
    assert css.count("#reportsScreen .filters{grid-template-columns:1fr 1fr}") == 1
    assert "@media(max-width:900px)" in css

def test_reports_mobile_search_field_grid_column_is_declared_once():
    css = REPORTS.read_text(encoding="utf-8")
    assert css.count(".reports-search-field{grid-column:1/-1}") == 1
    assert "@media(max-width:900px)" in css

def test_reports_filter_search_field_min_width_has_one_declaration_rule():
    css = REPORTS.read_text(encoding="utf-8")
    selector = r"#reportsScreen\s+\.filters\s+\.reports-search-field"
    assert len(rule_bodies(css, selector)) == 1

def test_reports_preview_reuses_single_shared_kpi_card_and_note_rules():
    css = REPORTS.read_text(encoding="utf-8")
    for selector in (
        r"#reportsScreen\s+\.report-preview-kpis>div",
        r"#reportsScreen\s+\.report-preview-kpis\s+small",
        r"#reportsScreen\s+\.report-preview-kpis\s+b",
        r"#reportsScreen\s+\.report-preview-note",
    ):
        assert len(rule_bodies(css, selector)) == 1

    assert "#reportsScreen .report-preview-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}" in css
    assert css.count("#reportsScreen .report-preview-kpis{grid-template-columns:repeat(2,1fr)}") == 1

def test_active_artifact_refreshes_only_affected_css_cache_keys():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/modules/operations/operations.css?v=20261020-operations-graphics-slide-no-fade" in html
    assert "../ui/modules/equipment/equipment.css?v=20261019-equipment-ratio-bar" in html
    assert "../ui/modules/maintenance/maintenance.css?v=20261012-compact-view" in html
    assert "../ui/modules/hse/hse.css?v=20261011-ptitle-dedupe" in html
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html

    operations = OPERATIONS.read_text(encoding="utf-8")
    assert "grid-template-columns:repeat(3,minmax(0,1fr))" in operations
    assert "@media(max-width:560px)" in operations


def test_delete_confirmation_title_typography_is_owned_by_shared_modal_shell():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    shell = (ROOT / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    assert "#globalDeleteConfirmModal .modalhead .ptitle{" not in css
    title = rule_bodies(shell, r"\.modalback\s*>\s*\.modal\.modal-shell-valid\s*>\s*\.modalhead\s+\.ptitle")
    assert len(title) == 1
    for token in ("font-size:11.5px", "font-weight:700", "line-height:1.2"):
        assert token in title[0]
def test_delete_confirmation_footer_layout_is_owned_by_shared_modal_shell():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    shell = (ROOT / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    assert "#globalDeleteConfirmModal .modalfoot{display:flex;align-items:center;gap:8px;justify-content:flex-end}" not in css
    footer = rule_bodies(shell, r"\.modalback\s*>\s*\.modal\.modal-shell-valid\s*>\s*\.modalfoot")
    assert len(footer) >= 1
    # The first rule is the shared shell's base footer layout; later matches
    # may be intentional responsive overrides and must remain allowed.
    for token in ("display:flex", "align-items:center", "justify-content:flex-end", "gap:8px"):
        assert token in footer[0]

def test_plans_modal_title_typography_is_owned_by_shared_modal_shell():
    css = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
    shell = (ROOT / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    assert "#plansModal .modalhead .ptitle" not in css
    title = rule_bodies(shell, r"\.modalback\s*>\s*\.modal\.modal-shell-valid\s*>\s*\.modalhead\s+\.ptitle")
    assert len(title) == 1
    for token in ("font-size:11.5px", "font-weight:700", "line-height:1.2"):
        assert token in title[0]

def test_plans_delete_footer_gap_uses_shared_shell_and_keeps_mobile_override():
    css = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
    shell = (ROOT / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    contract = (ROOT / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")

    assert "#plansDeleteConfirmModal .plans-delete-confirm-foot {\n  gap:8px;\n}" not in css
    footer = rule_bodies(shell, r"\.modalback\s*>\s*\.modal\.modal-shell-valid\s*>\s*\.modalfoot")
    assert len(footer) >= 1
    assert "gap:8px" in footer[0]
    assert "'plansDeleteConfirmModal'" in contract

    # The small-screen wrapping override is intentional and must remain.
    mobile = "@media(max-width:620px)"
    assert mobile in css
    responsive = css[css.index(mobile):]
    assert "#plansDeleteConfirmModal .plans-delete-confirm-foot" in responsive
    assert "flex-wrap:wrap" in responsive


def test_delete_confirmation_controls_reuse_shared_button_geometry():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    button = (ROOT / "ui" / "shared" / "button.css").read_text(encoding="utf-8")

    local = rule_bodies(css, r"#globalDeleteConfirmModal\s+\.control")
    assert len(local) == 0

    shared = rule_bodies(button, r"\.control")
    base = next((rule for rule in shared if "height:34px" in rule and "line-height:1.1" in rule), None)
    assert base is not None
    for token in ("height:34px", "min-width:0", "padding:7px 10px", "border-radius:8px", "line-height:1.1"):
        assert token in base


def test_delete_warning_text_inherits_parent_font_size_without_redundant_rules():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    warning = rule_bodies(css, r"#globalDeleteConfirmModal\s+\.global-delete-warning")
    strong = rule_bodies(css, r"#globalDeleteConfirmModal\s+\.global-delete-warning\s+strong")
    paragraph = rule_bodies(css, r"#globalDeleteConfirmModal\s+\.global-delete-warning\s+p")
    assert len(warning) == 1
    assert len(strong) == 0
    assert len(paragraph) == 1
    assert "font-size:10.5px" in warning[0]
    assert not re.search(r"font-size\s*:", paragraph[0])
    assert "margin:5px 0 0" in paragraph[0]
    assert "line-height:1.4" in paragraph[0]

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/delete-confirm-contract.css?v=20261011-mini-font-owner" in html


def test_delete_confirmation_message_inherits_modalbody_font_size():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    js = (ROOT / "ui" / "shared" / "delete-confirm-contract.js").read_text(encoding="utf-8")

    body = rule_bodies(css, r"#globalDeleteConfirmModal\s+\.modalbody")
    message = rule_bodies(css, r"#globalDeleteConfirmModal\s+#globalDeleteMessage")
    assert len(body) == 1
    assert len(message) == 1
    assert "font-size:11px" in body[0]
    assert "line-height:1.45" in body[0]
    assert not re.search(r"font-size\s*:", message[0])
    assert "margin:0" in message[0]
    assert "color:#dbe8f5" in message[0]
    assert 'id="globalDeleteMessage"' in js

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/delete-confirm-contract.css?v=20261011-mini-font-owner" in html


def test_delete_confirmation_danger_action_uses_shared_button_variant():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    button = (ROOT / "ui" / "shared" / "button.css").read_text(encoding="utf-8")
    js = (ROOT / "ui" / "shared" / "delete-confirm-contract.js").read_text(encoding="utf-8")

    assert "#globalDeleteConfirmModal .global-delete-action{" not in css
    danger = rule_bodies(button, r"\.control\.danger")
    assert len(danger) == 1
    for token in ("background:var(--button-danger)", "border-color:var(--button-danger-border)", "color:var(--button-danger-text)"):
        assert token in danger[0]
    for token in ("--button-danger:#4b2024", "--button-danger-border:#ef4444", "--button-danger-text:#fecaca"):
        assert token in button
    assert 'class="control danger mini global-delete-action"' in js

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/delete-confirm-contract.css?v=20261011-mini-font-owner" in html


def test_global_delete_dialog_bounds_are_owned_by_shared_modal_shell():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    shell = (ROOT / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    js = (ROOT / "ui" / "shared" / "delete-confirm-contract.js").read_text(encoding="utf-8")

    dialog = rule_bodies(css, r"#globalDeleteConfirmModal\s+\.global-delete-dialog")
    shell_rules = rule_bodies(shell, r"\.modalback\s*>\s*\.modal\.modal-shell-valid")
    assert len(dialog) == 1
    assert dialog[0].strip() == "width:min(665px,calc(100vw - 48px));"
    assert len(shell_rules) >= 1
    assert "max-width:calc(100vw - 48px)" in shell_rules[0]
    assert "max-height:calc(100vh - 64px - 34px - 24px)" in shell_rules[0]
    assert "modal-shell-valid global-delete-dialog" in js

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/delete-confirm-contract.css?v=20261011-mini-font-owner" in html


def test_plans_clear_button_geometry_is_owned_by_shared_button_contract():
    css = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
    button = (ROOT / "ui" / "shared" / "button.css").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "#plansScreen .clear" not in css
    assert "#plansScreen #plansClear" not in css
    assert "#plansScreen .filters{grid-template-columns:1fr 1fr 1.1fr 1.1fr 1fr auto;height:auto}" in css

    shared = rule_bodies(button, r"\.filters\s*>\s*\.control\.clear")
    assert len(shared) == 1
    for token in ("width:56px", "min-width:56px", "max-width:56px", "height:32px", "padding:0 10px", "justify-content:center", "align-items:center", "flex:0 0 56px"):
        assert token in shared[0]

    assert "../ui/modules/plans/plans.css?v=20261011-clear-owner" in html


def test_capacity_modal_title_typography_is_owned_by_shared_modal_shell():
    css = (ROOT / "ui" / "modules" / "workfront" / "global-capacity.css").read_text(encoding="utf-8")
    shell = (ROOT / "ui" / "shared" / "modal-shell-contract.css").read_text(encoding="utf-8")
    contract = (ROOT / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")

    assert "#capacityModal .modalhead .ptitle" not in css
    title = rule_bodies(shell, r"\.modalback\s*>\s*\.modal\.modal-shell-valid\s*>\s*\.modalhead\s+\.ptitle")
    assert len(title) == 1
    for token in ("font-size:11.5px", "font-weight:700", "line-height:1.2"):
        assert token in title[0]
    assert "'capacityModal'" in contract

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/modules/workfront/global-capacity.css?v=20261015-single-close" in html


def test_capacity_controls_and_tablehead_have_single_rule_owners():
    css = (ROOT / "ui" / "modules" / "workfront" / "global-capacity.css").read_text(encoding="utf-8")
    controls = rule_bodies(css, r"#capacityModal\s+\.controls")
    assert len(controls) == 1
    for token in ("display:flex", "align-items:center", "gap:6px", "margin-bottom:10px"):
        assert token in controls[0]

    tablehead = rule_bodies(css, r"#capacityModal\s+\.tablehead")
    assert len(tablehead) == 1
    for token in ("height:38px", "padding:0 11px", "justify-content:flex-end"):
        assert token in tablehead[0]

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/modules/workfront/global-capacity.css?v=20261015-single-close" in html

def test_mini_button_variant_only_overrides_font_size():
    button = (ROOT / "ui" / "shared" / "button.css").read_text(encoding="utf-8")
    mini = rule_bodies(button, r"\.control\.mini")
    assert len(mini) == 1
    assert mini[0].strip() == "font-size:10px"

    base = rule_bodies(button, r"\.control(?=\{)")
    base_geometry = next((rule for rule in base if "height:34px" in rule and "padding:7px 10px" in rule), None)
    assert base_geometry is not None
    for token in ("height:34px", "padding:7px 10px", "border-radius:8px"):
        assert token in base_geometry

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/button.css?v=20261011-mini-base-owner" in html


def test_delete_confirmation_controls_inherit_mini_font_size():
    css = (ROOT / "ui" / "shared" / "delete-confirm-contract.css").read_text(encoding="utf-8")
    js = (ROOT / "ui" / "shared" / "delete-confirm-contract.js").read_text(encoding="utf-8")

    assert "#globalDeleteConfirmModal .control{" not in css
    for button_id in ("globalDeleteClose", "globalDeleteCancel", "globalDeleteAction"):
        match = re.search(rf'id="{button_id}" class="([^"]+)"', js)
        assert match is not None
        assert "control" in match.group(1).split()
        assert "mini" in match.group(1).split()

    html = ARTIFACT.read_text(encoding="utf-8")
    assert "../ui/shared/delete-confirm-contract.css?v=20261011-mini-font-owner" in html


def test_dashboard_typography_weights_have_single_owner_and_keep_state_rules():
    css = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    header = rule_bodies(css, r"#dashboardScreen\s+\.tablegrid\.head")
    header_weights = [rule for rule in header if re.search(r"font-weight\s*:", rule)]
    assert len(header_weights) == 1
    assert "font-weight:650" in header_weights[0]
    assert "font-weight:800" not in header_weights[0]
    assert "#dashboardScreen .tablegrid.head{font-weight:650}" not in css

    pill = rule_bodies(css, r"#dashboardScreen\s+\.pill")
    assert len(pill) == 1
    assert "font-weight:700" in pill[0]
    assert "font-weight:850" not in pill[0]
    assert "#dashboardScreen .pill{font-weight:700}" not in css

    # Keep the expanded-table display state and reduced-motion behavior unchanged.
    assert ".app.expanded-tables #dashboardScreen .tablegrid.head{display:grid}" in css
    assert "#dashboardScreen .tablegrid.head{display:none}" in css
    assert ".app.expanded-tables #dashboardScreen .tablebody{padding:8px;opacity:1;transform:translateY(0)}" in css
    assert "@media(prefers-reduced-motion:reduce)" in css
    assert "#dashboardScreen .pit,#dashboardScreen .zone,#dashboardScreen .route,#dashboardScreen .bar b,#dashboardScreen .v{opacity:1!important;transform:none!important}" in css

    assert "../ui/modules/dashboard/dashboard.css?v=20261018-material-chart-controller" in html


def test_data_management_card_keeps_only_effective_viewport_bounds():
    css = (ROOT / "ui" / "modules" / "data-management" / "data-management.css").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    # 15.6-inch baseline: retain the original modal position and its matching viewport bound.
    base = "#stage15DataModal .dm-card{width:750px;max-width:calc(100vw - 210px);max-height:calc(100vh - 96px);overflow:auto;background:#0e1d2e;border:1px solid #35506b;border-radius:12px;box-shadow:0 18px 60px #0009;pointer-events:auto}"
    assert css.count(base) == 1
    assert "#stage15DataModal{position:fixed;inset:0 0 0 84px;z-index:100;background:transparent;display:none;align-items:center;justify-content:flex-start;padding-left:202px;pointer-events:none}" in css
    assert re.search(r"body:has\(\.sidebar\.expanded\)\s*#stage15DataModal\s*\{\s*padding-left:241px;\s*\}", css)

    expanded_sidebar = rule_bodies(css, r"body\s*:\s*has\(\.sidebar\.expanded\)\s*#stage15DataModal\s+\.dm-card")
    assert len(expanded_sidebar) == 2
    assert "max-width:calc(100vw - 254px)" in expanded_sidebar[0]

    # 14-inch compact lock: normal and expanded sidebar positions remain independently tuned.
    assert "@media (max-width:1400px)" in css
    assert "#stage15DataModal{padding-left:100px}" in css
    assert "#stage15DataModal .dm-card{max-width:calc(100vw - 108px)}" in css
    assert "body:has(.sidebar.expanded) #stage15DataModal{padding-left:235px}" in css
    assert "max-width:calc(100vw - 248px)" in expanded_sidebar[1]

    assert "@media (max-width:1100px)" not in css
    assert "@media (max-width:900px)" in css
    assert "#stage15DataModal .dm-card{width:750px;max-width:calc(100vw - 96px);max-height:calc(100vh - 78px)}" in css

    # Viewport bounds must not disturb selective motion or reduced-motion handling.
    assert "@keyframes dataManagementSlideIn" in css
    assert "@keyframes dataManagementSlideOut" in css
    assert "@media(prefers-reduced-motion:reduce)" in css
    assert "../ui/modules/data-management/data-management.css?v=20261011-card-bounds-dedupe" in html
def test_reports_mobile_body_grid_has_one_effective_single_column_override():
    css = REPORTS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    ineffective = "@media(max-width:900px){#reportsScreen .report-body{grid-template-columns:1fr}}"
    effective = "@media(max-width:900px){#reportsScreen .report-body{grid-template-columns:1fr;overflow:auto}#reportsScreen .report-body>.report-panel{min-height:260px}}"
    assert ineffective not in css
    assert css.count(effective) == 1
    assert "#reportsScreen .report-body{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:8px;flex:1 1 auto;min-height:0;overflow:hidden}" in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_reports_kpi_summary_has_no_overridden_1400px_column_rule():
    css = REPORTS.read_text(encoding="utf-8")
    base = "#reportsScreen .kpi-summary{flex:0 0 auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:7px 8px}"
    mobile = "@media(max-width:1200px){#reportsScreen .kpi-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}"

    assert css.count(base) == 1
    assert "@media(max-width:1400px){#reportsScreen .kpi-summary{grid-template-columns:repeat(3,minmax(0,1fr))}}" not in css
    assert css.count(mobile) == 1
    assert css.index(mobile) > css.index(base)


def test_reports_equipment_kpi_list_drops_overridden_base_rules():
    css = REPORTS.read_text(encoding="utf-8")
    list_rules = rule_bodies(css, r"#reportsScreen\s+\.equipment-kpi-list")
    assert len(list_rules) == 2
    assert all("padding:8px 10px 0" not in rule and "max-height:300px" not in rule for rule in list_rules)
    assert "overflow:auto" not in list_rules[0]
    assert "padding:0 7px 4px" not in list_rules[0]
    assert any("flex:1 1 auto" in rule and "min-height:0" in rule and "max-height:none" in rule for rule in list_rules)
    assert any("display:flex" in rule and "gap:5px" in rule and "padding:0" in rule and "overflow:visible" in rule for rule in list_rules)
    assert ".equipment-kpi-scroll{flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;padding:0 7px 4px}" in css


def test_reports_equipment_detail_and_history_final_spacing_have_single_owner():
    css = REPORTS.read_text(encoding="utf-8")
    detail = rule_bodies(css, r"#reportsScreen\s+\.equipment-kpi-detail")
    history = rule_bodies(css, r"#reportsScreen\s+\.kpi-history-row")
    assert len(detail) == 1
    assert "margin-top:5px" in detail[0]
    assert "margin-top:6px" not in detail[0]
    assert len(history) == 1
    assert "padding:3px 0" in history[0]
    assert "font-size:7px" in history[0]
    assert "padding:5px 0" not in history[0]
    assert "font-size:8px" not in history[0]


def test_reports_kpi_lineage_base_omits_overridden_spacing_and_font_size():
    css = REPORTS.read_text(encoding="utf-8")
    canonical = "#reportsScreen .kpi-lineage{border-top:1px solid #223b55;color:#a9bbcf;line-height:1.45;padding:7px 8px;font-size:7.5px}"

    assert css.count(canonical) == 1
    assert "#reportsScreen .kpi-lineage{border-top:1px solid #223b55;color:#a9bbcf;line-height:1.45}" not in css
    assert "#reportsScreen .kpi-lineage{padding:7px 8px;font-size:7.5px}" not in css
    assert "padding:8px 10px 10px" not in css
    assert "#reportsScreen .kpi-lineage{padding:8px 10px 10px;border-top:1px solid #223b55;color:#a9bbcf;font-size:8px;line-height:1.45}" not in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")


def test_reports_kpi_history_base_omits_overridden_padding():
    css = REPORTS.read_text(encoding="utf-8")
    base = "#reportsScreen .kpi-history{border-top:1px solid #263e57}"
    later = "#reportsScreen .kpi-history{flex:0 0 58px;min-height:0;padding:6px 8px;overflow:hidden}"

    assert css.count(base) == 1
    assert css.count(later) == 1
    assert "padding:8px 10px" not in base
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")




def test_reports_kpi_exclusions_base_rule_is_removed_when_fully_overridden():
    css = REPORTS.read_text(encoding="utf-8")
    base = "#reportsScreen .kpi-exclusions{padding:0 8px 8px;max-height:120px;overflow:auto}"
    canonical = "#reportsScreen .kpi-exclusions{flex:0 0 auto;max-height:58px;overflow:auto;padding:0 7px 4px}"

    assert base not in css
    assert css.count(canonical) == 1
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")




def test_reports_equipment_kpi_summary_strong_rule_is_consolidated():
    css = REPORTS.read_text(encoding="utf-8")
    canonical = "#reportsScreen .equipment-kpi-detail summary strong{font-size:9px;text-align:center}"

    assert "#reportsScreen .equipment-kpi-detail summary strong{font-size:10px;text-align:center}" not in css
    assert css.count(canonical) == 1
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")





def test_reports_equipment_kpi_mobile_grid_override_remains_effective():
    css = REPORTS.read_text(encoding="utf-8")
    head = rule_bodies(css, r"#reportsScreen\s+\.kpi-equipment-head")
    detail = rule_bodies(css, r"#reportsScreen\s+\.equipment-kpi-detail\s+summary")
    mobile = "#reportsScreen .kpi-equipment-head,#reportsScreen .equipment-kpi-detail summary{grid-template-columns:1.15fr .95fr .72fr .72fr .72fr .72fr .72fr .88fr}"

    assert len(head) == 2  # base grid rule + later spacing-only rule
    assert "grid-template-columns:" in head[0]
    assert "grid-template-columns:" not in head[1]
    assert len(detail) == 3  # base grid rule + mobile override + final spacing rule
    assert "grid-template-columns:" in detail[0]
    assert "grid-template-columns:" in detail[1]
    assert "grid-template-columns:" not in detail[2]
    assert css.count(mobile) == 1
    assert css.index(mobile) < css.index("#reportsScreen .kpi-equipment-head{flex:0 0 28px;align-items:center}")
    assert css.index(mobile) < css.index("#reportsScreen .equipment-kpi-detail summary{min-height:38px;padding:6px 8px;font-size:8.5px}")

def test_reports_kpi_lineage_uses_one_consolidated_rule():
    css = REPORTS.read_text(encoding="utf-8")
    canonical = "#reportsScreen .kpi-lineage{border-top:1px solid #223b55;color:#a9bbcf;line-height:1.45;padding:7px 8px;font-size:7.5px}"

    assert css.count(canonical) == 1
    assert "#reportsScreen .kpi-lineage{padding:7px 8px;font-size:7.5px}" not in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")



def test_reports_kpi_card_span_base_omits_overridden_margin_top():
    css = REPORTS.read_text(encoding="utf-8")
    base = "#reportsScreen .kpi-summary-card span{display:block;color:#8fa5bb;font-size:7.5px}"
    later = "#reportsScreen .kpi-summary-card span{margin-top:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
    redundant = "#reportsScreen .kpi-summary-card span{display:block;margin-top:2px;color:#8fa5bb;font-size:7.5px}"

    assert css.count(base) == 1
    assert css.count(later) == 1
    assert redundant not in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")


def test_reports_kpi_card_base_omits_overridden_padding():
    css = REPORTS.read_text(encoding="utf-8")
    rules = rule_bodies(css, r"#reportsScreen\s+\.kpi-summary-card(?!\s+b)")
    assert len(rules) == 2
    assert "background:#0c1b2c" in rules[0]
    assert "border:1px solid #223b55" in rules[0]
    assert "border-radius:8px" in rules[0]
    assert "padding:8px" not in rules[0]
    assert "padding:7px 8px" in rules[1]
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")


def test_reports_kpi_summary_uses_single_base_layout_owner():
    css = REPORTS.read_text(encoding="utf-8")
    redundant = "#reportsScreen .kpi-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}"
    canonical = "#reportsScreen .kpi-summary{flex:0 0 auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:7px 8px}"

    assert redundant not in css
    assert css.count(canonical) == 1
    # Keep the responsive two-column rule; it serves a separate viewport contract.
    assert "@media(max-width:1200px){#reportsScreen .kpi-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}" in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")



def test_reports_kpi_value_font_size_has_no_overridden_base_declaration():
    css = REPORTS.read_text(encoding="utf-8")
    base = rule_bodies(css, r"#reportsScreen\s+\.kpi-summary-card\s+b")
    assert len(base) == 2
    assert "display:block" in base[0]
    assert "margin-top:3px" in base[0]
    assert "font-size:18px" not in base[0]
    assert "font-size:16px" in base[1]
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")


def test_reports_body_has_no_redundant_partial_base_override():
    css = REPORTS.read_text(encoding="utf-8")
    canonical = "#reportsScreen .report-body{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:8px;flex:1 1 auto;min-height:0;overflow:hidden}"
    redundant = "#reportsScreen .report-body{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:8px}"

    assert css.count(canonical) == 1
    assert "#reportsScreen .report-body{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1;min-height:0}" not in css
    assert redundant not in css
    # The mobile single-column behavior is intentionally preserved.
    assert "@media(max-width:900px){#reportsScreen .report-body{grid-template-columns:1fr;overflow:auto}#reportsScreen .report-body>.report-panel{min-height:260px}}" in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")


def test_reports_summary_has_one_effective_overflow_owner():
    css = REPORTS.read_text(encoding="utf-8")
    rules = rule_bodies(css, r"#reportsScreen\s+\.report-summary")

    assert len(rules) == 1
    assert "overflow:hidden" in rules[0]
    assert "padding:8px" in rules[0]
    assert "#reportsScreen .report-summary{overflow:auto;padding:8px}" not in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in ARTIFACT.read_text(encoding="utf-8")


def test_reports_kpi_panel_has_one_effective_overflow_and_min_height_owner():
    css = REPORTS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    # Both declarations are already supplied by the later canonical .kpi-panel rule.
    assert "#reportsScreen .report-panel.kpi-panel{min-height:0}" not in css
    assert "#reportsScreen .kpi-panel{overflow:hidden}" not in css
    owner = rule_bodies(css, r"#reportsScreen\s+\.kpi-panel")
    canonical = next((rule for rule in owner if "display:flex" in rule and "flex-direction:column" in rule), None)
    assert canonical is not None
    assert "min-height:0" in canonical
    assert "overflow:hidden" in canonical

    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_reports_kpi_event_base_owns_effective_layout_without_dead_overrides():
    css = REPORTS.read_text(encoding="utf-8")
    rules = rule_bodies(css, r"#reportsScreen\s+\.kpi-event")
    assert len(rules) == 1
    for token in ("grid-template-columns:82px 150px 1fr", "padding:4px 6px", "gap:8px", "border:1px solid #20354d"):
        assert token in rules[0]
    assert "#reportsScreen .kpi-event{grid-template-columns:1fr}" not in css
    assert "#reportsScreen .kpi-event{grid-template-columns:82px 150px 1fr;padding:4px 6px}" not in css


def test_reports_filter_grid_has_single_effective_column_owner():
    css = REPORTS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "#reportsScreen .filters{display:grid;gap:8px;align-items:end;padding:10px 12px}" in css
    assert "grid-template-columns:minmax(0,1fr) auto" not in css
    assert "#reportsScreen .filters{grid-template-columns:minmax(280px,1fr) auto 155px 155px 155px;gap:8px;align-items:end}" not in css
    assert "@media(max-width:1200px){#reportsScreen .filters{grid-template-columns:minmax(220px,1fr) auto 135px 135px 135px}}" not in css

    desktop = "#reportsScreen .filters{grid-template-columns:minmax(300px,1fr) 145px 145px 145px auto}"
    tablet = "@media(max-width:1200px){#reportsScreen .filters{grid-template-columns:minmax(220px,1fr) 125px 125px 125px auto}}"
    mobile = "@media(max-width:900px){#reportsScreen .filters{grid-template-columns:1fr 1fr}.report-filter-actions{grid-column:1/-1;justify-content:flex-start}}"
    assert css.count(desktop) == 1
    assert css.count(tablet) == 1
    assert css.count(mobile) == 1
    assert css.index(tablet) > css.index(desktop)
    assert css.index(mobile) > css.index(tablet)
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_reports_legacy_report_center_styles_are_pruned_only_when_unreferenced():
    css = REPORTS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")
    js = (ROOT / "ui" / "modules" / "reports" / "reports.js").read_text(encoding="utf-8")

    legacy_classes = (
        "report-center-head", "report-center-head-right", "report-center-controls",
        "report-center-actions", "report-center-summary", "report-center-compact-title",
    )
    for class_name in legacy_classes:
        assert class_name not in html
        assert class_name not in js
        assert "." + class_name not in css

    assert "#reportsScreen .report-center{" not in css
    assert '<div class="report-filter-actions">' in html
    assert '<div class="report-filter-buttons">' in html
    assert "#reportsScreen .report-filter-actions{position:relative" in css
    assert "#reportsScreen .report-filter-buttons{display:flex" in css
    assert "@media(max-width:900px){#reportsScreen .report-preview-kpis{grid-template-columns:repeat(2,1fr)}}" in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_report_bars_keep_one_scoped_style_owner():
    css = REPORTS.read_text(encoding="utf-8")
    js = (ROOT / "ui" / "modules" / "reports" / "reports.js").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "\n.report-bar{" not in css
    assert "\n.report-bar i{" not in css
    assert css.count("#reportsScreen .report-bar{display:block;height:7px;background:#203247;border-radius:99px;overflow:hidden}") == 1
    assert css.count("#reportsScreen .report-bar i{display:block;height:100%;background:linear-gradient(90deg,#3b82f6 0%,#2563eb 55%,#f59e0b 100%)}") == 1
    assert 'class="report-bar"' in js
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_unused_preview_section_and_source_styles_are_removed_but_active_preview_stays():
    css = REPORTS.read_text(encoding="utf-8")
    js = (ROOT / "ui" / "modules" / "reports" / "reports.js").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    for legacy_class in ("report-preview-section", "report-preview-source"):
        assert legacy_class not in css
        assert legacy_class not in js
        assert legacy_class not in html

    for active_class in ("report-preview-block", "report-preview-block-head", "report-preview-copy", "report-preview-table"):
        assert "." + active_class in css
        assert active_class in js

    assert "#reportsScreen .report-preview-body{flex:1 1 auto;min-height:0;padding:10px;overflow:auto;overscroll-behavior:contain;scrollbar-width:none;max-height:none;font-size:8px}" in css
    assert "#reportsScreen #reportPdfReaderModal.is-closing .user-guide-reader-dialog" in css
    assert "@media(prefers-reduced-motion:reduce)" in css
    assert "reportPdfReaderSlideOut" in css
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html





def test_v40_cascade_audit_records_latest_ci_and_release_status():
    audit = ROOT / "Documentation" / "Testing" / "Reports-CSS-Cascade-Audit.md"
    text = audit.read_text(encoding="utf-8")

    # Keep this contract version-neutral: the documented CI run advances as
    # audit/documentation commits are validated, so do not pin historic run IDs.
    assert "**Latest confirmed CI:** [Full Pytest #" in text
    assert "Release status:" in text
    assert "Cleanup #17" in text
    assert "Remaining `REVIEW` entries are deliberately retained" in text

def test_v40_cascade_audit_index_does_not_report_validated_cleanup_as_pending():
    index = ROOT / "Documentation" / "README.md"
    text = index.read_text(encoding="utf-8")

    assert "Cleanup #17 validated by #418/#419" in text
    assert "Cleanup #17 (`.boundary` rule consolidation) is awaiting CI" not in text

def test_reports_boundary_has_one_canonical_layout_and_final_height_override():
    css = REPORTS.read_text(encoding="utf-8")

    assert "#reportsScreen .boundary{height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden}" not in css
    assert css.count("#reportsScreen .boundary{") == 2
    assert "#reportsScreen .boundary{height:auto;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden}" in css
    assert "#reportsScreen .boundary{\n  height:auto !important;\n  flex:1 1 auto;\n  min-height:0;\n  margin:0;\n}" in css


def test_reports_status_footer_position_is_owned_by_one_rule():
    css = REPORTS.read_text(encoding="utf-8")
    footer = rule_bodies(css, r"footer\.status")

    assert len(footer) == 1
    assert "z-index:30" in footer[0]
    assert "box-sizing:border-box" in footer[0]
    assert "white-space:nowrap" in footer[0]
    assert "overflow:hidden" in footer[0]
    assert "bottom:0" in footer[0]

def test_topo3d_toolbar_has_no_ineffective_static_position_offset():
    css = (ROOT / "ui" / "modules" / "map-engine" / "map-engine.css").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    toolbar = rule_bodies(css, r"#dashboardScreen\s+\.panelhead\s+\.topo3d-toolbar")
    assert len(toolbar) == 1
    assert "position:static" in toolbar[0]
    assert "#dashboardScreen .panelhead .topo3d-toolbar{right:10px}" not in css
    assert "@media (max-width:900px){\n  #dashboardSiteMap .topo3d-status{max-width:55%}\n}" in css
    assert "../ui/modules/map-engine/map-engine.css?v=20261018-topo3d-guide-bottom-align" in html


def test_marker_location_panel_inherits_base_width_at_mobile_breakpoint():
    css = (ROOT / "ui" / "modules" / "map-engine" / "marker-location.css").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    base = rule_bodies(css, r"\.marker-location-panel")
    assert len(base) == 2
    main = next((rule for rule in base if "position:absolute" in rule), None)
    assert main is not None
    assert "width:300px" in main

    mobile = "@media(max-width:900px){.marker-location-panel{right:6px}}"
    assert mobile in css
    assert "@media(max-width:900px){.marker-location-panel{width:300px;right:6px}}" not in css
    assert "../ui/modules/map-engine/marker-location.css?v=20261012-backup-controls" in html
 
def test_material_movement_chart_uses_shared_graphic_bar_controller():
    dashboard_js = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
    graphic_bar_js = (ROOT / "ui" / "shared" / "graphicbar.js").read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")
    snapshot = (ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html").read_text(encoding="utf-8")

    assert re.search(r'href="../ui/shared/graphicbar.css\?v=[^"]+"', html)
    assert re.search(r'src="../ui/shared/graphicbar.js\?v=[^"]+"', html)
    active_css = re.search(r'href="(../ui/shared/graphicbar\.css\?v=[^"]+)"', html)
    snapshot_css = re.search(r'href="(../ui/shared/graphicbar\.css\?v=[^"]+)"', snapshot)
    assert active_css and snapshot_css
    assert active_css.group(1) == snapshot_css.group(1)
    assert "global.LithositeGraphicBar" in graphic_bar_js
    assert "renderMaterialMovement: renderMaterialMovement" in graphic_bar_js
    assert "graphicBar.renderMaterialMovement({" in dashboard_js
    assert "container.replaceChildren(fragment)" in graphic_bar_js


def test_material_movement_data_contract_stays_in_dashboard_module():
    dashboard_js = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")

    assert "String(row.status || '').trim().toUpperCase() !== 'VALIDATED'" in dashboard_js
    assert "String(row.activity || '').trim().toLowerCase() !== 'hauling'" in dashboard_js
    assert ".replace(/[_-]+/g, ' ').replace(/\\s+/g, ' ')" in dashboard_js
    assert "chartMaterialTotals" in dashboard_js
    assert "normalizeMaterial(value)" in dashboard_js
    assert "normalizeMaterial" not in (ROOT / "ui" / "shared" / "graphicbar.js").read_text(encoding="utf-8")
