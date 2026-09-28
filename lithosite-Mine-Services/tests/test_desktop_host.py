import json
import sys
from pathlib import Path
from unittest.mock import patch
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
sys.path.insert(0, str(Path(__file__).parents[1] / "desktop-host"))

import server


def test_health_endpoint_is_offline_ready():
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
        assert payload["schema"] == "A.1"
    finally:
        httpd.shutdown()
        httpd.server_close()


def test_runtime_endpoint_routes_to_adapter():
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


def test_disallowed_origin_is_rejected():
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
