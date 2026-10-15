from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = (ROOT / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
NIK_JS = (ROOT / "ui" / "modules" / "nik" / "nik.js").read_text(encoding="utf-8")
NIK_CSS = (ROOT / "ui" / "modules" / "nik" / "nik.css").read_text(encoding="utf-8")
PERSISTENCE = (ROOT / "src" / "mine_services" / "persistence.py").read_text(encoding="utf-8")
RUNTIME = (ROOT / "src" / "mine_services" / "runtime.py").read_text(encoding="utf-8")


def test_nik_register_has_action_column_and_form_title():
    start = ARTIFACT.index('id="equipmentNIKListModal"')
    modal = ARTIFACT[start:ARTIFACT.index('</body>', start)]
    assert '<div class="equipment-nik-cell">Information</div><div class="equipment-nik-cell">Profile</div><div class="equipment-nik-cell">Action</div>' in modal
    assert 'id="equipmentNIKFormTitle">Add NIK</div>' in modal


def test_nik_register_renders_edit_and_delete_actions():
    assert 'class="control mini edit-nik"' in NIK_JS
    assert 'class="control mini danger delete-nik"' in NIK_JS
    assert "closest('.edit-nik')" in NIK_JS
    assert "closest('.delete-nik')" in NIK_JS
    assert "operation:'UPDATE',entity:'NIK',entity_id:editingId,patch:row" in NIK_JS
    assert "operation:'DELETE',entity:'NIK',entity_id:id" in NIK_JS
    assert "NIK ID is locked to preserve the employee reference." in NIK_JS


def test_nik_register_action_column_has_room_for_controls():
    assert "minmax(160px,1.4fr) 90px 140px" in NIK_CSS
    assert ".equipment-nik-actions" in NIK_CSS


def test_nik_runtime_routes_update_and_delete_to_canonical_workbook():
    assert 'if entity == "NIK":' in RUNTIME
    assert "self._application.store.update_nik_record(entity_id, patch)" in RUNTIME
    assert "self._application.store.delete_nik_record(entity_id)" in RUNTIME
    assert "def update_nik_record(self, entity_id, patch):" in PERSISTENCE
    assert "def delete_nik_record(self, entity_id):" in PERSISTENCE
    assert "temp_path.replace(self.path)" in PERSISTENCE


def test_nik_edit_delete_keep_the_canonical_six_headers_and_validate_required_fields():
    assert 'record = {header: str(patch.get(header) or "").strip() for header in self.schema.NIK_HEADERS}' in PERSISTENCE
    assert 'if not record["Id No (NIK)"] or not record["Name Employment"]:' in PERSISTENCE
    assert 'Id No (NIK) cannot be changed while editing a record' in PERSISTENCE
    assert 'worksheet.delete_rows(target_row, 1)' in PERSISTENCE


def test_nik_information_field_is_editable_and_form_values_use_normal_weight():
    modal_start = ARTIFACT.index('id="equipmentNIKListModal"')
    modal = ARTIFACT[modal_start:ARTIFACT.index("</body>", modal_start)]
    assert '<input name="Information" type="text" maxlength="500" autocomplete="off">' in modal
    assert "readonly" not in modal[modal.index('name="Information"') - 30:modal.index('name="Information"') + 100]
    assert "font-weight:400" in NIK_CSS
    assert "font-weight:600;text-transform:uppercase" in NIK_CSS


def test_nik_hides_temporary_test_information_and_compacts_edit_heading():
    assert "TEMPORARY_TEST_INFORMATION='TEMPORARY TEST DATA — remove after validation'" in NIK_JS
    assert "if(String(clean.Information||'').trim()===TEMPORARY_TEST_INFORMATION)clean.Information='';" in NIK_JS
    assert "#equipmentNIKListModal .equipment-nik-form-title{font-size:13px;font-weight:600;line-height:1.25;margin:0 0 4px}" in NIK_CSS


def test_nik_register_uses_employee_icon_and_wheel_scroll_without_visible_scrollbar():
    modal_start = ARTIFACT.index('id="equipmentNIKListModal"')
    modal = ARTIFACT[modal_start:ARTIFACT.index("</body>", modal_start)]
    assert 'class="icon equipment-nik-title-icon" viewBox="0 0 24 24"' in modal
    assert "circle cx=\"12\" cy=\"8\" r=\"3.4\"" in modal
    assert "#equipmentNIKListModal .equipment-nik-table{overflow:auto;scrollbar-width:none;-ms-overflow-style:none}" in NIK_CSS
    assert "#equipmentNIKListModal .equipment-nik-table::-webkit-scrollbar{display:none;width:0;height:0}" in NIK_CSS
    assert "nik.css?v=20261015-nik-profile-view" in ARTIFACT


def test_nik_profile_column_and_preview_modal_are_wired():
    modal_start = ARTIFACT.index('id="equipmentNIKListModal"')
    modal = ARTIFACT[modal_start:ARTIFACT.index("</body>", modal_start)]
    assert '<div class="equipment-nik-cell">Profile</div>' in modal
    assert 'class="control mini view-nik-profile"' in NIK_JS
    assert "closest('.view-nik-profile')" in NIK_JS
    assert "modal.show('equipmentNIKProfileModal')" in NIK_JS
    assert 'id="equipmentNIKProfileModal"' in ARTIFACT
    assert 'id="equipmentNIKProfileImage"' in ARTIFACT
    assert 'id="equipmentNIKProfileClose"' in ARTIFACT
    assert "nik.js?v=20261015-nik-profile-view" in ARTIFACT
    assert "nik.css?v=20261015-nik-profile-view" in ARTIFACT
