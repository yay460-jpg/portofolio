from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUTTON_CSS = ROOT / "ui" / "shared" / "button.css"
FEEDBACK_CSS = ROOT / "ui" / "shared" / "interactive-feedback.css"
MODAL_CSS = ROOT / "ui" / "shared" / "modal-shell-contract.css"


def test_button_motion_has_single_shared_owner():
    button = BUTTON_CSS.read_text(encoding="utf-8")
    feedback = FEEDBACK_CSS.read_text(encoding="utf-8")
    assert "button,.control" in button
    assert ".control:hover" in button
    assert ".control.primary:hover" in button
    assert ".control.danger:hover" in button
    assert "Button transitions, hover, focus and disabled states are owned by button.css." in feedback
    assert ".control.primary:hover" not in feedback
    assert ".control.danger:hover" not in feedback
    assert "button:disabled" not in feedback


def test_interactive_feedback_keeps_non_button_motion():
    feedback = FEEDBACK_CSS.read_text(encoding="utf-8")
    assert ".nav-item:hover" in feedback
    assert "select:focus-visible" in feedback
    assert "input:focus-visible" in feedback
    assert "prefers-reduced-motion:reduce" in feedback


def test_shared_modal_shell_owns_slide_in_out_motion():
    modal = MODAL_CSS.read_text(encoding="utf-8")
    assert "@keyframes lithositeModalSlideIn" in modal
    assert "@keyframes lithositeModalSlideOut" in modal
    assert "animation:lithositeModalSlideIn 180ms" in modal
    assert "animation:lithositeModalSlideOut 160ms" in modal
    assert "prefers-reduced-motion:reduce" in modal
