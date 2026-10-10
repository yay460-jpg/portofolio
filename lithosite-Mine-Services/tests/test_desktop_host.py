import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

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

def test_evidence_list_and_file_endpoints_serve_only_supported_record_files(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    evidence_root = tmp_path / "Evidence"
    monkeypatch.setattr(server, "EVIDENCE_ROOT", evidence_root)
    record_dir = evidence_root / "TargetPlan" / "PLN-TEST-001"
    record_dir.mkdir(parents=True)
    (record_dir / "mineout.pdf").write_bytes(b"%PDF-evidence-test")
    (record_dir / "pit-photo.PNG").write_bytes(b"\x89PNG\r\n evidence-test")
    (record_dir / "agreement.docx").write_bytes(b"word-document-test")
    (record_dir / "ignored.exe").write_bytes(b"not an evidence type")

    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        base = f"http://{host}:{port}"
        query = urlencode({"module": "TargetPlan", "record_id": "PLN-TEST-001"})
        with urlopen(f"{base}/evidence/list?{query}") as response:
            listing = json.loads(response.read().decode("utf-8"))

        assert listing["status"] == "READY"
        assert listing["folder"] == "Database/Evidence/TargetPlan/PLN-TEST-001"
        assert {item["name"] for item in listing["files"]} == {
            "agreement.docx", "mineout.pdf", "pit-photo.PNG"
        }
        assert next(item for item in listing["files"] if item["name"] == "mineout.pdf")["previewable"] is True
        assert next(item for item in listing["files"] if item["name"] == "agreement.docx")["previewable"] is False

        with urlopen(f"{base}/evidence/file?{urlencode({'module':'TargetPlan','record_id':'PLN-TEST-001','filename':'mineout.pdf'})}") as response:
            pdf_bytes = response.read()
            assert response.headers.get_content_type() == "application/pdf"
            assert response.headers.get("Content-Disposition", "").startswith("inline;")
        assert pdf_bytes == b"%PDF-evidence-test"

        with urlopen(f"{base}/evidence/file?{urlencode({'module':'TargetPlan','record_id':'PLN-TEST-001','filename':'agreement.docx'})}") as response:
            docx_bytes = response.read()
            assert response.headers.get("Content-Disposition", "").startswith("attachment;")
        assert docx_bytes == b"word-document-test"
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_evidence_endpoints_reject_invalid_module_record_path_and_filename(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    monkeypatch.setattr(server, "EVIDENCE_ROOT", tmp_path / "Evidence")
    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        base = f"http://{host}:{port}"
        invalid_queries = [
            ("/evidence/list", {"module": "Database", "record_id": "PLN-TEST-001"}),
            ("/evidence/list", {"module": "TargetPlan", "record_id": "../outside"}),
            ("/evidence/file", {"module": "TargetPlan", "record_id": "PLN-TEST-001", "filename": "../outside.pdf"}),
            ("/evidence/file", {"module": "TargetPlan", "record_id": "PLN-TEST-001", "filename": "payload.exe"}),
        ]
        for route, params in invalid_queries:
            try:
                urlopen(f"{base}{route}?{urlencode(params)}")
                assert False, f"expected request rejection for {route} {params}"
            except Exception as exc:
                assert "400" in str(exc)
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_evidence_endpoint_rejects_disallowed_origin(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    monkeypatch.setattr(server, "EVIDENCE_ROOT", tmp_path / "Evidence")
    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        query = urlencode({"module": "TargetPlan", "record_id": "PLN-TEST-001"})
        request = Request(
            f"http://{host}:{port}/evidence/list?{query}",
            headers={"Origin": "http://evil.example"},
        )
        try:
            urlopen(request)
            assert False, "expected HTTP 403"
        except Exception as exc:
            assert "403" in str(exc)
    finally:
        httpd.shutdown()
        httpd.server_close()

