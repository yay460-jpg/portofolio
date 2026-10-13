from pathlib import Path
import sys

MINE_SERVICES_SRC = Path(__file__).parents[1] / "src"
sys.path.insert(0, str(MINE_SERVICES_SRC))

HOST_GUARD_ROOT = (
    Path(__file__).parents[2]
    / "Engine_Share"
    / "Security_Guard"
    / "Host_Guard"
)
sys.path.insert(0, str(HOST_GUARD_ROOT))

from mine_services import RuntimeAdapter
from security_guard import is_allowed_origin


def test_origin_policy_allows_current_host_and_documented_dev_origins(monkeypatch):
    monkeypatch.setenv("MINE_SERVICES_PORT", "8765")
    allowed = (
        "http://127.0.0.1:8765",
        "http://localhost:8765",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
    )
    assert all(is_allowed_origin(origin) for origin in allowed)


def test_origin_policy_rejects_null_and_unlisted_origins(monkeypatch):
    monkeypatch.setenv("MINE_SERVICES_PORT", "8765")
    rejected = (
        "",
        "null",
        "http://localhost:8766",
        "http://127.0.0.1:5502",
        "https://localhost:8765",
        "http://192.168.1.5:8765",
        "http://evil.example",
    )
    assert all(not is_allowed_origin(origin) for origin in rejected)


def test_origin_policy_allows_missing_origin_for_local_nonbrowser_clients(monkeypatch):
    monkeypatch.setenv("MINE_SERVICES_PORT", "8765")
    assert is_allowed_origin(None)


def test_origin_policy_tracks_configured_host_port():
    assert is_allowed_origin("http://localhost:9000", host_port=9000)
    assert not is_allowed_origin("http://localhost:9001", host_port=9000)



def test_import_rejects_unreadable_workbook_without_disclosing_local_path(tmp_path):
    missing_path = tmp_path / "private-local-folder" / "sensitive-workbook-name.xlsx"
    result = RuntimeAdapter().handle({
        "request_id": "security-import-unreadable",
        "operation": "IMPORT_XLSX",
        "path": str(missing_path),
    })

    assert result["status"] == "REJECTED"
    assert result["rows_committed"] == 0
    assert result["errors"][0]["code"] == "E001"
    message = result["errors"][0]["message"]
    assert message == "Workbook could not be opened or is not a valid XLSX file."
    assert str(tmp_path) not in message
    assert missing_path.name not in message
    assert "No such file or directory" not in message
