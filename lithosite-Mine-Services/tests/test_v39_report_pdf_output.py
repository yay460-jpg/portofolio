from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "desktop-host" / "server.py"
SNAPSHOT = ROOT / "ui" / "modules" / "reports" / "report-snapshot.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Concept-2-Dashboard-Operations-v39-STAGE28.html"

SERVER_TEXT = SERVER.read_text(encoding="utf-8")
SNAPSHOT_TEXT = SNAPSHOT.read_text(encoding="utf-8")
ARTIFACT_TEXT = ARTIFACT.read_text(encoding="utf-8")


def load_pdf_escape():
    # Execute only the standalone text-escaping helper, not server.py's
    # runtime adapter initialization or HTTP server startup.
    tree = ast.parse(SERVER_TEXT, filename=str(SERVER))
    function = next(
        node for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "_pdf_escape"
    )
    isolated = ast.Module(body=[function], type_ignores=[])
    namespace = {}
    exec(compile(ast.fix_missing_locations(isolated), str(SERVER), "exec"), namespace)
    return namespace["_pdf_escape"]


def test_pdf_escape_normalizes_non_latin1_punctuation():
    escape = load_pdf_escape()
    result = escape("Monthly 2026-10-01 → 2026-10-31; Start Date–End Date")
    assert "2026-10-01 to 2026-10-31" in result
    assert "Start Date-End Date" in result
    assert "?" not in result
    assert escape("left\u00a0right") == "left right"


def test_pdf_escape_still_escapes_pdf_string_delimiters():
    escape = load_pdf_escape()
    assert escape("(A)\\B") == "\\(A\\)\\\\B"


def test_monthly_kpi_is_rendered_as_formatted_metrics():
    assert 'name_upper in {"MONTHLY KPI", "DAILY KPI", "WEEKLY KPI"}' in SERVER_TEXT
    assert 'display_value("PA", value.get("PA"))' in SERVER_TEXT
    assert 'display_value("UA", value.get("UA"))' in SERVER_TEXT
    assert 'display_value("EU", value.get("EU"))' in SERVER_TEXT


def test_plan_vs_actual_uses_a_comparison_table_not_raw_dictionary_text():
    for value in (
        'name_upper in {"TARGET VS ACTUAL", "PLAN VS ACTUAL", "PLANNED VS ACTUAL"}',
        "render_plan_actual(value)",
        'headers = ("Measurement", "Target", "Actual", "Variance", "Achievement", "Remaining")',
        "metric_cell(achievements, unit, True)",
        "Validated output across all Operations (period reference only)",
        "Allocation rule:"
    ):
        assert value in SERVER_TEXT


def test_issued_snapshot_has_non_draft_id_and_incremented_revision():
    assert "const issuedId=draftId.startsWith('DRAFT-')?draftId.slice(6):draftId;" in SNAPSHOT_TEXT
    assert "copy.report_id=issuedId||'REPORT';" in SNAPSHOT_TEXT
    assert "const revision=previous.length?baseRevision+1:Math.max(1,baseRevision);" in SNAPSHOT_TEXT
    assert "copy.snapshot_id=copy.report_id+'@r'+revision;" in SNAPSHOT_TEXT


def test_report_snapshot_script_uses_fresh_browser_cache_key():
    assert "report-snapshot.js?v=20261009" in ARTIFACT_TEXT
