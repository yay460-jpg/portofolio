import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from mine_services.schema import DOMAIN_ENTITIES, SCHEMA_VERSION, SHEETS
from mine_services.schema_migration_contract import (
    CURRENT_SCHEMA_VERSION,
    TARGET_SCHEMA_VERSION,
    A2_DOMAIN_ENTITIES,
    A3_DOMAIN_ENTITIES,
    A3_SHEETS,
    A3_HEADERS_ADDITIONS,
    A3_PRIMARY_KEYS_ADDITIONS,
    target_schema_contract,
)
from mine_services.map_marker_contract import (
    MAP_MARKER_ENTITY,
    MAP_MARKER_HEADERS,
    MAP_MARKER_PRIMARY_KEY,
)


def test_stage20_schema_migration_contract_targets_a3_without_activating_it():
    assert CURRENT_SCHEMA_VERSION == "A.2"
    assert SCHEMA_VERSION == "A.2"
    assert TARGET_SCHEMA_VERSION == "A.3"


def test_stage20_schema_migration_contract_preserves_all_a2_domain_entities():
    assert A2_DOMAIN_ENTITIES == DOMAIN_ENTITIES
    assert A3_DOMAIN_ENTITIES[:-1] == DOMAIN_ENTITIES
    assert A3_DOMAIN_ENTITIES[-1] == MAP_MARKER_ENTITY


def test_stage20_schema_migration_contract_adds_only_mapmarker_to_domain_sheets():
    assert A3_SHEETS[:-2] == SHEETS[:-1]
    assert A3_SHEETS[-2:] == [MAP_MARKER_ENTITY, "AuditLog"]
    assert "MapMarker" not in SHEETS


def test_stage20_schema_migration_contract_uses_canonical_mapmarker_headers():
    assert A3_HEADERS_ADDITIONS == {MAP_MARKER_ENTITY: MAP_MARKER_HEADERS}
    assert A3_PRIMARY_KEYS_ADDITIONS == {MAP_MARKER_ENTITY: MAP_MARKER_PRIMARY_KEY}


def test_stage20_schema_migration_contract_is_explicit_and_machine_readable():
    contract = target_schema_contract()
    assert contract["from_version"] == "A.2"
    assert contract["to_version"] == "A.3"
    assert contract["added_entity"] == "MapMarker"
    assert contract["headers"]["MapMarker"] == MAP_MARKER_HEADERS
    assert contract["primary_keys"]["MapMarker"] == "marker_id"


def test_stage20_schema_migration_contract_does_not_change_active_schema():
    from mine_services import schema
    assert schema.SCHEMA_VERSION == "A.2"
    assert "MapMarker" not in schema.DOMAIN_ENTITIES
    assert "MapMarker" not in schema.SHEETS
