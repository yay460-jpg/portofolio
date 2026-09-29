"""Local offline desktop host for the Mine Services RuntimeAdapter.

Binds only to loopback. The browser UI talks to this host through HTTP; the
host owns the Python runtime and local XLSX persistence. No network service
outside the local machine is required.
"""
from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
MODULE_ROOT = HERE.parent
REPO_ROOT = MODULE_ROOT.parent
SRC_ROOT = MODULE_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from mine_services import PersistenceStore, RuntimeAdapter, RuntimeInterface, ApplicationService  # noqa: E402

HOST = "127.0.0.1"
PORT = int(os.environ.get("MINE_SERVICES_PORT", "8765"))
DB_PATH = Path(os.environ.get("MINE_SERVICES_DB", str(MODULE_ROOT / "Database" / "Mine-Services-Database.xlsx"))).resolve()
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
}


def build_adapter() -> RuntimeAdapter:
    store = PersistenceStore(DB_PATH)
    application = ApplicationService(store=store)
    return RuntimeAdapter(RuntimeInterface(application=application))


ADAPTER = build_adapter()


class Handler(BaseHTTPRequestHandler):
    server_version = "MineServicesDesktopHost/1.0"

    def _headers(self, status=200, origin=None):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        if origin in ALLOWED_ORIGINS:
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
        if self.path != "/health":
            self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-001", "message": "Endpoint not found"}]}, origin)
            return
        self._json(200, {
            "status": "READY",
            "offline": True,
            "schema": "A.2",
            "runtime": "RuntimeAdapter",
            "database": str(DB_PATH),
        }, origin)

    def do_POST(self):
        origin = self.headers.get("Origin")
        if self.path != "/runtime":
            self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-001", "message": "Endpoint not found"}]}, origin)
            return
        if origin and origin not in ALLOWED_ORIGINS:
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
    print(f"Database: {DB_PATH}")
    print("Offline local runtime. Press Ctrl+C to stop.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
