from pathlib import Path


def test_stage13_desktop_host_serves_offline_ui_contract():
    root = Path(__file__).parents[1]
    server = (root / "desktop-host" / "server.py").read_text(encoding="utf-8")
    launcher = (root / "desktop-host" / "start-mine-services.bat").read_text(encoding="utf-8")

    assert 'PORT = int(os.environ.get("MINE_SERVICES_PORT", "8765"))' in server
    assert "v35-STAGE24.html" in server
    assert 'if path == "/":' in server
    assert 'if path == "/health":' in server
    assert '"/runtime"' in server
    assert 'target.suffix.lower() in {".xlsx", ".xls", ".csv"}' in server
    assert 'Database' in server

    assert 'MINE_SERVICES_DB=%MODULE_ROOT%\\Database\\Mine-Services-Database-A3.xlsx' in launcher
    assert 'http://127.0.0.1:8765/' in launcher
    assert 'desktop-host\\server.py' in launcher
    assert 'curl.exe --silent --fail' in launcher


def test_stage13_root_launcher_delegates_to_desktop_host():
    root = Path(__file__).parents[1]
    launcher = (root / "Start-Mine-Services.bat").read_text(encoding="utf-8")
    assert 'desktop-host\\start-mine-services.bat' in launcher


