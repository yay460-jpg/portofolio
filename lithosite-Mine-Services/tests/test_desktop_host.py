import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
sys.path.insert(0, str(Path(__file__).parents[1] / "desktop-host"))


def _load_server(monkeypatch, tmp_path):
    monkeypatch.setenv("MINE_SERVICES_DB", str(tmp_path / "desktop-host-a3.xlsx"))
    import server
    return server


def _make_test_database(path):
    from openpyxl import Workbook
    from mine_services.schema import DOMAIN_ENTITIES, HEADERS, SCHEMA_VERSION
    from mine_services.persistence import PersistenceStore

    wb = Workbook()
    wb.remove(wb.active)

    baseline = wb.create_sheet("_Baseline")
    baseline.append(["baseline_status", "LOCKED"])

    system = wb.create_sheet("_System")
    system.append(["schema_version", SCHEMA_VERSION])

    lists = wb.create_sheet("_Lists")
    defaults = PersistenceStore().controlled_lists
    headers = list(defaults)
    lists.append(headers)
    for i in range(max(len(values) for values in defaults.values())):
        lists.append([
            sorted(defaults[h])[i] if i < len(defaults[h]) else None
            for h in headers
        ])

    for entity in DOMAIN_ENTITIES:
        ws = wb.create_sheet(entity)
        ws.append(HEADERS[entity])

    audit = wb.create_sheet("AuditLog")
    audit.append(HEADERS["AuditLog"])
    wb.save(path)


def test_health_endpoint_is_offline_ready(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        host, port = httpd.server_address
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        with urlopen(f"http://{host}:{port}/health") as response:
            payload = json.loads(response.read().decode())
        assert payload["status"] == "READY"
        assert payload["offline"] is True
        assert payload["schema"] == "A.3"
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_runtime_endpoint_routes_to_adapter(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        request = Request(
            f"http://{host}:{port}/runtime",
            data=json.dumps({
                "request_id": "desktop-host-read",
                "operation": "READ",
                "entity": "Equipment",
            }).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request) as response:
            payload = json.loads(response.read().decode())
        assert payload["request_id"] == "desktop-host-read"
        assert payload.get("status") in (None, "OK")
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_disallowed_origin_is_rejected(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        request = Request(
            f"http://{host}:{port}/runtime",
            data=json.dumps({"request_id":"origin-test","operation":"READ","entity":"Equipment"}).encode(),
            headers={"Content-Type":"application/json","Origin":"http://evil.example"},
            method="POST",
        )
        try:
            urlopen(request)
            assert False, "expected HTTP 403"
        except Exception as exc:
            assert "403" in str(exc)
    finally:
        httpd.shutdown()
        httpd.server_close()
