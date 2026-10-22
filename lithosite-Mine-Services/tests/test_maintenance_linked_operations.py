from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html").read_text(encoding="utf-8")
ACTIVE_ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
MAINTENANCE_JS = (ROOT / "ui" / "modules" / "maintenance" / "maintenance.js").read_text(encoding="utf-8")
MAINTENANCE_CSS = (ROOT / "ui" / "modules" / "maintenance" / "maintenance.css").read_text(encoding="utf-8")
OPERATIONS_JS = (ROOT / "ui" / "modules" / "operations" / "operations.js").read_text(encoding="utf-8")
OPERATIONS_CSS = (ROOT / "ui" / "modules" / "operations" / "operations.css").read_text(encoding="utf-8")


def test_maintenance_layout_adds_linked_operations_between_timeline_and_downtime():
    assert (
        '<div class="cell">Maintenance Timeline</div>'
        '<div class="cell">Linked Operations</div>'
        '<div class="cell">Downtime Hrs</div>'
    ) in HTML
    assert (
        "#maintenanceScreen .tr{grid-template-columns:100px 78px 145px 110px 100px "
        "minmax(130px,1fr) 115px 90px 75px 90px;min-width:1150px;}"
    ) in MAINTENANCE_CSS


def test_maintenance_resolves_linked_operations_across_night_shift_midnight():
    assert "operations:[]" in MAINTENANCE_JS
    assert "rc.request({operation:'READ',entity:'Operations'})" in MAINTENANCE_JS
    assert "function linkedOperationsFor(items)" in MAINTENANCE_JS
    assert "const maintenanceShift=String(first.shift||'').trim().toLowerCase()" in MAINTENANCE_JS
    assert "maintenanceShift!=='night'" in MAINTENANCE_JS
    assert "String(row.transaction_time||'')>='18:00'" in MAINTENANCE_JS
    assert "return date===expectedDate" in MAINTENANCE_JS
    assert "String(row.equipment_id||'').trim()!==equipmentId" in MAINTENANCE_JS
    assert "data-date=" in MAINTENANCE_JS
    assert "data-equipment=" in MAINTENANCE_JS
    assert "linkedOperations.length+' linked</button>" in MAINTENANCE_JS


def test_maintenance_link_navigates_to_and_focuses_operations():
    assert "global.LithositeShellNavigation.setScreen('Operations')" in MAINTENANCE_JS
    assert "global.LithositeOperations.focusTrace({date:date,equipmentId:equipmentId})" in MAINTENANCE_JS
    assert "function focusTrace(target)" in OPERATIONS_JS
    assert "global.LithositeOperations = Object.freeze({ focusTrace: focusTrace });" in OPERATIONS_JS
    assert "document.getElementById('date').value = date;" in OPERATIONS_JS
    assert "document.getElementById('eq').value" in OPERATIONS_JS
    assert "data-trace-key=" in OPERATIONS_JS
    assert "operation-trace-highlight" in OPERATIONS_JS
    assert "#operationsScreen .operation-trace-highlight" in OPERATIONS_CSS


def test_operations_to_maintenance_link_handles_night_shift_midnight():
    assert "function maintenanceLinksFor(items)" in OPERATIONS_JS
    assert "const nightTimeline = items.some(function (item)" in OPERATIONS_JS
    assert "const maintenanceDate = String(row.event_date || '')" in OPERATIONS_JS
    assert "String(row.shift || '').trim().toLowerCase() !== 'night'" in OPERATIONS_JS
    assert "String(item.transaction_time || '') >= '18:00'" in OPERATIONS_JS
    assert "return maintenanceDate === expectedDate" in OPERATIONS_JS
    assert "String(row.equipment_id || '').trim() !== equipmentId" in OPERATIONS_JS
    assert "global.LithositeMaintenance.focusTrace({" in OPERATIONS_JS


def test_linked_operations_assets_use_fresh_cache_keys():
    # Asset cache keys belong to the active artifact, not the frozen UI snapshot above.
    active_html = ACTIVE_ARTIFACT.read_text(encoding="utf-8")
    assert "maintenance.css?v=20261022-timeline-fit-no-horizontal-scroll-2" in active_html
    assert "maintenance.js?v=20261022-maintenance-shift-links" in active_html
    assert "operations.css?v=20261022-repair-hours-independent-tracks-2&rev=operations-timeline-label-align" in active_html
    assert "operations.js?v=20261022-unit-timeline-five-row-scroll-1&opsClose=20261019" in active_html


def test_maintenance_timeline_fits_modal_without_horizontal_scrollbar():
    assert "overflow-x:hidden;overflow-y:auto;max-height:55vh;min-width:0" in MAINTENANCE_CSS
    assert "grid-template-columns:48px 48px 74px 48px 70px 60px minmax(80px,1fr) 58px 58px 174px" in MAINTENANCE_CSS
    active_html = ACTIVE_ARTIFACT.read_text(encoding="utf-8")
    assert "maintenance.css?v=20261022-timeline-fit-no-horizontal-scroll-2" in active_html
