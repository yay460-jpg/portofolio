from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html").read_text(encoding="utf-8")
PLANS_JS = (ROOT / "ui" / "modules" / "plans" / "plans.js").read_text(encoding="utf-8")
PLANS_CSS = (ROOT / "ui" / "modules" / "plans" / "plans.css").read_text(encoding="utf-8")
EVIDENCE_JS = (ROOT / "ui" / "shared" / "evidence" / "evidence.js").read_text(encoding="utf-8")
EVIDENCE_CSS = (ROOT / "ui" / "shared" / "evidence" / "evidence.css").read_text(encoding="utf-8")
HOST = (ROOT / "desktop-host" / "server.py").read_text(encoding="utf-8")
MODAL_CONTRACT = (ROOT / "ui" / "shared" / "modal-show-contract.js").read_text(encoding="utf-8")
EVIDENCE_README = (ROOT / "Database" / "Evidence" / "README.md").read_text(encoding="utf-8")


def test_target_plan_evidence_is_a_trigger_button_between_status_and_actions():
    assert (
        '<div class="cell">Status</div><div class="cell">Evidence</div>'
        '<div class="cell">Actions</div>'
    ) in HTML
    assert (
        """<div class="cell evidence-cell"><button type="button" class="control mini view-evidence" data-id="'+esc(r.plan_id)+'">View</button></div>"""
    ) in PLANS_JS
    assert 'class="cell status-cell"' in PLANS_JS
    assert 'class="cell row-actions"' in PLANS_JS
    assert PLANS_JS.index('class="cell status-cell"') < PLANS_JS.index('class="cell evidence-cell"') < PLANS_JS.index('class="cell row-actions"')


def test_evidence_modal_is_a_generic_shared_component_registered_with_the_shell():
    assert 'id="evidenceModal"' in HTML
    assert 'id="evidenceClose"' in HTML
    assert 'id="evidenceRefresh"' in HTML
    assert 'id="evidencePreview"' in HTML
    assert 'id="evidenceModuleLabel"' in HTML
    assert 'id="evidenceIconUse"' in HTML
    assert '<span>Preview</span><span class="evidence-preview-label" id="evidencePreviewLabel" aria-live="polite"></span>' in HTML
    assert 'id="planEvidenceModal"' not in HTML
    assert "'evidenceModal'" in MODAL_CONTRACT
    assert "global.LithositeModalShowContract.show('evidenceModal')" in EVIDENCE_JS
    assert "global.LithositeModalShowContract.close('evidenceModal')" in EVIDENCE_JS


def test_target_plan_calls_shared_evidence_api_instead_of_owning_viewer_logic():
    assert "global.LithositeEvidence.open({" in PLANS_JS
    assert "module:'TargetPlan'" in PLANS_JS
    assert "recordId:recordId" in PLANS_JS
    assert "allowUpload:true" in PLANS_JS
    assert "function openPlanEvidence(planId)" in PLANS_JS
    assert "async function previewEvidenceFile" not in PLANS_JS
    assert "async function uploadSelectedEvidenceFiles" not in PLANS_JS
    assert "function refreshPlanEvidenceList" not in PLANS_JS


def test_shared_evidence_upload_uses_managed_storage_without_a_folder_picker():
    modal_start = HTML.index('id="evidenceModal"')
    modal_end = HTML.index('</div></div></section><section id="hseScreen"', modal_start)
    modal_markup = HTML[modal_start:modal_end]
    assert modal_markup.count(">Close</button>") == 1
    assert 'id="evidenceUploadButton"' in modal_markup
    assert 'id="evidenceUploadInput"' in modal_markup
    assert 'type="file"' in modal_markup
    assert 'multiple hidden' in modal_markup
    assert 'accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"' in modal_markup
    assert "Upload destination managed by Desktop Host" in modal_markup
    assert "uploadFiles(event.target.files)" in EVIDENCE_JS
    assert "runtime.HOST + '/evidence/upload?'" in EVIDENCE_JS
    assert "runtime.HOST + '/evidence/list?module='" in EVIDENCE_JS
    assert "allowUpload: input.allowUpload === true && moduleName === 'TargetPlan'" in EVIDENCE_JS
    assert "id=\"evidenceUploadButton\"" not in PLANS_JS


def test_shared_evidence_preview_handles_pdf_images_and_word_documents():
    assert "application/pdf" in EVIDENCE_JS
    assert "mime.indexOf('image/') === 0" in EVIDENCE_JS
    assert "Download document" in EVIDENCE_JS
    assert 'class="evidence-pdf"' in EVIDENCE_JS
    assert 'class="evidence-image"' in EVIDENCE_JS
    assert "function setPreviewLabel(label, filename)" in EVIDENCE_JS
    assert "setPreviewLabel('PDF preview', file.name)" in EVIDENCE_JS
    assert "setPreviewLabel('Image preview', file.name)" in EVIDENCE_JS
    assert "evidence-preview-toolbar" not in EVIDENCE_JS
    assert "#evidenceModal .evidence-preview-label" in EVIDENCE_CSS
    assert "method: 'POST'" in EVIDENCE_JS
    assert "body: JSON.stringify({" in EVIDENCE_JS
    assert "const binary = atob(payload.data)" in EVIDENCE_JS
    assert "URL.createObjectURL(blob)" in EVIDENCE_JS
    assert "Open file" not in EVIDENCE_JS


