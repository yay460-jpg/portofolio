from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"


def test_dashboard_recent_operations_and_issues_include_source_dates():
    html = ARTIFACT.read_text(encoding="utf-8")
    js = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.js").read_text(encoding="utf-8")
    css = (ROOT / "ui" / "modules" / "dashboard" / "dashboard.css").read_text(encoding="utf-8")

    assert '<div class="tablegrid head"><span>Date</span><span>Time</span><span>Activity</span><span>Work Front</span><span>Equipment</span><span>Qty</span></div>' in html
    assert '<div class="tablegrid head issue"><span>Date</span><span>Priority</span><span>Issue</span><span>Status</span></div>' in html
    assert "String(row.transaction_date || '-').slice(0, 10)" in js
    assert "String(row.issue_date || '-').slice(0, 10)" in js
    assert "dashboard.css?v=20261018-material-chart-controller" in html
    assert "dashboard.js?v=20261012-plan-actual" in html
    assert "grid-template-columns:78px 48px minmax(68px,.8fr) minmax(105px,1.15fr) minmax(115px,1.25fr) minmax(54px,auto)" in css
    assert css.count("#dashboardScreen .tablegrid.issue{grid-template-columns:76px 62px minmax(0,1fr) 58px}") == 1
    assert "grid-template-columns:76px 62px minmax(0,1fr) 82px" not in css
    assert "#dashboardScreen .tablegrid.issue.head,\n#dashboardScreen .tablegrid.issue.row" not in css
    assert "<span>—</span><span>—</span><span>No operations</span><span>—</span><span>—</span><span>—</span>" in js
    assert "No issues</span><span>—</span>" in js
