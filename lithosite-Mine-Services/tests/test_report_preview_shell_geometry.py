from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS_CSS = ROOT / "ui" / "modules" / "reports" / "reports.css"
REPORTS_JS = ROOT / "ui" / "modules" / "reports" / "reports.js"
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_report_preview_dialog_is_constrained_to_reports_work_area():
    css = REPORTS_CSS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    modal_rule = "#reportsScreen #reportPreviewModal{position:fixed;inset:64px 0 34px;align-items:center;justify-content:center;padding:12px 24px}"
    dialog_rule = "#reportsScreen .report-preview-dialog{display:flex;flex-direction:column;width:min(720px,calc(100vw - 48px));max-height:calc(100% - 24px);min-height:0;overflow:hidden;background:#0e1d2e;border:1px solid #315477;border-radius:10px;box-shadow:0 18px 42px rgba(0,0,0,.5);color:#e8f0fa}"
    body_rule = "#reportsScreen .report-preview-body{flex:1 1 auto;min-height:0;padding:10px;overflow:auto;overscroll-behavior:contain;scrollbar-width:none;max-height:none;font-size:8px}"

    assert css.count(modal_rule) == 1
    assert css.count("#reportsScreen #reportPreviewModal .reports-history-head{flex:0 0 auto;min-height:44px}") == 1
    assert css.count(dialog_rule) == 1
    assert css.count(body_rule) == 1
    assert css.count("#reportsScreen .report-preview-body::-webkit-scrollbar{width:0;height:0;display:none}") == 1
    assert "max-height:calc(100vh - 90px)" not in css
    assert "max-height:calc(100vh - 150px)" not in css
    assert "inset:64px 0 34px" in css
    assert 'id="reportPreviewModal" class="reports-history-modal"' in html
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_report_preview_equipment_table_has_explicit_column_geometry():
    css = REPORTS_CSS.read_text(encoding="utf-8")
    js = REPORTS_JS.read_text(encoding="utf-8")
    html = ARTIFACT.read_text(encoding="utf-8")

    assert js.count('class="report-preview-table equipment-performance-table"') == 1
    assert js.count('<col class="eq-col-equipment">') == 1
    assert js.count('<col class="eq-col-unit">') == 1
    assert "eq-col-equipment{width:112px}" in css
    assert "eq-col-unit{width:78px}" in css
    assert "#reportsScreen .report-preview-table.equipment-performance-table{table-layout:fixed;width:100%;min-width:0}" in css
    assert "#reportsScreen .equipment-performance-table th,#reportsScreen .equipment-performance-table td{padding:4px 3px;font-size:6.2px;letter-spacing:-.08px}" in css
    assert css.count("#reportsScreen .report-preview-table.equipment-performance-table{table-layout:fixed;width:100%;min-width:0}") == 1
    assert "#reportsScreen .report-preview-table{width:100%;border-collapse:collapse;min-width:760px;font-size:7.5px}" in css
    assert "#reportsScreen .report-preview-dialog{display:flex;flex-direction:column;width:min(720px,calc(100vw - 48px));max-height:calc(100% - 24px)" in css
    assert "../ui/modules/reports/reports.js?v=20261022-kpi-shift-aware-diagnostics-1" in html
    assert "../ui/modules/reports/reports.css?v=20261012-cascade-owner-17" in html


def test_report_preview_column_rules_are_scoped_to_equipment_performance_table():
    css = REPORTS_CSS.read_text(encoding="utf-8")

    assert css.count("#reportsScreen .report-preview-table.equipment-performance-table{") == 1
    assert css.count("#reportsScreen .equipment-performance-table col.eq-col-equipment{width:112px}") == 1
    assert css.count("#reportsScreen .equipment-performance-table col.eq-col-unit{width:78px}") == 1
    assert "#reportsScreen .report-preview-table.compact{min-width:0}" in css
    assert "#reportsScreen .equipment-kpi-detail .eq-unit{" in css
