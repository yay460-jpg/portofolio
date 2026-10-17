from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT
REPORTS = BASE / "ui/modules/reports/reports.js"
ENGINE = BASE / "ui/modules/reports/report-engine.js"
VALIDATION = BASE / "ui/modules/reports/report-validation.js"
SNAPSHOT = BASE / "ui/modules/reports/report-snapshot.js"
PDF = BASE / "ui/modules/reports/report-pdf.js"
SERVER = BASE / "desktop-host/server.py"
HISTORY = BASE / "ui/modules/reports/report-history.js"
ARTIFACT = BASE / "Artifacts/Mine-Services-Operations.html"

def read(path):
    return path.read_text(encoding="utf-8")

def test_stage32_validation_and_lineage():
    text = read(VALIDATION)
    assert "LithositeReportValidation" in text
    assert "VALIDATION REQUIRED" in text
    assert "kpi_snapshot_id" in text
    assert "source_snapshot_id" in text
    assert "baseline" in text
    assert "generated_from" in text
    reports = read(REPORTS)
    assert "LithositeReportValidation.apply" in reports

def test_stage33_immutable_snapshot():
    text = read(SNAPSHOT)
    for token in ("immutable:true", "snapshot_id", "fingerprint", "SHA-256", "deepFreeze"):
        assert token in text
    assert "LithositeReportSnapshot" in text

def test_stage34_report_center_issue_flow():
    html = read(ARTIFACT)
    reports = read(REPORTS)
    for token in ("reportCenterValidate", "reportCenterIssue", "reportCenterHistory"):
        assert token in html
    assert "Report issued" in reports
    assert "LithositeReportHistory.save" in reports

def test_stage35_pdf_renderer():
    text = read(PDF)
    assert "LithositePdfRenderer" in text
    assert "print()" in text
    assert "renderInline(model,iframe)" in text
    reports = read(REPORTS)
    assert "LithositePdfRenderer.render" in reports

def test_stage36_report_history():
    text = read(HISTORY)
    assert "LithositeReportHistory" in text
    assert "lithosite.mine-services.report-history" in text
    assert "lithosite.mine-services.v38.report-history" in text
    assert "LEGACY_KEYS" in text
    assert "Only immutable issued snapshots" in text

def test_artifact_stage_order():
    html = read(ARTIFACT)
    order = [
        "daily-report.js",
        "weekly-report.js",
        "monthly-report.js",
        "report-engine.js",
        "report-validation.js",
        "report-snapshot.js",
        "report-pdf.js",
        "report-history.js",
        "reports.js",
    ]
    positions = [html.index(value) for value in order]
    assert positions == sorted(positions)

def test_report_kpi_uses_selected_period_scope():
    reports = read(REPORTS)
    assert "function reportKpiForPeriod(period)" in reports
    assert "calculateFleetAllDates(payload)" in reports
    assert "calculateFleet({...payload,date:period.start})" in reports
    assert "const k=reportKpiForPeriod(effectivePeriod)||state.kpi;" in reports
    assert "function reportScopedSource(period)" in reports
    assert "scoped.Equipment=rows('Equipment').filter" in reports
    assert "scoped.WorkFront=rows('WorkFront').filter" in reports

def test_report_preview_uses_specialized_report_contract_fields():
    reports = read(REPORTS)
    monthly = read(BASE / "ui/modules/reports/monthly-report.js")
    assert "model.total_source_records" in reports
    assert "model.total_records" in reports
    assert "const totalRecords=" in reports
    assert "equipment:Array.isArray(k?.equipment)?k.equipment:[]" in reports
    assert "validation_issues:Array.isArray(k.validation_issues)?k.validation_issues.slice():[]" in monthly
    daily = read(BASE / "ui/modules/reports/daily-report.js")
    assert "equipment:Array.isArray(k.equipment)?k.equipment:[]" in monthly
    assert "equipment:Array.isArray(k.equipment)?k.equipment:[]" in daily
    assert "totalRecords+' records</span>" in reports

def test_release_readiness_contract():
    for path in (ENGINE, VALIDATION, SNAPSHOT, PDF, HISTORY, REPORTS):
        assert path.exists()
        assert read(path).strip()
    reports = read(REPORTS)
    assert "function bind()" in reports
    assert "LithositeDataSync.register('Reports',load)" in reports

