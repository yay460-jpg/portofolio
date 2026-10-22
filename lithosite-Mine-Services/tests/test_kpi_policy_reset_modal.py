from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
REPORTS_JS = ROOT / "ui" / "modules" / "reports" / "reports.js"
REPORTS_CSS = ROOT / "ui" / "modules" / "reports" / "reports.css"
MODAL_SHOW = ROOT / "ui" / "shared" / "modal-show-contract.js"


def test_kpi_policy_reset_uses_a_lithosite_confirmation_modal():
    html = ARTIFACT.read_text(encoding="utf-8")
    js = REPORTS_JS.read_text(encoding="utf-8")
    modal_contract = MODAL_SHOW.read_text(encoding="utf-8")

    assert 'id="reportsResetConfirmModal" class="modalback" aria-hidden="true"' in html
    assert 'class="modal modal-shell-valid reports-reset-confirm-dialog" role="dialog" aria-modal="true"' in html
    assert 'id="reportsResetConfirmTitle">Reset KPI Policy Set</span>' in html
    assert 'id="reportsResetConfirmCancel">Cancel</button>' in html
    assert 'id="reportsResetConfirmAction">Reset Policy Set</button>' in html
    assert "No runtime policy changes occur until you click Apply Policy Set." in html
    assert "global.confirm('Reset Policy Set" not in js
    assert "LithositeModalShowContract.show('reportsResetConfirmModal')" in js
    assert "LithositeModalShowContract.close('reportsResetConfirmModal')" in js
    assert "'reportsResetConfirmModal'," in modal_contract


def test_reset_confirmation_only_changes_console_selection_until_apply():
    js = REPORTS_JS.read_text(encoding="utf-8")
    confirm_action = js.split("const confirmResetConsolePolicy=()=>{", 1)[1].split("\n  };", 1)[0]

    assert "applyDefaultConsoleSelection()" in confirm_action
    assert "persistPolicy(" not in confirm_action
    assert "await calculate()" not in confirm_action
    assert "renderKpi()" not in confirm_action
    assert "syncConsolePreview()" in js


def test_reset_modal_has_lithosite_warning_panel_and_accessible_close_paths():
    html = ARTIFACT.read_text(encoding="utf-8")
    js = REPORTS_JS.read_text(encoding="utf-8")
    css = REPORTS_CSS.read_text(encoding="utf-8")

    assert 'class="reports-reset-confirm-warning"' in html
    assert 'id="reportsResetConfirmClose"' in html
    assert "event.target===resetConfirmModal" in js
    assert "event.key==='Escape'&&resetConfirmModal.classList.contains('show')" in js
    assert "reports-reset-confirm-dialog{width:min(665px,calc(100vw - 48px))}" in css
    assert "z-index:100" in css
    assert "reports-reset-confirm-warning" in css
