import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
MODULE_RULES = {
    "equipment/equipment.css": "#equipmentScreen .runtime-msg.error",
    "issues/issues.css": "#issuesScreen .runtime-msg.error",
    "checker/checker.css": "#checkerScreen .runtime-msg.error",
    "reports/reports.css": ".report-runtime.error",
}
SHARED_SELECTOR = (
    "#equipmentScreen .runtime-msg.error,#issuesScreen .runtime-msg.error,"
    "#checkerScreen .runtime-msg.error,.report-runtime.error"
)


def read(path):
    return path.read_text(encoding="utf-8")


def compact(text):
    return re.sub(r"\s+", "", re.sub(r"/\*[\s\S]*?\*/", "", text))


def rule_body(css, selector):
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        if compact(match.group(1).strip()) == compact(selector):
            return match.group(2)
    raise AssertionError(f"CSS rule not found: {selector}")


def test_active_shell_owns_shared_runtime_error_palette():
    html = compact(read(ARTIFACT))
    selector = compact(SHARED_SELECTOR)
    rules = [m for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", html) if compact(m.group(1)) == selector]
    assert len(rules) == 1
    body = compact(rules[0].group(2))
    for declaration in ("color:#fca5a5", "border-color:#5a2b32", "background:#2a1519"):
        assert declaration in body


def test_duplicate_runtime_error_rules_are_removed_from_modules():
    for relative, selector in MODULE_RULES.items():
        css = compact(read(ROOT / "ui" / "modules" / relative))
        assert f"{compact(selector)}{{" not in css, (
            f"Shared error palette remains duplicated in {relative}"
        )


def test_runtime_message_base_styles_and_distinct_palettes_are_preserved():
    equipment = compact(read(ROOT / "ui" / "modules" / "equipment" / "equipment.css"))
    issues = compact(read(ROOT / "ui" / "modules" / "issues" / "issues.css"))
    checker = compact(read(ROOT / "ui" / "modules" / "checker" / "checker.css"))
    reports = compact(read(ROOT / "ui" / "modules" / "reports" / "reports.css"))
    plans = compact(read(ROOT / "ui" / "modules" / "plans" / "plans.css"))
    hse = compact(read(ROOT / "ui" / "modules" / "hse" / "hse.css"))
    assert "grid-column:1/-1" in rule_body(equipment, "#equipmentScreen .runtime-msg")
    assert "grid-column:1/-1" in rule_body(issues, "#issuesScreen .runtime-msg")
    assert "grid-column:1/-1" in rule_body(checker, "#checkerScreen .runtime-msg")
    assert "margin-top:8px" in rule_body(reports, ".report-runtime")
    for css in (plans, hse):
        assert "border-color:#71343d" in css
        assert "background:#28171c" in css
        assert "color:#ff9aa4" in css