def test_report_period_contract_and_notice():
    reports = read(REPORTS)
    # Calendar dates are held as ISO date-only strings and built in UTC so
    # browser timezone offsets cannot shift the selected report day.
    assert "const value=String(startDate||latestOperationalDate()).slice(0,10);" in reports
    assert "new Date(Date.UTC(parts[0],parts[1]-1,parts[2]))" in reports
    assert "if(type==='WEEKLY')periodEnd.setUTCDate(periodEnd.getUTCDate()+6);" in reports
    assert "periodEnd.setUTCMonth(periodEnd.getUTCMonth()+1,0);" in reports
    assert "if(parts[2]!==1)return null;" in reports
    assert "Monthly Report requires the report date to be the 1st day of the month." in reports
    assert "No data is available for the selected report period." in reports
    assert "report_data_status:requestedRows>0?'REQUESTED_PERIOD':'NO_DATA_FOR_PERIOD'" in reports
    html = read(ARTIFACT)
    assert 'id="reportCenterNotice"' in html
    css = read(BASE / "ui/modules/reports/reports.css")
    assert ".report-center-notice" in css

def test_report_pdf_uses_user_guide_native_reader_without_custom_toolbar():
    reports = read(REPORTS)
    pdf = read(BASE / "ui/modules/reports/report-pdf.js")
    artifact = read(ARTIFACT)
    css = read(BASE / "ui/modules/reports/reports.css")
    server = read(SERVER)
    assert "renderInline(model,iframe)" in pdf
    assert "fetch(endpoint" in pdf
    assert "method:'POST'" in pdf
    assert "response.json()" in pdf
    assert "URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))" in pdf
    assert "report-pdf" in pdf
    assert "window.open('','_blank')" in pdf
    assert 'class="user-guide-reader-modal"' in artifact
    assert 'class="user-guide-reader-dialog"' in artifact
    assert 'class="user-guide-reader-head"' in artifact
    assert 'class="user-guide-reader-body"' in artifact
    assert 'id="reportPdfReaderFrame"' in artifact
    assert "user-guide.css?v=20261011-reader-geometry" in artifact
    assert "reportPdfReaderSidebar" not in artifact
    assert "reportPdfReaderZoomOut" not in artifact
    assert "reportPdfReaderPrint" not in artifact
    assert "reportPdfReaderOutline" not in artifact
    assert "reportPdfReaderPrint" not in reports
    assert "contentWindow.print()" not in reports
    assert ".report-pdf-reader-toolgroup" not in css
    assert 'if self.path == "/report-pdf":' in server
    assert '"mime": "application/pdf"' in server
    assert '"data": base64.b64encode(payload).decode("ascii")' in server
    assert "def build_report_pdf(model: dict)" in server
    generate_start = reports.index("function generatePdf")
    bind_start = reports.index("function bind")
    assert "window.open" not in reports[generate_start:bind_start]


def test_report_renderers_present_management_readable_section_data():
    reports = read(REPORTS)
    pdf = read(BASE / "ui/modules/reports/report-pdf.js")
    assert "function reportSectionText(value)" in reports
    assert "function reportCountText(value)" in reports
    assert "Structured report data is available in the issued snapshot." in reports
    assert "const pctText=v=>" in pdf
    assert "const countText=v=>" in pdf
    assert "Lithosite Mine Services" in pdf
    assert "Reports &amp; KPI" in pdf
    assert "MANAGEMENT SNAPSHOT" in pdf
    assert "Management attention" in pdf
    assert "Operational Source Summary" in pdf
    assert "@page{size:A4 portrait" in pdf
    assert ".page-footer:after{content:\"Page \" counter(page)}" in pdf
    assert "white-space:pre-line" in pdf
    assert "const humanize=v=>" in pdf
    assert "No section-specific narrative is available in this report snapshot." in pdf
    assert "JSON.stringify(value,null,2)" not in reports
    assert "JSON.stringify(v,null,2)" not in pdf
    assert pdf.count("const pctText=v=>") == 1

def test_weekly_monthly_no_data_status_does_not_fallback_to_latest():
    reports = read(REPORTS)
    assert reports.count("report_data_status:requestedRows>0?'REQUESTED_PERIOD':'NO_DATA_FOR_PERIOD'") == 4
    assert "LATEST_AVAILABLE_DATA" not in reports

