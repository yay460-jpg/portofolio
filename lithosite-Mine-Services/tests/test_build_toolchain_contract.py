from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESKTOP_WORKFLOW = ROOT / ".github" / "workflows" / "mine-services-desktop-build.yml"
PYTEST_WORKFLOW = ROOT / ".github" / "workflows" / "mine-services-pytest.yml"


def test_windows_builder_and_full_pytest_use_the_same_security_patched_python():
    desktop = DESKTOP_WORKFLOW.read_text(encoding="utf-8")
    pytest = PYTEST_WORKFLOW.read_text(encoding="utf-8")

    assert 'python-version: "3.13.17"' in desktop
    assert 'python-version: "3.13.17"' in pytest
    assert "Full test suite (Python 3.13.17)" in pytest
    assert 'python-version: "3.12"' not in desktop
    assert 'python-version: "3.13"' not in pytest


def test_windows_installer_downloads_official_webview2_evergreen_standalone_x64():
    desktop = DESKTOP_WORKFLOW.read_text(encoding="utf-8")

    assert "https://go.microsoft.com/fwlink/?linkid=2124701" in desktop
    assert "LinkId=2124703" not in desktop
    assert "MicrosoftEdgeWebView2RuntimeInstallerX64.exe" in desktop
    assert "$runtimeInfo.Length -lt 50MB" in desktop
    assert "Get-AuthenticodeSignature $runtime" in desktop
    assert '$signature.Status -ne "Valid"' in desktop
    assert '$signature.SignerCertificate.Subject -notmatch "Microsoft"' in desktop
