import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeInterface, RuntimeAdapter
from mine_services import schema
from mine_services.audit import AuditRepository


def marker(marker_id="MK-E2E-001", source_id="HSE-E2E-001"):
    return {
        "marker_id": marker_id,
        "marker_type": "HSE",
        "label": source_id,
        "easting": 450000.0,
        "northing": 9700000.0,
        "elevation": 25.0,
        "source_entity": "HSE",
        "source_id": source_id,
        "status": "ACTIVE",
    }


def hse(hse_id="HSE-E2E-001"):
    return {
        "hse_id": hse_id,
        "event_date": "2026-10-02",
        "domain": "Road & Hauling",
        "work_front_id": None,
        "event_type": "Incident",
        "severity": "Medium",
        "description": "E2E spatial integrity test",
        "action": "Incident",
        "status": "Open",
        "closed_at": None,
    }


def a3_runtime():
    store = PersistenceStore(schema_module=schema)
    app = ApplicationService(store=store, schema_module=schema)
    runtime = RuntimeInterface(application=app)
    return store, app, runtime


def test_runtime_interface_crud_and_audit_for_mapmarker():
    store, app, runtime = a3_runtime()

    assert runtime.create("MapMarker", marker(), "rt-create")["status"] == "COMMITTED"
    assert runtime.read("MapMarker", "MK-E2E-001")["marker_id"] == "MK-E2E-001"

    assert runtime.update(
        "MapMarker",
        "MK-E2E-001",
        {"label": "Updated HSE"},
        "rt-update",
    )["status"] == "COMMITTED"

    assert runtime.read("MapMarker", "MK-E2E-001")["label"] == "Updated HSE"
    assert runtime.delete("MapMarker", "MK-E2E-001", "rt-delete")["status"] == "COMMITTED"

    events = runtime.read("AuditLog")
    assert [event["action"] for event in events] == ["CREATE", "UPDATE", "DELETE"]
    assert all(event["entity"] == "MapMarker" for event in events)


def test_runtime_adapter_handles_mapmarker_end_to_end():
    store = PersistenceStore(schema_module=schema)
    app = ApplicationService(store=store, schema_module=schema)
    adapter = RuntimeAdapter(RuntimeInterface(application=app))

    created = adapter.handle({
        "request_id": "adp-create",
        "operation": "CREATE",
        "entity": "MapMarker",
        "row": marker(),
    })
    assert created["status"] == "COMMITTED"

    read = adapter.handle({
        "request_id": "adp-read",
        "operation": "READ",
        "entity": "MapMarker",
        "entity_id": "MK-E2E-001",
    })
    assert read["marker_type"] == "HSE"
    assert read["source_entity"] == "HSE"
    assert read["source_id"] == "HSE-E2E-001"


def test_hse_and_spatial_marker_coexist_in_a3_runtime():
    store, app, runtime = a3_runtime()

    assert runtime.create("HSE", hse(), "hse-create")["status"] == "COMMITTED"
    assert runtime.create("MapMarker", marker(), "marker-create")["status"] == "COMMITTED"

    hse_row = runtime.read("HSE", "HSE-E2E-001")
    marker_row = runtime.read("MapMarker", "MK-E2E-001")

    assert hse_row["hse_id"] == marker_row["source_id"]
    assert marker_row["source_entity"] == "HSE"
    assert marker_row["easting"] == 450000.0
    assert marker_row["northing"] == 9700000.0
    assert marker_row["elevation"] == 25.0


def test_a3_snapshot_contains_mapmarker_and_restores_it():
    store, app, runtime = a3_runtime()
    assert runtime.create("MapMarker", marker(), "snapshot-create")["status"] == "COMMITTED"

    snapshot = runtime.backup(source="stage20-k-e")
    assert snapshot["schema_version"] == "A.3"
    assert snapshot["entity_counts"]["MapMarker"] == 1
    assert "MK-E2E-001" in snapshot["payload"]["data"]["MapMarker"]

    restored_store, restored_app, restored_runtime = a3_runtime()
    result = restored_runtime.restore(snapshot)
    assert result["status"] == "COMMITTED"
    assert restored_runtime.read("MapMarker", "MK-E2E-001")["source_id"] == "HSE-E2E-001"


def test_a3_import_pipeline_accepts_mapmarker():
    store, app, runtime = a3_runtime()

    result = runtime._importer.import_dataset({
        "MapMarker": [marker("MK-IMPORT-001", "HSE-IMPORT-001")]
    })
    assert result["status"] == "COMMITTED"
    assert store.get("MapMarker", "MK-IMPORT-001")["source_entity"] == "HSE"


def test_a3_runtime_interface_accepts_mapmarker_by_default():
    runtime = RuntimeInterface(application=ApplicationService(PersistenceStore(schema_module=schema)))

    result = runtime.create("MapMarker", marker("MK-A3-001"), "a3-create")
    assert result["status"] == "COMMITTED"
