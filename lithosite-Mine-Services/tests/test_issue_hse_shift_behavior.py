from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
SHIFT_HELPER = ROOT / "ui" / "shared" / "shift-time.js"
ISSUES_JS = ROOT / "ui" / "modules" / "issues" / "issues.js"
HSE_JS = ROOT / "ui" / "modules" / "hse" / "hse.js"
SCHEMA = ROOT / "src" / "mine_services" / "schema.py"
VALIDATION = ROOT / "src" / "mine_services" / "validation.py"
PERSISTENCE = ROOT / "src" / "mine_services" / "persistence.py"


def test_issues_and_hse_use_the_active_kpi_shift_pair_for_time_fields():
    helper = SHIFT_HELPER.read_text(encoding="utf-8")
    artifact = ARTIFACT.read_text(encoding="utf-8")
    issues = ISSUES_JS.read_text(encoding="utf-8")
    hse = HSE_JS.read_text(encoding="utf-8")

    assert "lithosite.mine-services.v43.kpi-shift-pair-policy" in helper
    assert "TB-PROJECT-PAIR-0600-0600" in helper
    assert "TB-PROJECT-PAIR-0700-0700" in helper
    assert "restStart:'12:00',restEnd:'13:00'" in helper
    assert "restStart:'00:00',restEnd:'01:00'" in helper
    assert "function isTimeInShift(shift,time)" in helper
    assert "function shiftAnchorDate(date,time,shift)" in helper
    assert "issue_time:document.getElementById('f_issue_time').value" in issues
    assert "event_time:document.getElementById('f_hse_event_time').value" in hse
    assert "shiftTime.isTimeInShift(row.shift,row.issue_time)" in issues
    assert "shiftTime.isTimeInShift(row.shift,row.event_time)" in hse
    assert "issues.js?v=20261022-issues-shift-time-1" in artifact
    assert "hse.js?v=20261022-hse-shift-time-1" in artifact
    assert "shift-time.js?v=20261022-paired-shift-1" in artifact


def test_issues_and_hse_registers_show_and_filter_shift():
    artifact = ARTIFACT.read_text(encoding="utf-8")
    issues = ISSUES_JS.read_text(encoding="utf-8")
    hse = HSE_JS.read_text(encoding="utf-8")

    assert 'id="issuesShiftFilter"' in artifact
    assert 'id="hseShiftFilter"' in artifact
    assert '<div class="cell">Time</div><div class="cell">Shift</div>' in artifact
    assert "esc(r.issue_time||'—')" in issues
    assert "esc(r.event_time||'—')" in hse
    assert "(!shift||r.shift===shift)" in issues
    assert "(!shift||r.shift===shift)" in hse


def test_schema_and_runtime_migration_preserve_legacy_issue_hse_rows():
    schema = SCHEMA.read_text(encoding="utf-8")
    validation = VALIDATION.read_text(encoding="utf-8")
    persistence = PERSISTENCE.read_text(encoding="utf-8")

    assert '"issue_time","shift"' in schema
    assert '"event_time","shift"' in schema
    assert '"Issues.shift":"checker_shift"' in schema
    assert '"HSE.shift":"checker_shift"' in schema
    assert '"Issues": {"issue_time"}' in validation
    assert '"HSE": {"event_time"}' in validation
    assert "_migrate_a3_issue_hse_shift_time" in persistence
    assert "never guesses a shift from date or time" in persistence
    assert "for table in worksheet.tables.values()" in persistence
    assert "table.autoFilter.ref = table.ref" in persistence
    assert "new_last_col = len(expected_headers)" in persistence
