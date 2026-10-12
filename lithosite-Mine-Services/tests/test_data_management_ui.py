import re
from pathlib import Path

VERSIONED_MARKER = re.compile(r"(?i)\\b(?:stage[-_ ]?\\d+|v\\d+(?:\\.\\d+)*)\\b")


def test_data_management_ui_contract():
    root = Path(__file__).parents[1]
    html = (root / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
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
    runtime_client = "../ui/shared/runtime-client.js"
    data_management_css = "../ui/modules/data-management/data-management.css"
    data_management_script = "../ui/modules/data-management/data-management.js"
    assert runtime_client in html
    assert data_management_css in html
    assert data_management_script in html
    assert html.index(runtime_client) < html.index(data_management_script)
    assert "LithositeDataManagement" in module
    assert "operation: 'IMPORT_XLSX'" in module
    assert "operation: 'BACKUP'" in module
    assert "operation: 'RESTORE'" in module
    assert "global.LithositeDataManagement.open()" in shell


def test_runtime_adapter_data_operations():
    root = Path(__file__).parents[1]
    adapter = (root / "src" / "mine_services" / "adapter.py").read_text(encoding="utf-8")
    assert '"IMPORT_XLSX"' in adapter
    assert '"BACKUP"' in adapter
    assert '"RESTORE"' in adapter

    assert '"LIST_DATASETS"' in adapter
    assert '"SAVE_DATASET"' in adapter
    assert '"SAVE_AS_DATASET"' in adapter
    assert '"LOAD_DATASET"' in adapter



def test_dataset_manager_contract():
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

def test_data_management_uses_lithosite_owned_dataset_dialogs():
    root = Path(__file__).parents[1]
    module = (root / "ui" / "modules" / "data-management" / "data-management.js").read_text(encoding="utf-8")
    css = (root / "ui" / "modules" / "data-management" / "data-management.css").read_text(encoding="utf-8")
    assert "window.prompt(" not in module
    assert "window.confirm(" not in module
    assert "dataManagementDatasetDialog" in module
    assert "dataManagementConfirmDialog" in module
    assert "dataManagementDatasetNameInput" in module
    assert "dataManagementActiveDataset" not in module
    assert "dataManagementDatasetDialogConfirm" in module
    assert "dm-native-dialog" in css


def test_data_management_dom_identifiers_are_version_neutral():
    root = Path(__file__).resolve().parents[1]
    module = (root / "ui" / "modules" / "data-management" / "data-management.js").read_text(encoding="utf-8")
    css = (root / "ui" / "modules" / "data-management" / "data-management.css").read_text(encoding="utf-8")
    assert not VERSIONED_MARKER.search(module)
    assert not VERSIONED_MARKER.search(css)
    assert "dataManagementModal" in module
    assert "#dataManagementModal" in css
