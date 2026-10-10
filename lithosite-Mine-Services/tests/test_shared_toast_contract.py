from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOAST_CSS = ROOT / "ui" / "shared" / "toast.css"
MODAL_CONTRACT = ROOT / "ui" / "shared" / "modal-show-contract.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_toast_presentation_and_motion_have_one_css_owner():
    css = TOAST_CSS.read_text(encoding="utf-8")
    js = MODAL_CONTRACT.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")
    assert ".lithosite-toast" in css
    assert "@keyframes lithosite-toast-in" in css
    assert "@keyframes lithosite-toast-out" in css
    assert "prefers-reduced-motion:reduce" in css
    assert "toast.style.cssText" not in js
    assert "toast.className = 'lithosite-toast'" in js
    assert "ui/shared/toast.css" in html


def test_blocked_modal_toast_retains_live_status_and_timeout():
    js = MODAL_CONTRACT.read_text(encoding="utf-8")
    assert "aria-live', 'polite'" in js
    assert "3200" in js
    assert "is-visible" in js
    assert "is-hiding" in js
