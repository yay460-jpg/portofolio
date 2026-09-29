from pathlib import Path

ARTIFACT = Path(__file__).parents[1] / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v21-STAGE9.html"
TEXT = ARTIFACT.read_text(encoding="utf-8")


def test_stage9_equipment_screen_exists():
    assert 'id="equipmentScreen"' in TEXT
    assert ">Equipment<" in TEXT
    assert 'entity:&#39;Equipment&#39;' in TEXT or "entity:'Equipment'" in TEXT or 'entity:"Equipment"' in TEXT


def test_stage9_equipment_fields_present():
    for field in (
        "equipment_id",
        "category",
        "type",
        "owner_type",
        "owner_name",
        "status",
        "effective_from",
        "effective_to",
    ):
        assert field in TEXT


def test_stage9_runtime_crud_contract_present():
    assert "operation:'READ',entity:'Equipment'" in TEXT
    assert "operation:'CREATE',entity:'Equipment'" in TEXT
    assert "operation:'UPDATE',entity:'Equipment'" in TEXT
    assert "operation:'DELETE',entity:'Equipment'" in TEXT
    assert "RuntimeAdapter" in TEXT


def test_stage9_reference_protection_is_runtime_authoritative():
    assert "Runtime will reject deletion if the equipment is referenced." in TEXT
    assert "Delete failed:" in TEXT


def test_stage9_no_browser_database():
    assert "indexedDB" not in TEXT.lower()
    assert "localStorage" not in TEXT


def test_stage9_controlled_vocab_contract_present():
    assert "equipment_category" in TEXT
    assert "equipment_type" in TEXT
    assert "owner_type" in TEXT
    assert "equipment_status" in TEXT


def test_stage9_navigation_available():
    assert 'Equipment' in TEXT
    assert "showScreen('dashboardScreen')" in TEXT
    assert "showScreen(label==='Equipment'?'equipmentScreen'" in TEXT or "equipmentScreen" in TEXT
