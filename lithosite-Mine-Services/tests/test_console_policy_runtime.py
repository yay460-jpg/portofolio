from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def test_stage36_runtime_kpi_policy_harness():
    harness = ROOT / "tests" / "runtime_kpi_policy_harness.js"
    result = subprocess.run(
        ["node", str(harness)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "RUNTIME_KPI_POLICY_TEST_PASS" in result.stdout
    assert "06 PURE/AVAILABLE EU=70.00%" in result.stdout
    assert "06 STANDARD/AVAILABLE EU=100.00%" in result.stdout
    assert "06 PURE/SCHEDULED EU=63.64%" in result.stdout
    assert "06 STANDARD/SCHEDULED EU=90.91%" in result.stdout
    assert "07 STANDARD/AVAILABLE EU=100.00%" in result.stdout
