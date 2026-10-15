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
        assert "nik.js?v=20261015-nik-profile-view" in html
        assert "nik.css?v=20261015-nik-profile-view" in html
    assert "'equipmentNIKProfileModal'," in MODAL_CONTRACT
    assert 'class="control mini view-nik-profile"' in NIK_JS
    assert "closest('.view-nik-profile')" in NIK_JS
    assert "modal.show('equipmentNIKProfileModal')" in NIK_JS
    assert "modal.show('equipmentNIKListModal')" in NIK_JS


def test_nik_profile_photo_uses_safe_dedicated_host_endpoint():
    assert 'NIK_PROFILE_ROOT = (DB_PATH.parent / "NIK").resolve()' in SERVER
    assert 'NIK_PROFILE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")' in SERVER
    assert 'if path == "/nik/profile":' in SERVER
    assert "def nik_profile_file(nik_id: str) -> Path | None:" in SERVER
    assert 'r"[A-Za-z0-9][A-Za-z0-9_-]{0,99}"' in SERVER
    assert 'self.send_header("X-Content-Type-Options", "nosniff")' in SERVER
    assert "MAX_NIK_PROFILE_BYTES = 15_000_000" in SERVER


def test_nik_profile_column_has_dedicated_compact_layout():
    assert "minmax(160px,1.4fr) 90px 140px" in NIK_CSS
    assert "#equipmentNIKProfileModal .equipment-nik-profile-image" in NIK_CSS
    assert "#equipmentNIKListModal .equipment-nik-profile-action" in NIK_CSS
