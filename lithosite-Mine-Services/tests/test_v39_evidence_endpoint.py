import base64
import importlib.util
import json
import sys
import threading
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import pytest

ROOT = Path(__file__).resolve().parents[1]
HOST_FILE = ROOT / "desktop-host" / "server.py"
sys.path.insert(0, str(ROOT / "src"))


def _make_test_database(path):
    from openpyxl import Workbook
    from mine_services.persistence import PersistenceStore
    from mine_services.schema import DOMAIN_ENTITIES, HEADERS, SCHEMA_VERSION

    workbook = Workbook()
    workbook.remove(workbook.active)

    baseline = workbook.create_sheet("_Baseline")
    baseline.append(["baseline_status", "LOCKED"])

    system = workbook.create_sheet("_System")
    system.append(["schema_version", SCHEMA_VERSION])

    lists = workbook.create_sheet("_Lists")
    defaults = PersistenceStore().controlled_lists
    headers = list(defaults)
    lists.append(headers)
    for index in range(max(len(values) for values in defaults.values())):
        lists.append([
            sorted(defaults[header])[index] if index < len(defaults[header]) else None
            for header in headers
        ])

    for entity in DOMAIN_ENTITIES:
        worksheet = workbook.create_sheet(entity)
        worksheet.append(HEADERS[entity])

    audit = workbook.create_sheet("AuditLog")
    audit.append(HEADERS["AuditLog"])
    workbook.save(path)


@pytest.fixture
def evidence_host(monkeypatch, tmp_path):
    database_path = tmp_path / "desktop-host-a3.xlsx"
    _make_test_database(database_path)
    monkeypatch.setenv("MINE_SERVICES_DB", str(database_path))
    monkeypatch.setenv("MINE_SERVICES_SCHEMA", "A3")

    module_name = f"_evidence_test_server_{uuid.uuid4().hex}"
    spec = importlib.util.spec_from_file_location(module_name, HOST_FILE)
    assert spec is not None and spec.loader is not None
    server = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = server
    spec.loader.exec_module(server)

    httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    host, port = httpd.server_address

    try:
        yield f"http://{host}:{port}", server
    finally:
        httpd.shutdown()
        httpd.server_close()
        thread.join(timeout=3)
        sys.modules.pop(module_name, None)


def _get(base_url, endpoint, params):
    separator = "&" if "?" in endpoint else "?"
    url = f"{base_url}{endpoint}{separator}{urlencode(params)}"
    try:
        with urlopen(url, timeout=5) as response:
            return response.status, response.headers, response.read()
    except HTTPError as error:
        return error.code, error.headers, error.read()


def _payload(body):
    return json.loads(body.decode("utf-8"))


