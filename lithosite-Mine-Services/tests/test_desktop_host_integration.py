from pathlib import Path


def test_desktop_host_serves_offline_ui_contract():
    root = Path(__file__).parents[1]
    server = (root / "desktop-host" / "server.py").read_text(encoding="utf-8")
    launcher = (root / "desktop-host" / "start-mine-services.bat").read_text(encoding="utf-8")

    assert 'PORT = int(os.environ.get("MINE_SERVICES_PORT", "8765"))' in server
    assert "/Artifacts/Mine-Services-Operations.html" in server
    assert 'if path == "/":' in server
    assert 'if path == "/health":' in server
    assert '"/runtime"' in server
    assert 'target.suffix.lower() in {".xlsx", ".xls", ".csv"}' in server
    assert 'Database' in server

    assert 'MINE_SERVICES_DB=%MODULE_ROOT%\\Database\\Mine-Services-Database-A3.xlsx' in launcher
    assert 'http://127.0.0.1:8765/' in launcher
    assert 'desktop-host\\server.py' in launcher
    assert 'curl.exe --silent --fail' in launcher


def test_root_launcher_delegates_to_desktop_host():
    root = Path(__file__).parents[1]
    launcher = (root / "Start-Mine-Services.bat").read_text(encoding="utf-8")
    assert 'desktop-host\\start-mine-services.bat' in launcher




def test_desktop_host_serializes_evidence_lifecycle_with_runtime_and_upload():
    root = Path(__file__).parents[1]
    server = (root / "desktop-host" / "server.py").read_text(encoding="utf-8")
    assert "handle_with_postprocess" in server
    assert "def _handle_runtime_request(request: dict)" in server
    assert "apply_plan_evidence_lifecycle" in server
    assert "return method(request, apply_plan_evidence_lifecycle)" in server
    assert "def _adapter_exclusive()" in server
    assert "with _adapter_exclusive():" in server
    assert server.count("with _adapter_exclusive():") >= 5
    status_route = server.index('if path == "/evidence/status":')
    list_route = server.index('if path in {"/evidence/list", "/evidence/file"}:')
    upload_route = server.index('if post_path == "/evidence/upload":')
    preview_route = server.index('if post_path == "/evidence/preview":')
    assert server.index("with _adapter_exclusive():", status_route) < server.index("module_dir.iterdir()", status_route)
    assert server.index("with _adapter_exclusive():", list_route) < server.index("record_dir.iterdir()", list_route)
    assert server.index("with _adapter_exclusive():", upload_route) < server.index("_evidence_record_exists(module, record_id)", upload_route)
    assert server.index("with _adapter_exclusive():", preview_route) < server.index("target.read_bytes()", preview_route)
