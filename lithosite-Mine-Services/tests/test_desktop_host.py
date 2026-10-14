import json
import sys
import pytest
from pathlib import Path
from urllib.request import Request, urlopen
from http.client import HTTPConnection
from urllib.error import HTTPError
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



def test_runtime_rejects_invalid_and_over_limit_content_lengths_before_read(monkeypatch, tmp_path):
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

        for length in ("0", "-1", "180000001", "not-a-number"):
            connection = HTTPConnection(host, port, timeout=3)
            try:
                connection.putrequest("POST", "/runtime")
                connection.putheader("Content-Length", length)
                connection.endheaders()
                response = connection.getresponse()
                payload = json.loads(response.read().decode("utf-8"))
                assert response.status == 400, (length, response.status, payload)
                assert payload["status"] == "REJECTED"
                assert payload["errors"][0]["code"] == "HOST-003"
                assert payload["errors"][0]["message"] == "Invalid JSON request"
            finally:
                connection.close()
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_user_guide_rejects_encoded_path_traversal(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    repo_root = tmp_path / "repo"
    guide_root = repo_root / "docs" / "lithosite" / "02_Mine-Services" / "10_User-Guides"
    guide_root.mkdir(parents=True)
    (tmp_path / "secret.pdf").write_bytes(b"private")
    monkeypatch.setattr(server, "REPO_ROOT", repo_root)

    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        query = urlencode({"file": "../../../../../secret.pdf"})
        with pytest.raises(HTTPError) as rejected:
            urlopen(f"http://{host}:{port}/user-guide?{query}")
        assert rejected.value.code == 400
        payload = json.loads(rejected.value.read().decode("utf-8"))
        assert payload["status"] == "REJECTED"
        assert payload["errors"][0]["code"] == "HOST-007"
        assert "secret.pdf" not in json.dumps(payload)
    finally:
        httpd.shutdown()
        httpd.server_close()

@pytest.mark.parametrize("origin", ["http://evil.example", "http://localhost:8766", "http://127.0.0.1:5502", "null"])
def test_disallowed_origin_is_rejected(monkeypatch, tmp_path, origin):
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
            headers={"Content-Type":"application/json","Origin":origin},
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




def test_static_handler_serves_required_ui_assets_but_rejects_repository_files(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    repo_root = Path(__file__).parents[2].resolve()
    monkeypatch.setattr(server, "STATIC_ROOT", repo_root)
    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        base = f"http://{host}:{port}"

        for allowed_path in (
            "/lithosite-Mine-Services/ui/shared/runtime-client.js",
            "/lithosite-Mine-Services/Artifacts/Mine-Services-Operations.html",
            "/lithosite-Mine-Services/shared/geo-engine.js",
            "/assets/lithosite-icons.svg",
            "/lithosite-Mine-Geologist/assets/icon-192.png",
        ):
            with urlopen(base + allowed_path) as response:
                assert response.status == 200, allowed_path
                assert response.read(), allowed_path

        for denied_path in (
            "/.gitignore",
            "/.github/workflows/mine-services-pytest.yml",
            "/lithosite-Mine-Services/src/mine_services/adapter.py",
            "/lithosite-Mine-Services/Documentation/Security/README.md",
            "/lithosite-Mine-Services/tests/test_runtime.py",
        ):
            with pytest.raises(HTTPError) as rejected:
                urlopen(base + denied_path)
            assert rejected.value.code == 404, denied_path
    finally:
        httpd.shutdown()
        httpd.server_close()


@pytest.mark.parametrize(
    ("module", "entity", "id_field"),
    [
        ("TargetPlan", "Plans", "plan_id"),
        ("HSE", "HSE", "hse_id"),
        ("Maintenance", "Maintenance", "maintenance_id"),
    ],
)
def test_evidence_owner_verification_uses_public_read_allowlist(
    monkeypatch, tmp_path, module, entity, id_field
):
    server = _load_server(monkeypatch, tmp_path)
    calls = []

    class FakeAdapter:
        def handle(self, request):
            calls.append(request)
            return {"request_id": request["request_id"], "status": "OK", "data": [{id_field: "record-1"}]}

    monkeypatch.setattr(server, "ADAPTER", FakeAdapter())

    assert server._evidence_record_exists(module, "record-1") is True
    assert len(calls) == 1
    assert calls[0]["operation"] == "READ"
    assert calls[0]["entity"] == entity


def test_evidence_owner_verification_rejects_unknown_module_before_read(monkeypatch, tmp_path):
    server = _load_server(monkeypatch, tmp_path)

    class NeverCalledAdapter:
        def handle(self, request):
            pytest.fail("unknown evidence module must not dispatch a READ")

    monkeypatch.setattr(server, "ADAPTER", NeverCalledAdapter())
    with pytest.raises(ValueError, match="Unsupported evidence module"):
        server._evidence_record_exists("AuditLog", "record-1")


@pytest.mark.parametrize(
    ("body", "internal_detail"),
    [
        (json.dumps([]).encode("utf-8"), "Report model must be an object"),
        (b'{"broken":', "Expecting value"),
    ],
)
def test_report_pdf_rejects_malformed_requests_with_sanitized_error(
    monkeypatch, tmp_path, body, internal_detail
):
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
            f"http://{host}:{port}/report-pdf",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with pytest.raises(HTTPError) as rejected:
            urlopen(request)
        assert rejected.value.code == 400
        payload = json.loads(rejected.value.read().decode("utf-8"))
        assert payload["status"] == "REJECTED"
        assert payload["errors"][0]["code"] == "HOST-008"
        assert payload["errors"][0]["message"] == "Invalid report request"
        assert internal_detail not in json.dumps(payload)
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_evidence_rejects_symlinked_module_and_file_paths(monkeypatch, tmp_path):
    db_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(db_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(db_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")
    import server

    evidence_root = tmp_path / "Evidence"
    outside = tmp_path / "outside"
    outside.mkdir()
    (outside / "secret.pdf").write_bytes(b"%PDF-private")
    evidence_root.mkdir()
    try:
        (evidence_root / "TargetPlan").symlink_to(outside, target_is_directory=True)
    except (OSError, NotImplementedError):
        pytest.skip("directory symlinks are not available on this platform")

    monkeypatch.setattr(server, "EVIDENCE_ROOT", evidence_root)
    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    try:
        import threading
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address
        base = f"http://{host}:{port}"

        with pytest.raises(HTTPError) as module_rejected:
            urlopen(
                f"{base}/evidence/list?"
                + urlencode({"module": "TargetPlan", "record_id": "PLN-TEST-001"})
            )
        assert module_rejected.value.code == 400
        module_payload = json.loads(module_rejected.value.read().decode("utf-8"))
        assert module_payload["status"] == "REJECTED"
        assert "secret.pdf" not in json.dumps(module_payload)

        # Replace the module link with an in-root record and a file link that
        # points outside Evidence; the file endpoint must refuse to serve it.
        (evidence_root / "TargetPlan").unlink()
        record_dir = evidence_root / "TargetPlan" / "PLN-TEST-001"
        record_dir.mkdir(parents=True)
        try:
            (record_dir / "linked.pdf").symlink_to(outside / "secret.pdf")
        except (OSError, NotImplementedError):
            pytest.skip("file symlinks are not available on this platform")

        with pytest.raises(HTTPError) as file_rejected:
            urlopen(
                f"{base}/evidence/file?"
                + urlencode({
                    "module": "TargetPlan",
                    "record_id": "PLN-TEST-001",
                    "filename": "linked.pdf",
                })
            )
        assert file_rejected.value.code == 404
        file_payload = json.loads(file_rejected.value.read().decode("utf-8"))
        assert file_payload["status"] == "REJECTED"
        assert "secret.pdf" not in json.dumps(file_payload)
    finally:
        httpd.shutdown()
        httpd.server_close()
