from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
HARNESS = ROOT / "tests" / "runtime_kpi_policy_storage_harness.js"
HTML = ROOT / "Artifacts" / "Mine-Services-Operations.html"
DASHBOARD = ROOT / "ui" / "modules" / "dashboard" / "dashboard.js"
REPORTS = ROOT / "ui" / "modules" / "reports" / "reports.js"
POLICY_STORAGE = ROOT / "ui" / "shared" / "kpi-policy-storage.js"


def test_kpi_policy_cache_migration_is_non_destructive():
    node = shutil.which("node")
    assert node, "Node.js is required for the KPI policy storage contract"
    result = subprocess.run([node, str(HARNESS)], cwd=ROOT, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout
    assert "KPI_POLICY_STORAGE_MIGRATION_PASS" in result.stdout


def test_dashboard_and_reports_share_policy_storage_owner():
    html = HTML.read_text(encoding="utf-8")
    dashboard = DASHBOARD.read_text(encoding="utf-8")
    reports = REPORTS.read_text(encoding="utf-8")
    storage = POLICY_STORAGE.read_text(encoding="utf-8")

    storage_script = "../ui/shared/kpi-policy-storage.js"
    dashboard_script = "../ui/modules/dashboard/dashboard.js"
    reports_script = "../ui/modules/reports/reports.js"
    assert storage_script in html
    assert dashboard_script in html
    assert reports_script in html
    assert html.index(storage_script) < html.index(dashboard_script)
    assert html.index(storage_script) < html.index(reports_script)
    assert "LithositeKpiPolicyStorage" in dashboard
    assert "kpiPolicyStorage.read(global.localStorage)" in dashboard
    assert "LithositeKpiPolicyStorage" in reports
    assert "policyStorage.read(global.localStorage)" in reports
    assert "function legacyKpiPolicyKeys" not in dashboard
    assert "function legacyPolicyKeys" not in reports
    assert "const KEY = 'lithosite.mine-services.kpi-policy';" in storage
    assert "const LEGACY_KEY_PATTERN" in storage
