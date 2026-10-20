import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeInterface


def make_runtime():
    return RuntimeInterface(application=ApplicationService(PersistenceStore()))


def test_read_audit_log_returns_detached_events():
    runtime = make_runtime()
    runtime._application.audit_repository.append(
        entity="Equipment",
        entity_id="EQ-READ-COPY",
        action="CREATE",
        request_id="read-copy-seed",
        new_value='{"status":"Active"}',
        source="test",
    )

    exposed = runtime.read("AuditLog")
    assert exposed
    exposed[0]["entity"] = "TamperedEntity"
    exposed[0]["new_value"] = "tampered"

    stored = runtime.read("AuditLog")
    assert stored[0]["entity"] == "Equipment"
    assert stored[0]["new_value"] == '{"status":"Active"}'


def test_read_controlled_lists_returns_detached_values():
    runtime = make_runtime()
    runtime._application.store.controlled_lists["SecurityReadTest"] = {"Allowed"}

    exposed = runtime.read("_Lists")
    exposed["SecurityReadTest"].append("Injected")

    single = runtime.read("_Lists", "SecurityReadTest")
    assert single == ["Allowed"]
