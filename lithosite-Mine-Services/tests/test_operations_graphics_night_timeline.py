from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GRAPHICS = ROOT / "ui" / "modules" / "operations" / "operations-graphics.js"
OPERATIONS = ROOT / "ui" / "modules" / "operations" / "operations.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_unit_timeline_anchors_after_midnight_night_records_to_shift_start_date():
    graphics = GRAPHICS.read_text(encoding="utf-8")

    assert "function timelineAnchorDate(row, dateField, timeField)" in graphics
    assert "shift !== 'night' || minutes === null || minutes >= 12 * 60" in graphics
    assert "timelineAnchorDate(row, 'transaction_date', 'transaction_time')" in graphics
    assert "timelineAnchorDate(item, 'event_date', 'start_time') === latestDate" in graphics
    assert "haulingShiftKeys.has(equipmentId + '|' + operatingDate)" in graphics
    assert "const date = timelineAnchorDate(row, 'transaction_date', 'transaction_time');" in graphics
    assert "Night records after midnight stay attached to the calendar date when that shift began." in graphics


def test_unit_timeline_maps_day_and_night_hours_on_a_24_hour_cycle():
    graphics = GRAPHICS.read_text(encoding="utf-8")

    assert "function timelineOffsetMinutes(value)" in graphics
    assert "const timelineStart = 360; // 06:00" in graphics
    assert "const timelineSpan = 1440; // 24 hours, ending at 06:00 on the next date" in graphics
    assert "if (endOffset <= startOffset) endOffset += 1440;" in graphics
    assert "segment.style.left = (start / timelineSpan * 100) + '%';" in graphics
    assert "segment.style.width = ((end - start) / timelineSpan * 100) + '%';" in graphics
    assert "const windowEnd = 1080;" not in graphics


def test_operations_graphics_displays_shift_aware_axis_and_loads_updated_asset():
    operations = OPERATIONS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert "Unit Timeline <span>24 h cycle · Day and Night</span>" in operations
    assert "<span>06:00</span><span>12:00</span><span>18:00</span><span>00:00</span><span>06:00+1d</span>" in operations
    assert "operations-graphics.js?v=20261022-repair-hours-counted-separately-3" in html
    assert "operations.js?v=20261022-unit-timeline-five-row-scroll-1" in html
    assert "operations.css?v=20261022-repair-hours-independent-tracks-2" in html



def test_unit_timeline_shows_five_rows_then_scrolls_without_a_visible_scrollbar():
    graphics = GRAPHICS.read_text(encoding="utf-8")
    operations = OPERATIONS.read_text(encoding="utf-8")
    css = (ROOT / "ui" / "modules" / "operations" / "operations.css").read_text(encoding="utf-8")

    assert "const rowsViewport = panel.querySelector('.operations-timeline-rows');" in graphics
    assert "rowsViewport.querySelectorAll('.operations-timeline-row')" in graphics
    assert "rowsViewport.appendChild(row);" in graphics
    assert '<div class=\\\"operations-timeline-rows\\\">' in operations
    assert "max-height:115px;" in css
    assert "overflow-y:auto;" in css
    assert "overflow-x:hidden;" in css
    assert "scrollbar-width:none;" in css
    assert "-ms-overflow-style:none;" in css
    assert "overscroll-behavior:contain;" in css
    assert ".operations-timeline-rows::-webkit-scrollbar{display:none;width:0;height:0}" in css
    assert ".operations-timeline-rows>.operations-timeline-row{margin:4px 0}" in css
