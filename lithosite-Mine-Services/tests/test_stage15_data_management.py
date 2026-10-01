from pathlib import Path


def test_stage15_data_management_ui_contract():
    root = Path(__file__).parents[1]
    html = (root / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v32-STAGE20.html").read_text(encoding="utf-8")
    shell = (root / "ui" / "shared" / "shell-navigation-v31.js").read_text(encoding="utf-8")
    module = (root / "ui" / "modules" / "data-management" / "data-management.js").read_text(encoding="utf-8")

    assert "Data Manage" in html
    assert "Import Data" in module
    assert "Backup / Restore" in module
    assert "data-management.js?v=20261001" in html
    assert "LithositeDataManagement" in module
    assert "operation: 'IMPORT_XLSX'" in module
    assert "operation: 'BACKUP'" in module
    assert "operation: 'RESTORE'" in module
    assert "global.LithositeDataManagement.open()" in shell


def test_stage15_runtime_adapter_data_operations():
    root = Path(__file__).parents[1]
    adapter = (root / "src" / "mine_services" / "adapter.py").read_text(encoding="utf-8")
    assert '"IMPORT_XLSX"' in adapter
    assert '"BACKUP"' in adapter
    assert '"RESTORE"' in adapter

