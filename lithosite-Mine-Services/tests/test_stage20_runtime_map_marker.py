import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore
from mine_services import schema


def marker(marker_id="MK-RUNTIME-001"):
    return {
        "marker_id": marker_id,
        "marker_type": "HSE",
        "label": "HSE-001",
        "easting": 450000.0,
        "northing": 9700000.0,
        "elevation": 25.0,
        "source_entity": "HSE",
        "source_id": "HSE-001",
        "status": "ACTIVE",
    }


def test_stage20_a3_application_can_create_read_update_delete_mapmarker():
    store = PersistenceStore(schema_module=schema)
    app = ApplicationService(store=store)

    assert app.create("MapMarker", marker(), "mk-create")["status"] == "COMMITTED"
    assert app.read("MapMarker", "MK-RUNTIME-001")["easting"] == 450000.0

    assert app.update(
        "MapMarker",
        "MK-RUNTIME-001",
        {"easting": 450100.0},
        "mk-update",
    )["status"] == "COMMITTED"
    assert app.read("MapMarker", "MK-RUNTIME-001")["easting"] == 450100.0

    assert app.delete("MapMarker", "MK-RUNTIME-001", "mk-delete")["status"] == "COMMITTED"
    assert app.read("MapMarker", "MK-RUNTIME-001") is None


def test_stage20_a3_application_audits_mapmarker_mutations():
    store = PersistenceStore(schema_module=schema)
    app = ApplicationService(store=store)

    app.create("MapMarker", marker(), "audit-create")
    app.update("MapMarker", "MK-RUNTIME-001", {"status": "INACTIVE"}, "audit-update")
    app.delete("MapMarker", "MK-RUNTIME-001", "audit-delete")

    events = [e for e in app.store.audit() if e["entity"] == "MapMarker"]
    assert [e["action"] for e in events] == ["CREATE", "UPDATE", "DELETE"]


def test_stage20_a3_application_rejects_invalid_marker_without_persisting():
    store = PersistenceStore(schema_module=schema)
    app = ApplicationService(store=store)
    bad = marker()
    bad["northing"] = None

    result = app.create("MapMarker", bad, "bad-marker")
    assert result["status"] == "REJECTED"
    assert app.read("MapMarker") == []


def test_stage20_a3_application_rejects_duplicate_request():
    store = PersistenceStore(schema_module=schema)
    app = ApplicationService(store=store)

    assert app.create("MapMarker", marker(), "same-request")["status"] == "COMMITTED"
    duplicate = app.create("MapMarker", marker("MK-RUNTIME-002"), "same-request")
    assert duplicate["status"] == "DUPLICATE_REQUEST"


def test_stage20_a3_application_behavior_is_default():
    app = ApplicationService(PersistenceStore())
    result = app.create("MapMarker", marker(), "a3-marker")
    assert result["status"] == "COMMITTED"
