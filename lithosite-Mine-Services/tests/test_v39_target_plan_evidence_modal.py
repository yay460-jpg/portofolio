from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
HOST = (ROOT / "desktop-host" / "server.py").read_text(encoding="utf-8")
MODAL_CONTRACT = (ROOT / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")
EVIDENCE_README = (ROOT / "Database" / "Evidence" / "README.md").read_text(encoding="utf-8")


def test_target_plan_evidence_is_a_trigger_button_between_status_and_actions():
    assert (
        '<div class="cell">Status</div><div class="cell">Evidence</div>'
        '<div class="cell">Actions</div>'
    ) in HTML
    assert (
        '<div class="cell evidence-cell"><button type="button" class="control mini view-evidence" '
        'data-id="\'+esc(r.plan_id)+\'">View</button></div>'
    ) in PLANS_JS
    assert 'class="cell status-cell"' in PLANS_JS
    assert 'class="cell row-actions"' in PLANS_JS
    assert PLANS_JS.index('class="cell status-cell"') < PLANS_JS.index('class="cell evidence-cell"') < PLANS_JS.index('class="cell row-actions"')


def test_evidence_modal_is_registered_with_the_shared_modal_shell():
    assert 'id="planEvidenceModal"' in HTML
    assert 'id="planEvidenceClose"' in HTML
    assert 'id="planEvidenceRefresh"' in HTML
    assert 'id="planEvidencePreview"' in HTML
    assert "'planEvidenceModal'" in MODAL_CONTRACT
    assert "LithositeModalShowContract.show('planEvidenceModal')" in PLANS_JS
    assert "LithositeModalShowContract.close('planEvidenceModal')" in PLANS_JS


def test_evidence_modal_is_read_only_and_does_not_offer_upload():
    modal_start = HTML.index('id="planEvidenceModal"')
    modal_end = HTML.index('</div></div></section><section id="hseScreen"', modal_start)
    modal_markup = HTML[modal_start:modal_end]
    assert 'type="file"' not in modal_markup
    assert 'id="planEvidenceUpload"' not in modal_markup
    assert "Upload is not enabled here." in modal_markup
    assert "evidence/list?module=TargetPlan&record_id=" in PLANS_JS
    assert "evidence/file?module=TargetPlan&record_id=" in PLANS_JS
    assert "renderEvidenceFiles(activeEvidenceFiles)" in PLANS_JS


def test_evidence_preview_handles_pdf_images_and_word_documents():
    assert "application/pdf" in PLANS_JS
    assert "indexOf('image/')===0" in PLANS_JS
    assert "Download document" in PLANS_JS
    assert "class=\"evidence-pdf\"" in PLANS_JS
    assert "class=\"evidence-image\"" in PLANS_JS
    assert "target_plan" not in PLANS_JS.lower()


def test_evidence_endpoint_is_scoped_to_allowed_modules_and_extensions():
    assert 'EVIDENCE_MODULES = frozenset({"TargetPlan", "HSE", "Maintenance"})' in HOST
    for extension in ('".pdf"', '".jpg"', '".jpeg"', '".png"', '".doc"', '".docx"'):
        assert extension in HOST
    assert 'if path in {"/evidence/list", "/evidence/file"}:' in HOST
    assert "evidence_record_directory(module, record_id)" in HOST
    assert 'or "/" in filename' in HOST
    assert 'or "\\\\" in filename' in HOST
    assert "evidence/upload" not in HOST


def test_central_evidence_folder_is_documented_for_the_three_modules():
    for folder in (
        "Database/Evidence/TargetPlan/<plan_id>/",
        "Evidence/HSE/<hse_id>/",
        "Evidence/Maintenance/<maintenance_id>/",
    ):
        assert folder in EVIDENCE_README
    assert "JPG / JPEG / PNG" in EVIDENCE_README
    assert "DOC / DOCX" in EVIDENCE_README
    assert (ROOT / "Database" / "Evidence" / "TargetPlan" / ".gitkeep").exists()
    assert (ROOT / "Database" / "Evidence" / "HSE" / ".gitkeep").exists()
    assert (ROOT / "Database" / "Evidence" / "Maintenance" / ".gitkeep").exists()


def test_evidence_viewer_assets_use_current_cache_keys():
    assert "plans.js?v=20261019" in HTML
    assert "plans.css?v=20261107" in HTML
    assert "modal-show-contract.js?v=20261026" in HTML
