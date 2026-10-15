from pathlib import Path

ROOT = Path(__file__).parents[1]
ARTIFACT = (ROOT / "Artifacts" / "Mine-Services-Operations.html").read_text(encoding="utf-8")
SNAPSHOT = (ROOT / "Documentation" / "Version-History" / "Artifacts" / "Workspace-UI-Snapshot.html").read_text(encoding="utf-8")
NIK_JS = (ROOT / "ui" / "modules" / "nik" / "nik.js").read_text(encoding="utf-8")
NIK_CSS = (ROOT / "ui" / "modules" / "nik" / "nik.css").read_text(encoding="utf-8")
SERVER = (ROOT / "desktop-host" / "server.py").read_text(encoding="utf-8")
MODAL_CONTRACT = (ROOT / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")


def test_nik_profile_column_and_preview_modal_are_synchronized():
    for html in (ARTIFACT, SNAPSHOT):
        start = html.index('id="equipmentNIKListModal"')
        end = html.index("</body>", start)
        modal = html[start:end]
        assert '<div class="equipment-nik-cell">Information</div><div class="equipment-nik-cell">Profile</div><div class="equipment-nik-cell">Action</div>' in modal
        assert 'id="equipmentNIKProfileModal"' in html
        assert 'id="equipmentNIKProfileImage"' in html
        assert 'id="equipmentNIKProfileClose"' in html
        assert 'id="equipmentNIKProfileUpload"' in html
        assert 'id="equipmentNIKProfileClear"' in html
        assert 'id="nikProfileClearConfirmModal"' in html
        assert 'id="nikProfileClearConfirmAction"' in html
        assert 'Only the photo will be removed.' in html
        assert 'id="equipmentNIKProfileFile" accept="image/*"></div></div></div><div class="modalback nik-profile-clear-confirm-modal"' in html
        assert html.rstrip().endswith("</body></html>")
        assert 'class="modalfoot equipment-nik-profile-footer"' in html
        assert 'class="equipment-nik-profile-actions-tools"' in html
        assert 'class="equipment-nik-profile-actions-help">Original image max 2 MB' in html
        assert 'id="equipmentNIKProfileFile" accept="image/*"' in html
        assert "automatically compressed to 100 KB or less" in html
        assert "nik.js?v=20261015-nik-profile-delete-confirm" in html
        assert "nik.css?v=20261015-nik-profile-delete-confirm" in html
    assert "'equipmentNIKProfileModal'," in MODAL_CONTRACT
    assert 'class="control mini view-nik-profile"' in NIK_JS
    assert "closest('.view-nik-profile')" in NIK_JS
    assert "modal.show('equipmentNIKProfileModal')" in NIK_JS
    assert "modal.show('equipmentNIKListModal')" in NIK_JS
    assert "file.size>2_000_000" in NIK_JS
    assert "blob.size<=100_000" in NIK_JS
    assert "'/nik/upload?nik_id='" in NIK_JS


def test_nik_profile_photo_uses_safe_dedicated_host_endpoint():
    assert 'NIK_PROFILE_ROOT = (DB_PATH.parent / "NIK").resolve()' in SERVER
    assert 'NIK_PROFILE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")' in SERVER
    assert 'if path == "/nik/profile":' in SERVER
    assert "def nik_profile_file(nik_id: str) -> Path | None:" in SERVER
    assert 'r"[A-Za-z0-9][A-Za-z0-9_-]{0,99}"' in SERVER
    assert 'self.send_header("X-Content-Type-Options", "nosniff")' in SERVER
    assert "MAX_NIK_PROFILE_UPLOAD_BYTES = 2_000_000" in SERVER
    assert "MAX_NIK_PROFILE_BYTES = 100_000" in SERVER
    assert 'if post_path == "/nik/upload":' in SERVER
    assert 'if post_path == "/nik/clear":' in SERVER
    assert "def _nik_record_exists(nik_id: str) -> bool:" in SERVER
    assert "fetch('/nik/clear?nik_id='" in NIK_JS
    assert "Use Upload Photo to add one." in NIK_JS


def test_nik_profile_column_has_dedicated_compact_layout():
    assert "minmax(160px,1.4fr) 90px 140px" in NIK_CSS
    assert "#equipmentNIKProfileModal .equipment-nik-profile-image" in NIK_CSS
    assert "#equipmentNIKListModal .equipment-nik-profile-action" in NIK_CSS