def _post_json(base_url, endpoint, payload):
    request = Request(
        f"{base_url}{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=5) as response:
            return response.status, response.headers, response.read()
    except HTTPError as error:
        return error.code, error.headers, error.read()


def test_evidence_preview_post_returns_pdf_and_image_bytes_as_json(evidence_host):
    base_url, server = evidence_host
    record_dir = server.EVIDENCE_ROOT / "TargetPlan" / "PLN-PREVIEW-01"
    record_dir.mkdir(parents=True)
    cases = [
        ("agreement.pdf", b"%PDF-1.7 preview payload", "application/pdf"),
        ("site-photo.jpg", b"jpeg preview payload", "image/jpeg"),
    ]

    for filename, original_bytes, mime_type in cases:
        (record_dir / filename).write_bytes(original_bytes)
        status, headers, body = _post_json(
            base_url,
            "/evidence/preview",
            {
                "module": "TargetPlan",
                "record_id": "PLN-PREVIEW-01",
                "filename": filename,
            },
        )

        assert status == 200
        assert headers.get_content_type() == "application/json"
        assert "Content-Disposition" not in headers
        payload = _payload(body)
        assert payload["status"] == "READY"
        assert payload["mime_type"] == mime_type
        assert payload["filename"] == filename
        assert base64.b64decode(payload["data"], validate=True) == original_bytes


@pytest.mark.parametrize(
    ("payload", "expected_status"),
    [
        ({"module": "Plans", "record_id": "PLN-01", "filename": "file.pdf"}, 400),
        ({"module": "TargetPlan", "record_id": "../outside", "filename": "file.pdf"}, 400),
        ({"module": "TargetPlan", "record_id": "PLN-01", "filename": "../outside.pdf"}, 400),
        ({"module": "TargetPlan", "record_id": "PLN-01", "filename": "file.docx"}, 400),
        ({"module": "TargetPlan", "record_id": "PLN-01", "filename": "missing.pdf"}, 404),
    ],
)
def test_evidence_preview_post_rejects_invalid_or_missing_files(evidence_host, payload, expected_status):
    base_url, _server = evidence_host

    status, headers, body = _post_json(base_url, "/evidence/preview", payload)

    assert status == expected_status
    assert headers.get_content_type() == "application/json"
    result = _payload(body)
    assert result["status"] == "REJECTED"
    assert result["errors"]


def test_evidence_listing_returns_only_supported_direct_child_files(evidence_host):
    base_url, server = evidence_host
    record_dir = server.EVIDENCE_ROOT / "TargetPlan" / "PLN-TEST-01"
    record_dir.mkdir(parents=True)
    (record_dir / "agreement.pdf").write_bytes(b"%PDF-1.4 test")
    (record_dir / "field-photo.JPG").write_bytes(b"jpeg test")
    (record_dir / "approval.docx").write_bytes(b"word test")
    (record_dir / "not-evidence.exe").write_bytes(b"ignore")

    status, headers, body = _get(
        base_url,
        "/evidence/list",
        {"module": "TargetPlan", "record_id": "PLN-TEST-01"},
    )

    assert status == 200
    assert headers.get_content_type() == "application/json"
    payload = _payload(body)
    assert payload["status"] == "READY"
    assert payload["module"] == "TargetPlan"
    assert payload["record_id"] == "PLN-TEST-01"
    assert payload["folder"] == "Database/Evidence/TargetPlan/PLN-TEST-01"

    files = {item["name"]: item for item in payload["files"]}
    assert set(files) == {"agreement.pdf", "field-photo.JPG", "approval.docx"}
    assert files["agreement.pdf"]["previewable"] is True
    assert files["field-photo.JPG"]["previewable"] is True
    assert files["approval.docx"]["previewable"] is False
    assert all(item["available"] is True for item in files.values())


@pytest.mark.parametrize(
    ("filename", "body", "expected_type", "expected_disposition"),
    [
        ("agreement.pdf", b"%PDF-1.4 test", "application/pdf", "inline"),
        ("field-photo.jpg", b"jpeg test", "image/jpeg", "inline"),
        ("approval.docx", b"word test", None, "attachment"),
    ],
)
def test_evidence_file_endpoint_previews_images_and_downloads_word_documents(
    evidence_host, filename, body, expected_type, expected_disposition
):
    base_url, server = evidence_host
    record_dir = server.EVIDENCE_ROOT / "TargetPlan" / "PLN-TEST-02"
    record_dir.mkdir(parents=True)
    (record_dir / filename).write_bytes(body)

    status, headers, response_body = _get(
        base_url,
        "/evidence/file",
        {
            "module": "TargetPlan",
            "record_id": "PLN-TEST-02",
            "filename": filename,
        },
    )

    assert status == 200
    assert response_body == body
    if expected_type:
        assert headers.get_content_type() == expected_type
    assert headers.get("Content-Disposition", "").startswith(expected_disposition + ";")
    assert headers.get("Cache-Control") == "no-store"
    assert headers.get("X-Content-Type-Options") == "nosniff"


@pytest.mark.parametrize(
    ("endpoint", "params"),
    [
        ("/evidence/list", {"module": "Plans", "record_id": "PLN-01"}),
        ("/evidence/list", {"module": "TargetPlan", "record_id": "../outside"}),
        (
            "/evidence/file",
            {"module": "TargetPlan", "record_id": "PLN-01", "filename": "../outside.pdf"},
        ),
        (
            "/evidence/file",
            {"module": "TargetPlan", "record_id": "PLN-01", "filename": r"..\\outside.pdf"},
        ),
        (
            "/evidence/file",
            {"module": "TargetPlan", "record_id": "PLN-01", "filename": "payload.exe"},
        ),
    ],
)
def test_evidence_endpoint_rejects_invalid_module_ids_paths_and_extensions(
    evidence_host, endpoint, params
):
    base_url, _server = evidence_host

    status, _headers, body = _get(base_url, endpoint, params)

    assert status == 400
    payload = _payload(body)
    assert payload["status"] == "REJECTED"
    assert payload["errors"]


def test_evidence_file_endpoint_returns_not_found_for_missing_file(evidence_host):
    base_url, _server = evidence_host

    status, _headers, body = _get(
        base_url,
        "/evidence/file",
        {
            "module": "TargetPlan",
            "record_id": "PLN-MISSING-01",
            "filename": "missing.pdf",
        },
    )

    assert status == 404
    payload = _payload(body)
    assert payload["status"] == "REJECTED"
    assert payload["errors"][0]["code"] == "HOST-001"
