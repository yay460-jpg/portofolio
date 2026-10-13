import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services import ApplicationService, PersistenceStore, RuntimeAdapter, RuntimeInterface


def valid_equipment(equipment_id="EQ-ATOMIC"):
    return {
        "equipment_id": equipment_id,
        "unit_no": "DT-ATOMIC",
        "category": "Heavy Equipment",
        "type": "Dump Truck",
        "owner_type": "Owner",
        "status": "Active",
    }


def make_adapter():
    store = PersistenceStore()
    app = ApplicationService(store=store)
    return store, app, RuntimeAdapter(RuntimeInterface(application=app))


def fail_audit(monkeypatch, app):
    def reject_audit(**kwargs):
        raise RuntimeError("simulated audit storage failure")

    monkeypatch.setattr(app.audit_repository, "append", reject_audit)


def test_create_rolls_back_runtime_when_audit_append_fails(monkeypatch):
    store, app, adapter = make_adapter()
    fail_audit(monkeypatch, app)

    result = adapter.handle({
        "request_id": "atomic-create",
        "operation": "CREATE",
        "entity": "Equipment",
        "row": valid_equipment(),
    })

    assert result["status"] == "REJECTED"
    assert not store.exists("Equipment", "EQ-ATOMIC")
    assert store.audit() == []


def test_update_rolls_back_runtime_when_audit_append_fails(monkeypatch):
    store, app, adapter = make_adapter()
    created = app.create("Equipment", valid_equipment(), "atomic-update-seed")
    assert created["status"] == "COMMITTED"
    before = store.get("Equipment", "EQ-ATOMIC")
    audit_before = store.audit()
    fail_audit(monkeypatch, app)

    result = adapter.handle({
        "request_id": "atomic-update",
        "operation": "UPDATE",
        "entity": "Equipment",
        "entity_id": "EQ-ATOMIC",
        "patch": {"status": "Inactive"},
    })

    assert result["status"] == "REJECTED"
    assert store.get("Equipment", "EQ-ATOMIC") == before
    assert store.audit() == audit_before


def test_delete_rolls_back_runtime_when_audit_append_fails(monkeypatch):
    store, app, adapter = make_adapter()
    created = app.create("Equipment", valid_equipment(), "atomic-delete-seed")
    assert created["status"] == "COMMITTED"
    before = store.get("Equipment", "EQ-ATOMIC")
    audit_before = store.audit()
    fail_audit(monkeypatch, app)

    result = adapter.handle({
        "request_id": "atomic-delete",
        "operation": "DELETE",
        "entity": "Equipment",
        "entity_id": "EQ-ATOMIC",
    })

    assert result["status"] == "REJECTED"
    assert store.get("Equipment", "EQ-ATOMIC") == before
    assert store.audit() == audit_before


import pytest
from mine_services.schema import DOMAIN_ENTITIES


@pytest.mark.parametrize("entity", [*DOMAIN_ENTITIES, "_Lists"])
def test_adapter_read_allows_only_declared_domain_entities_and_controlled_lists(entity):
    _, _, adapter = make_adapter()

    result = adapter.handle({
        "request_id": f"read-allowed-{entity}",
        "operation": "READ",
        "entity": entity,
    })

    if entity == "_Lists":
        # Controlled-list reads preserve the established flattened response contract.
        assert "equipment_category" in result
        assert isinstance(result["equipment_category"], list)
    else:
        assert result["status"] == "OK"
        assert isinstance(result["data"], list)


@pytest.mark.parametrize("entity", ["AuditLog", "UnknownEntity", "__dict__"])
def test_adapter_read_rejects_system_and_unknown_entities(entity):
    _, _, adapter = make_adapter()

    result = adapter.handle({
        "request_id": f"read-denied-{entity}",
        "operation": "READ",
        "entity": entity,
    })

    assert result["status"] == "REJECTED"
    assert result["errors"][0]["code"] == "ADP-007"
    assert result["errors"][0]["field"] == "entity"
