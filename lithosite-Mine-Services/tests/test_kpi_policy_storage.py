from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
HARNESS = ROOT / "tests" / "runtime_kpi_policy_storage_harness.js"
HTML = ROOT / "Artifacts" / "Mine-Services-Operations.html"
DASHBOARD = ROOT / "ui" / "modules" / "dashboard" / "dashboard.js"
POLICY_STORAGE = ROOT / "ui" / "modules" / "dashboard" / "kpi-policy-storage.js"


def test_kpi_policy_cache_migration_is_non_destructive():
    node = shutil.which("node")
    assert node, "Node.js is required for the KPI policy storage contract"

    result = subprocess.run(
        [node, str(HARNESS)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "KPI_POLICY_STORAGE_MIGRATION_PASS" in result.stdout


def test_dashboard_loads_policy_storage_before_consuming_it():
    html = HTML.read_text(encoding="utf-8")
    dashboard = DASHBOARD.read_text(encoding="utf-8")
    storage = POLICY_STORAGE.read_text(encoding="utf-8")

    storage_script = "../ui/modules/dashboard/kpi-policy-storage.js"
    dashboard_script = "../ui/modules/dashboard/dashboard.js"
    assert storage_script in html
    assert dashboard_script in html
    assert html.index(storage_script) < html.index(dashboard_script)
    assert "LithositeDashboardKpiPolicyStorage" in dashboard
    assert "function legacyKpiPolicyKeys" not in dashboard
    assert "const LEGACY_KEY_PATTERN" in storage
