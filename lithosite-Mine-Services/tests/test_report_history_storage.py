from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
HARNESS = ROOT / "tests" / "runtime_report_history_harness.js"


def test_report_history_legacy_migration_is_non_destructive_and_resilient():
    node = shutil.which("node")
    assert node, "Node.js is required for the report history storage contract"
    result = subprocess.run([node, str(HARNESS)], cwd=ROOT, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout
    assert "REPORT_HISTORY_MIGRATION_PASS" in result.stdout
