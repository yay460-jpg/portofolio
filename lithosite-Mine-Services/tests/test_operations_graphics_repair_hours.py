from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAPHICS = ROOT / "ui" / "modules" / "operations" / "operations-graphics.js"
CSS = ROOT / "ui" / "modules" / "operations" / "operations.css"


def test_repair_action_is_counted_even_when_event_type_is_breakdown():
    js = GRAPHICS.read_text(encoding="utf-8")
    repair_calculation = js.split("const repair = sum(linked.filter(function (row) {", 1)[1].split("const heading =", 1)[0]

    assert "return /repair/i.test(action) || /^repair(?:ing)?$/i.test(eventType);" in repair_calculation
    assert "const start = timeMinutes(row.start_time);" in repair_calculation
    assert "const end = timeMinutes(row.end_time);" in repair_calculation
    assert "if (elapsed < 0) elapsed += 1440;" in repair_calculation
    assert "return /breakdown|failure|jam/i.test(eventType) ? 0 : row.downtime_hours;" in repair_calculation


def test_breakdown_and_repair_hours_are_shown_as_independent_metrics():
    js = GRAPHICS.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")

    assert "const maxMetricHours = Math.max(breakdown, repair);" in js
    assert "const combinedForSplit = breakdown + repair;" not in js
    assert "Metrics shown independently and are not summed together." in js
    assert "i.style.width = (maxMetricHours ? breakdown / maxMetricHours * 100 : 0) + '%';" in js
    assert "b.style.width = (maxMetricHours ? repair / maxMetricHours * 100 : 0) + '%';" in js
    assert "grid-template-rows:repeat(2,4px)" in css
    assert "operations-timeline-segment.is-breakdown.is-overlap{top:50%;bottom:0;z-index:3}" in css
    assert "operations-timeline-segment.is-repairing.is-overlap{top:0;bottom:50%;z-index:4}" in css


def test_repairing_breakdown_interval_keeps_both_timeline_colors_visible():
    js = GRAPHICS.read_text(encoding="utf-8")

    assert "if (isBreakdown && isRepairing)" in js
    assert "'is-breakdown is-overlap', 'Breakdown'" in js
    assert "'is-repairing is-overlap', 'Repairing'" in js
