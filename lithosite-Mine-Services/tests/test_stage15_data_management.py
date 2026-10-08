from pathlib import Path


def test_stage15_data_management_ui_contract():
    root = Path(__file__).parents[1]
    html = (root / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v37-STAGE26.html").read_text(encoding="utf-8")
    shell = (root / "ui" / "shared" / "shell-navigation.js").read_text(encoding="utf-8")
    module = (root / "ui" / "modules" / "data-management" / "data-management.js").read_text(encoding="utf-8")

    assert "Data Manage" in html
    assert "Import Data" in module
    assert "Backup / Restore" in module
    assert "Data Files" in module
    assert "SAVE_DATASET" in module
    assert "SAVE_AS_DATASET" in module
    assert "LOAD_DATASET" in module
    assert "LIST_DATASETS" in module
    assert "data-management.css?v=20261014" in html
    assert "runtime-client.js?v=20261009" in html
    assert "data-management.js?v=20261014" in html
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

    assert '"LIST_DATASETS"' in adapter
    assert '"SAVE_DATASET"' in adapter
    assert '"SAVE_AS_DATASET"' in adapter
    assert '"LOAD_DATASET"' in adapter



def test_stage15_dataset_manager_contract():
    root = Path(__file__).parents[1]
    manager = (root / "src" / "mine_services" / "dataset.py").read_text(encoding="utf-8")
    runtime = (root / "src" / "mine_services" / "runtime.py").read_text(encoding="utf-8")
    client = (root / "ui" / "shared" / "runtime-client.js").read_text(encoding="utf-8")

    assert "class DatasetManager" in manager
    assert "def save(" in manager
    assert "def save_as(" in manager
    assert "def load(" in manager
    assert "def list(" in manager
    assert "def save_dataset(" in runtime
    assert "def save_dataset_as(" in runtime
    assert "def load_dataset(" in runtime
    assert "'LOAD_DATASET'" in client

def test_stage15_uses_lithosite_owned_dataset_dialogs():
    root = Path(__file__).parents[1]
    module = (root / "ui" / "modules" / "data-management" / "data-management.js").read_text(encoding="utf-8")
    css = (root / "ui" / "modules" / "data-management" / "data-management.css").read_text(encoding="utf-8")
    assert "window.prompt(" not in module
    assert "window.confirm(" not in module
    assert "stage15DatasetDialog" in module
    assert "stage15ConfirmDialog" in module
    assert "stage15DatasetNameInput" in module
    assert "stage15ActiveDataset" not in module
    assert "stage15DatasetDialogConfirm" in module
    assert "dm-native-dialog" in css
