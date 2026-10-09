from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")
MAINTENANCE_JS = (ROOT / "ui" / "modules" / "maintenance" / "maintenance.js").read_text(encoding="utf-8")
MAINTENANCE_CSS = (ROOT / "ui" / "modules" / "maintenance" / "maintenance.css").read_text(encoding="utf-8")


def test_maintenance_brand_column_is_between_equipment_and_type():
    assert (
        '<div class="cell">Equipment</div><div class="cell">Brand / Merk</div>'
        '<div class="cell">Type</div><div class="cell">Maintenance Timeline</div>'
    ) in HTML
    assert (
        'esc(equipment?.unit_no||first.equipment_id||\'—\')+\'</div><div class="cell">\'+'
        'esc(equipmentBrand(equipment))+\'</div><div class="cell">\'+'
        'esc(equipment?.type||\'—\')+\'</div><div class="cell"><button class="control mini event maintenance-timeline-row"'
    ) in MAINTENANCE_JS


def test_maintenance_brand_comes_from_equipment_capacity_profile():
    assert "capacities:[]" in MAINTENANCE_JS
    assert "entity:'GlobalCapacity'" in MAINTENANCE_JS
    assert "function equipmentBrand(row)" in MAINTENANCE_JS
    assert "String(item.capacity_profile_id||'')===String(row.capacity_profile_id||'')" in MAINTENANCE_JS
    assert "String(profile.unit_brand||'—')" in MAINTENANCE_JS
    assert "<b>Brand / Merk</b>" in MAINTENANCE_JS


def test_maintenance_refresh_reloads_equipment_and_global_capacity():
    assert "const [eq,capacity,result]=await Promise.all([" in MAINTENANCE_JS
    assert "state.capacities=Array.isArray(capacity.data)?capacity.data:[]" in MAINTENANCE_JS


def test_maintenance_grid_has_an_additional_brand_column_and_fresh_assets():
    assert (
        "#maintenanceScreen .tr{grid-template-columns:110px 155px 120px 120px "
        "minmax(150px,1fr) 110px 110px 100px;min-width:1050px;}"
    ) in MAINTENANCE_CSS
    assert "maintenance.css?v=20261027" in HTML
    assert "maintenance.js?v=20261010" in HTML