def test_shared_evidence_api_validates_record_context_and_scopes_upload_capability():
    assert "const ALLOWED_MODULES = new Set(['TargetPlan', 'HSE', 'Maintenance'])" in EVIDENCE_JS
    assert "open: open" in EVIDENCE_JS
    assert "close: close" in EVIDENCE_JS
    assert "refresh: refresh" in EVIDENCE_JS
    assert "if (!ALLOWED_MODULES.has(moduleName)" in EVIDENCE_JS
    assert "input.allowUpload === true && moduleName === 'TargetPlan'" in EVIDENCE_JS
    assert "record_id: context.recordId" in EVIDENCE_JS
    assert "MODULE_ICON_HREFS" in EVIDENCE_JS
    assert "function clearSessionAfterExternalClose()" in EVIDENCE_JS
    assert "new MutationObserver(clearSessionAfterExternalClose)" in EVIDENCE_JS
    assert "moduleName.toUpperCase()" in EVIDENCE_JS


def test_evidence_endpoint_is_scoped_to_allowed_modules_and_extensions():
    assert 'EVIDENCE_MODULES = frozenset({"TargetPlan", "HSE", "Maintenance"})' in HOST
    for extension in ('".pdf"', '".jpg"', '".jpeg"', '".png"', '".doc"', '".docx"'):
        assert extension in HOST
    assert 'if path in {"/evidence/list", "/evidence/file"}:' in HOST
    assert 'if post_path == "/evidence/upload":' in HOST
    assert 'if post_path == "/evidence/preview":' in HOST
    assert "_evidence_filename_error(filename, EVIDENCE_EXTENSIONS)" in HOST
    assert "_target_plan_exists(record_id)" in HOST
    assert "evidence_record_directory(module, record_id)" in HOST
    assert 'or "/" in filename' in HOST
    assert "Path(filename).name != filename" in HOST
    assert 'with target_file.open("xb") as stream:' in HOST


def test_central_evidence_folder_is_documented_for_the_three_modules():
    for folder in (
        "Evidence/TargetPlan/<plan_id>/",
        "Evidence/HSE/<hse_id>/",
        "Evidence/Maintenance/<maintenance_id>/",
    ):
        assert folder in EVIDENCE_README
    assert "JPG / JPEG / PNG" in EVIDENCE_README
    assert "DOC / DOCX" in EVIDENCE_README
    assert (ROOT / "Database" / "Evidence" / "TargetPlan" / ".gitkeep").exists()
    assert (ROOT / "Database" / "Evidence" / "HSE" / ".gitkeep").exists()
    assert (ROOT / "Database" / "Evidence" / "Maintenance" / ".gitkeep").exists()


def test_shared_evidence_assets_use_current_cache_keys_and_load_before_plans():
    assert "plans.js?v=20261030" in HTML
    assert "plans.css?v=20261112" in HTML
    assert "evidence.js?v=20261014" in HTML
    assert "evidence.css?v=20261010" in HTML
    assert "modal-show-contract.js?v=20261028" in HTML
    assert HTML.index("runtime-client.js") < HTML.index("evidence.js?v=20261014")
    assert HTML.index("modal-show-contract.js?v=20261028") < HTML.index("evidence.js?v=20261014")
    assert HTML.index("evidence.js?v=20261014") < HTML.index("plans.js?v=20261030")
    assert HTML.index("evidence.css?v=20261010") < HTML.index("</head>")
    assert "#evidenceModal .evidence-layout" in EVIDENCE_CSS
    assert "#evidenceModal .evidence-layout" not in PLANS_CSS
    assert "#planEvidenceModal" not in EVIDENCE_CSS


def test_plan_delete_uses_a_lithosite_confirmation_modal_not_a_browser_prompt():
    modal_start = HTML.index('id="plansDeleteConfirmModal"')
    modal_end = HTML.index('id="evidenceModal"', modal_start)
    modal_markup = HTML[modal_start:modal_end]

    assert 'role="dialog" aria-modal="true"' in modal_markup
    assert 'id="plansDeleteConfirmTitle">Delete Target Plan' in modal_markup
    assert 'id="plansDeleteConfirmId"' in modal_markup
    assert 'id="plansDeleteConfirmFolderId"' in modal_markup
    assert 'id="plansDeleteConfirmCancel"' in modal_markup
    assert 'id="plansDeleteConfirmAction"' in modal_markup
    assert 'class="control danger" id="plansDeleteConfirmAction"' in modal_markup
    assert "The RuntimeAdapter audit log for the deletion is retained." in modal_markup

    assert "'plansDeleteConfirmModal'" in MODAL_CONTRACT
    assert "requestDeletePlanConfirmation(id)" in PLANS_JS
    assert "if(!await requestDeletePlanConfirmation(id))return;" in PLANS_JS
    assert "settleDeletePlanConfirmation(false)" in PLANS_JS
    assert "settleDeletePlanConfirmation(true)" in PLANS_JS
    assert "if(!confirm(message))return;" not in PLANS_JS
    assert "window.confirm" not in PLANS_JS
    assert "#plansDeleteConfirmModal > .modal.modal-shell-valid" in PLANS_CSS
    assert "#plansDeleteConfirmModal .plans-delete-confirm-warning" in PLANS_CSS