def test_report_period_filters_require_dated_source_evidence():
    reports = read(REPORTS)
    daily = read(BASE / "ui/modules/reports/daily-report.js")
    weekly = read(BASE / "ui/modules/reports/weekly-report.js")
    monthly = read(BASE / "ui/modules/reports/monthly-report.js")
    assert "return !d || (d>=period.start&&d<=period.end);" not in reports
    assert "return !d||(d>=start&&d<=end)" not in weekly
    assert "return !d||(d>=start&&d<=end);" not in daily
    assert "return !d||(d>=a&&d<=b)" not in monthly
    assert "return !!d&&d>=start&&d<=end;" in daily
    assert "return !!d&&d>=a&&d<=b" in weekly
    assert "return !!d&&d>=a&&d<=b" in monthly


def test_closed_modals_are_hidden_before_modal_contract_initializes():
    html = read(ARTIFACT)
    modal_css = read(BASE / "ui/shared/modal-shell-contract.css")
    assert "modal-shell-contract.css?v=20261017-closed-modal-first-paint" in html
    assert ".modalback:not(.show):not(.open)" in modal_css
    assert "display:none!important" in modal_css

def test_active_artifact_restores_saved_screen_before_first_paint():
    html = read(ARTIFACT)
    navigation = read(BASE / "ui/shared/shell-navigation.js")
    bootstrap = html.index('id="lithosite-initial-screen-bootstrap"')
    body = html.index("<body>")
    assert 0 < bootstrap < body
    assert "sessionStorage.getItem('lithosite-active-screen')" in html
    assert "lithosite-initial-screen-guard" in html
    assert "name !== selected" in html
    assert "display:none!important" in html
    assert "rules.push('#' + screens[selected] + '{display:flex!important}')" in html
    assert "data-lithosite-initial-screen" in html
    assert "setScreen(readInitialScreen(), false);" in navigation
    assert "initialScreenGuard.remove();" in navigation
    assert "removeAttribute('data-lithosite-initial-screen')" in navigation

def test_hydrology_rainfall_entry_loads_engine_and_saves_a3_record():
    html = read(ARTIFACT)
    hydrology_panel = read(BASE / "shared/hydrology/hydrology-panel.js")
    hydrology_overlay = read(BASE / "shared/hydrology/hydrology-overlay.js")
    hydrology_engine = read(BASE / "shared/hydrology/hydrology-engine.js")
    topo3d_engine = read(BASE / "shared/topo3d/topo3d-engine.js")
    map_engine = read(BASE / "ui/modules/map-engine/map-engine.js")
    css = read(BASE / "shared/hydrology/hydrology.css")

    marker_location_script = html.index('marker-location.js?v=20261017')
    hydrology_engine_script = html.index('hydrology-engine.js?v=20261017-d8-core')
    hydrology_overlay_script = html.index('hydrology-overlay.js?v=20261018-auto360-performance')
    rainfall_script = html.index('hydrology-panel.js?v=20261018-rainfall-clear-control')
    map_engine_script = html.index('map-engine.js?v=20261006')
    assert marker_location_script < hydrology_engine_script < hydrology_overlay_script < rainfall_script < map_engine_script
    assert 'hydrology.css?v=20261018-rainfall-clear-control' in html

    assert "id='dashboardHydrologyRainfallToggle'" in hydrology_panel
    assert "markerLocation.insertAdjacentElement('afterend',button)" in hydrology_panel
    assert "global.LithositeHydrology.create().analyzeTIN" in hydrology_panel
    assert "global.LithositeHydrologyOverlay.create" in hydrology_panel
    assert "setAnalysis(result)" in hydrology_panel
    assert "projectCoordinate:function(easting,northing,elevation)" in map_engine
    assert "subscribeRender:function(listener)" in map_engine
    assert "global.LithositeHydrologyOverlay" in hydrology_overlay
    assert "entity:'RainfallSimulation'" in hydrology_panel
    assert "Topo3DEngine.prototype.getAnalysisMesh=function(options)" in topo3d_engine
    assert "new Float64Array(raw)" in topo3d_engine
    assert "new Uint32Array(idx)" in topo3d_engine
    assert "getAnalysisMesh:function(options)" in map_engine
    assert "flow accumulation" in hydrology_engine.lower()
    assert ".hydrology-panel" in css
    assert ".hydrology-flow-overlay" in css
    assert "flowTo" in hydrology_overlay
    assert "MAX_SEGMENTS=900" in hydrology_overlay
    assert "MAX_PARTICLES=32" in hydrology_overlay

