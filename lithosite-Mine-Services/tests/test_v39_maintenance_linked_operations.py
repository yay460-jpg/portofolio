from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v40-STAGE29.html").read_text(encoding="utf-8")
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
        "#maintenanceScreen .tr{grid-template-columns:100px 145px 110px 100px "
        "minmax(130px,1fr) 115px 90px 75px 90px;min-width:1080px;}"
    ) in MAINTENANCE_CSS


def test_maintenance_resolves_linked_operations_by_same_date_and_equipment():
    assert "operations:[]" in MAINTENANCE_JS
    assert "rc.request({operation:'READ',entity:'Operations'})" in MAINTENANCE_JS
    assert "function linkedOperationsFor(items)" in MAINTENANCE_JS
    assert "String(row.transaction_date||'')===date" in MAINTENANCE_JS
    assert "String(row.equipment_id||'').trim()===equipmentId" in MAINTENANCE_JS
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


def test_operations_to_maintenance_link_remains_compatible():
    assert "function maintenanceLinksFor(items)" in OPERATIONS_JS
    assert "String(row.event_date || '') === date" in OPERATIONS_JS
    assert "String(row.equipment_id || '').trim() === equipmentId" in OPERATIONS_JS
    assert "global.LithositeMaintenance.focusTrace({" in OPERATIONS_JS


def test_linked_operations_assets_use_fresh_cache_keys():
    assert "maintenance.css?v=20261029" in HTML
    assert "maintenance.js?v=20261012" in HTML
    assert "operations.css?v=20261027" in HTML
    assert "operations.js?v=20261110" in HTML
