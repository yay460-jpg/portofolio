from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
SHELL = ROOT / "ui" / "shared" / "shell-navigation.js"
CSS = ROOT / "ui" / "shared" / "screen-transition.css"


def test_screen_transition_animates_only_title_from_below_without_fade():
    css = CSS.read_text(encoding="utf-8")
    assert ".layout-title-entering" in css
    assert "@keyframes layoutTitleRiseIn" in css
    assert "from{transform:translateY(14px)}" in css
    assert "to{transform:translateY(0)}" in css
    assert "opacity:" not in css
    assert "prefers-reduced-motion:reduce" in css


def test_navigation_restarts_title_animation_on_real_screen_changes_only():
    shell = SHELL.read_text(encoding="utf-8")
    assert "function animateScreenTitle(name)" in shell
    assert "screen.querySelector('.title h1')" in shell
    assert "title.classList.remove('layout-title-entering')" in shell
    assert "void title.offsetWidth" in shell
    assert "title.classList.add('layout-title-entering')" in shell
    assert "if (persist !== false && previousScreen !== name) animateScreenTitle(name);" in shell


def test_active_artifact_loads_shared_screen_transition_stylesheet():
    html = ARTIFACT.read_text(encoding="utf-8")
    assert "ui/shared/screen-transition.css?v=20261011" in html
    assert "shell-navigation.js?v=20261011-title-motion" in html
