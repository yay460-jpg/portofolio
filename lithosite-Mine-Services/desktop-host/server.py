"""Local offline desktop host for the Mine Services RuntimeAdapter.

Binds only to loopback. The browser UI talks to this host through HTTP; the
host owns the Python runtime and local XLSX persistence. No network service
outside the local machine is required.
"""
from __future__ import annotations

import base64
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from mimetypes import guess_type
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
MODULE_ROOT = HERE.parent
REPO_ROOT = MODULE_ROOT.parent
SRC_ROOT = MODULE_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from mine_services import PersistenceStore, RuntimeAdapter, RuntimeInterface, ApplicationService  # noqa: E402
from mine_services import schema_a3  # noqa: E402

HOST = "127.0.0.1"
PORT = int(os.environ.get("MINE_SERVICES_PORT", "8765"))
STATIC_ROOT = REPO_ROOT.resolve()
STATIC_ENTRY = os.environ.get("MINE_SERVICES_ENTRY", "/lithosite-Mine-Services/Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v37-STAGE26.html")
DB_PATH = Path(os.environ.get("MINE_SERVICES_DB", str(MODULE_ROOT / "Database" / "Mine-Services-Database-A3.xlsx"))).resolve()

SCHEMA_NAME = os.environ.get("MINE_SERVICES_SCHEMA", "A3").upper()

if SCHEMA_NAME == "A2":
    SCHEMA_MODULE = None
elif SCHEMA_NAME == "A3":
    SCHEMA_MODULE = schema_a3
else:
    raise RuntimeError(
        f"Unsupported MINE_SERVICES_SCHEMA: {SCHEMA_NAME}. Expected A2 or A3."
    )
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
}

def is_allowed_origin(origin: str | None) -> bool:
    if origin in ALLOWED_ORIGINS:
        return True
    if not origin:
        return True
    try:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        return parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"}
    except Exception:
        return False


def build_adapter() -> RuntimeAdapter:
    store = PersistenceStore(DB_PATH, schema_module=SCHEMA_MODULE)
    application = ApplicationService(store=store)
    return RuntimeAdapter(RuntimeInterface(application=application))


ADAPTER = build_adapter()


class Handler(BaseHTTPRequestHandler):
    server_version = "MineServicesDesktopHost/1.0"

    def _headers(self, status=200, origin=None):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if is_allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _json(self, status, payload, origin=None):
        body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self._headers(status, origin)
        self.wfile.write(body)

    def do_OPTIONS(self):
        origin = self.headers.get("Origin")
        self._headers(204, origin)

    def do_GET(self):
        origin = self.headers.get("Origin")
        path = unquote(self.path.split("?", 1)[0])

        if path == "/health":
            self._json(200, {
                "status": "READY",
                "offline": True,
                "schema": ("A.2" if SCHEMA_NAME == "A2" else "A.3"),
                "runtime": "RuntimeAdapter",
                "database": str(DB_PATH),
            }, origin)
            return

        if path == "/":
            self.send_response(302)
            self.send_header("Location", STATIC_ENTRY)
            self.end_headers()
            return

        if path == "/user-guide":
            from urllib.parse import parse_qs
            requested = parse_qs(self.path.split("?", 1)[1] if "?" in self.path else "").get("file", [""])[0]
            guide_root = (REPO_ROOT / "docs" / "lithosite" / "02_Mine-Services" / "10_User-Guides").resolve()
            target = (guide_root / requested).resolve() if requested else guide_root
            try:
                target.relative_to(guide_root)
            except ValueError:
                self._json(400, {"status": "REJECTED", "errors": [{"code": "HOST-007", "message": "Invalid user guide path"}]}, origin)
                return
            if target.suffix.lower() != ".pdf" or not target.is_file():
                self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-001", "message": "User guide not found"}]}, origin)
                return
            payload = {
                "status": "READY",
                "filename": target.name,
                "mime": "application/pdf",
                "data": base64.b64encode(target.read_bytes()).decode("ascii"),
            }
            self._json(200, payload, origin)
            return

        try:
            relative = Path(path.lstrip("/"))
            target = (STATIC_ROOT / relative).resolve()
            target.relative_to(STATIC_ROOT)
        except (ValueError, OSError):
            self._json(400, {"status": "REJECTED", "errors": [{"code": "HOST-005", "message": "Invalid static path"}]}, origin)
            return

        # The desktop host serves the UI and static assets, but never exposes
        # the offline XLSX database itself.
        if "Database" in target.relative_to(STATIC_ROOT).parts or target.suffix.lower() in {".xlsx", ".xls", ".csv"}:
            self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-006", "message": "Static resource not available"}]}, origin)
            return

        if not target.is_file():
            self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-001", "message": "Endpoint not found"}]}, origin)
            return

        content_type = guess_type(str(target))[0] or "application/octet-stream"
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if target.suffix.lower() == ".pdf":
            self.send_header("Content-Disposition", "inline")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        origin = self.headers.get("Origin")
        if self.path != "/runtime":
            self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-001", "message": "Endpoint not found"}]}, origin)
            return
        if origin and not is_allowed_origin(origin):
            self._json(403, {"status": "REJECTED", "errors": [{"code": "HOST-002", "message": "Origin not allowed"}]}, None)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 2_000_000:
                raise ValueError("Invalid request size")
            request = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(request, dict):
                raise ValueError("Request must be an object")
        except Exception:
            self._json(400, {"status": "REJECTED", "errors": [{"code": "HOST-003", "message": "Invalid JSON request"}]}, origin)
            return
        try:
            result = ADAPTER.handle(request)
            self._json(200, result, origin)
        except Exception:
            self._json(500, {
                "request_id": request.get("request_id"),
                "status": "REJECTED",
                "errors": [{"code": "HOST-004", "message": "Host runtime failure"}],
            }, origin)

    def log_message(self, format, *args):
        print("[Mine Services Host]", format % args)


def main():
    print(f"Mine Services Desktop Host — http://{HOST}:{PORT}")
    print(f"UI: http://{HOST}:{PORT}/")
    print(f"Database: {DB_PATH}")
    print("Offline local runtime. Press Ctrl+C to stop.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()

