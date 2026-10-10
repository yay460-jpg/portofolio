from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "ui" / "shared" / "app-info.css"
SHELL = ROOT / "ui" / "shared" / "shell-navigation.js"


def test_about_modal_uses_fade_in_and_fade_out_only():
    css = CSS.read_text(encoding="utf-8")
    motion = css.split("/* Selective About modal motion:", 1)[1]
    assert ".app-info-modal.show:not(.is-closing)" in motion
    assert ".app-info-modal.show.is-closing" in motion
    assert "@keyframes appInfoFadeIn" in motion
    assert "@keyframes appInfoFadeOut" in motion
    assert "from{opacity:0}" in motion
    assert "to{opacity:1}" in motion
    assert "from{opacity:1}" in motion
    assert "to{opacity:0}" in motion
    assert "transform:" not in motion
    assert "prefers-reduced-motion:reduce" in motion


def test_about_modal_close_waits_for_fade_and_supports_reduced_motion():
    shell = SHELL.read_text(encoding="utf-8")
    assert "function closeAppInfo(modal)" in shell
    assert "modal.classList.add('is-closing')" in shell
    assert "event.animationName !== 'appInfoFadeOut'" in shell
    assert "finishAppInfoClose(modal, token)" in shell
    assert "matchMedia('(prefers-reduced-motion: reduce)')" in shell
    assert "stylesheet.href = '../ui/shared/app-info.css?v=20261011-fade';" in shell
