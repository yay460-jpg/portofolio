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


def _pdf_escape(value: object) -> str:
    text = str(value if value is not None else "")
    text = text.encode("latin-1", "replace").decode("latin-1")
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _report_lines(value: object, width: int = 92) -> list[str]:
    import textwrap
    if value is None:
        return []
    if isinstance(value, bool):
        return ["Yes" if value else "No"]
    if isinstance(value, (int, float)):
        return [str(value)]
    if isinstance(value, list):
        value = " · ".join(str(item) for item in value)
    if isinstance(value, dict):
        parts = []
        for key, item in value.items():
            if isinstance(item, dict):
                item = " · ".join(f"{k}: {v}" for k, v in item.items())
            elif isinstance(item, list):
                item = " · ".join(str(v) for v in item)
            parts.append(f"{str(key).replace('_', ' ').title()}: {item}")
        value = "\n".join(parts)
    return [line for raw in str(value).splitlines() for line in (textwrap.wrap(raw, width=width) or [""])]


def build_report_pdf(model: dict) -> bytes:
    """Create a small self-contained A4 PDF for the native browser PDF reader.

    This intentionally uses only the Python standard library so the offline
    desktop host does not acquire another runtime dependency.
    """
    if not isinstance(model, dict):
        raise ValueError("Report model must be an object.")

    W, H = 595, 842
    margin = 42
    pages: list[list[str]] = []
    current: list[str] = []
    y = H - 48

    def start_page() -> None:
        nonlocal current, y
        current = []
        pages.append(current)
        y = H - 48

    def emit(command: str) -> None:
        current.append(command)

    def ensure(height: float = 18) -> None:
        nonlocal y
        if y - height < 45:
            start_page()

    def text_line(value: object, x: float = margin, size: float = 9, bold: bool = False,
                  leading: float = 13, color: tuple[float, float, float] = (0.15, 0.22, 0.30)) -> None:
        nonlocal y
        ensure(leading)
        r, g, b = color
        emit(f"{r:.3f} {g:.3f} {b:.3f} rg")
        font = "F2" if bold else "F1"
        emit(f"BT /{font} {size:.2f} Tf {x:.2f} {y:.2f} Td ({_pdf_escape(value)}) Tj ET")
        y -= leading

    def wrapped(value: object, x: float = margin, size: float = 9, bold: bool = False,
                leading: float = 12, width: int = 92) -> None:
        lines = _report_lines(value, width)
        for line in lines:
            text_line(line, x, size, bold, leading)

    def rule(ypos: float, color=(0.14, 0.27, 0.44), width=1.5) -> None:
        r, g, b = color
        emit(f"{r:.3f} {g:.3f} {b:.3f} RG {width:.2f} w {margin:.2f} {ypos:.2f} m {W-margin:.2f} {ypos:.2f} l S")

    def box(x: float, top: float, w: float, h: float, fill=(0.97, 0.98, 0.99),
            stroke=(0.78, 0.82, 0.87)) -> None:
        fr, fg, fb = fill
        sr, sg, sb = stroke
        emit(f"{fr:.3f} {fg:.3f} {fb:.3f} rg {sr:.3f} {sg:.3f} {sb:.3f} RG 0.6 w {x:.2f} {top-h:.2f} {w:.2f} {h:.2f} re B")

    def section_heading(title: str) -> None:
        nonlocal y
        ensure(31)
        top = y + 4
        box(margin, top, W - 2*margin, 23, fill=(0.91, 0.94, 0.97), stroke=(0.76, 0.81, 0.87))
        text_line(title, margin + 8, 10.5, True, 14, (0.14, 0.27, 0.44))
        y -= 2

    start_page()
    report_type = str(model.get("report_type") or "REPORT").upper()
    period = model.get("period") or {}
    start = str(period.get("start") or "—")
    end = str(period.get("end") or start)
    period_text = start if start == end else f"{start} → {end}"
    status = str(model.get("status") or "DRAFT")
    kpi = model.get("kpi") or {}
    counts = model.get("source_counts") or {}
    sections = model.get("section_data") or {}
    section_plan = model.get("sections") or []

    text_line("LITHOSITE MINE SERVICES", margin, 8, True, 11, (0.14, 0.27, 0.44))
    text_line("Reports & KPI", margin, 20, True, 23, (0.08, 0.18, 0.30))
    text_line(f"{report_type} REPORT  ·  {period_text}", margin, 9, False, 13, (0.38, 0.45, 0.54))
    rule(y + 2)
    y -= 10

    section_heading("DOCUMENT CONTROL")
    control = [
        ("Report Type", report_type), ("Period", period_text),
        ("Status", status), ("Scope", model.get("scope") or "ALL"),
        ("Report ID", model.get("report_id") or "—"), ("Snapshot", model.get("snapshot_id") or "DRAFT"),
        ("Records", model.get("total_records", model.get("total_source_records", 0))),
        ("Data Status", model.get("report_data_status") or "REQUESTED_PERIOD"),
    ]
    col_w = (W - 2*margin) / 2
    for idx in range(0, len(control), 2):
        ensure(22)
        top = y + 4
        for col in range(2):
            label, value = control[idx + col]
            x = margin + col * col_w
            box(x, top, col_w, 20, fill=(0.97, 0.98, 0.99))
            text_line(label.upper(), x + 6, 6.5, True, 8, (0.38, 0.45, 0.54))
            text_line(value, x + 6, 8, False, 10, (0.15, 0.22, 0.30))
        y -= 21
    y -= 5

    section_heading("FLEET KPI")
    cards = [
        ("PA", kpi.get("PA", "—")), ("UA", kpi.get("UA", "—")),
        ("EU", kpi.get("EU", "—")), ("KPI STATUS", kpi.get("status", "UNAVAILABLE")),
    ]
    card_w = (W - 2*margin - 18) / 4
    for i, (label, value) in enumerate(cards):
        x = margin + i * (card_w + 6)
        box(x, y + 4, card_w, 42, fill=(0.97, 0.98, 0.99), stroke=(0.74, 0.80, 0.87))
        text_line(label, x + 7, 6.5, True, 8, (0.39, 0.45, 0.54))
        text_line(f"{value}%" if isinstance(value, (int, float)) else value, x + 7, 12, True, 15, (0.10, 0.23, 0.39))
    y -= 50

    executive_name = "Management Executive Summary" if report_type == "MONTHLY" else "Executive Summary"
    executive = sections.get(executive_name) or sections.get("Executive Summary") or {}
    section_heading(executive_name.upper())
    wrapped(executive, size=9, leading=12, width=92)
    y -= 3

    attention = executive.get("management_attention") if isinstance(executive, dict) else None
    if attention:
        section_heading("MANAGEMENT ATTENTION")
        wrapped(attention, size=9, leading=12, width=92)
        y -= 3

    section_heading("OPERATIONAL SOURCE SUMMARY")
    if counts:
        for domain, count in counts.items():
            ensure(16)
            text_line(f"{domain}: {count} records", margin + 8, 8.5, False, 11)
    else:
        text_line("No source records were reported for this snapshot.", margin + 8, 8.5, False, 11)
    y -= 4

    for name in section_plan:
        if name == executive_name:
            continue
        value = sections.get(name)
        section_heading(str(name).upper())
        wrapped(value if value is not None else "Source evidence retained in the immutable snapshot.",
                size=8.8, leading=12, width=92)
        y -= 3

    ensure(22)
    rule(y + 4, color=(0.78, 0.82, 0.87), width=0.7)
    text_line(f"Lithosite Mine Services · V38 · {report_type} Report", margin, 7, False, 9, (0.40, 0.46, 0.54))
    text_line("Immutable report snapshot · Native browser PDF reader", W - 265, 7, False, 9, (0.40, 0.46, 0.54))

    # Build a valid PDF from page content streams.
    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    page_object_ids = []
    content_object_ids = []
    for index in range(len(pages)):
        page_object_ids.append(5 + index * 2)
        content_object_ids.append(6 + index * 2)
    kids = " ".join(f"{obj} 0 R" for obj in page_object_ids)
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode())
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

    for index, commands in enumerate(pages):
        stream = "\n".join(commands).encode("latin-1", "replace")
        page_obj = f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {content_object_ids[index]} 0 R >>".encode()
        objects.append(page_obj)
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
    # Object numbers are intentionally contiguous: catalog=1, pages=2, fonts=3/4.
    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objects)+1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return bytes(pdf)


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

        if path in {"/user-guide", "/lithosite-Mine-Services/user-guide"}:
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
        if self.path == "/report-pdf":
            if origin and not is_allowed_origin(origin):
                self._json(403, {"status": "REJECTED", "errors": [{"code": "HOST-002", "message": "Origin not allowed"}]}, None)
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 10_000_000:
                    raise ValueError("Invalid report request size")
                model = json.loads(self.rfile.read(length).decode("utf-8"))
                payload = build_report_pdf(model)
                self.send_response(200)
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Length", str(len(payload)))
                self.send_header("Content-Disposition", 'inline; filename="lithosite-report.pdf"')
                if is_allowed_origin(origin):
                    self.send_header("Access-Control-Allow-Origin", origin or "*")
                    self.send_header("Vary", "Origin")
                self.end_headers()
                self.wfile.write(payload)
            except Exception as exc:
                self._json(400, {"status": "REJECTED", "errors": [{"code": "HOST-008", "message": str(exc)}]}, origin)
            return
        if self.path != "/runtime":
            self._json(404, {"status": "REJECTED", "errors": [{"code": "HOST-001", "message": "Endpoint not found"}]}, origin)
            return
        if origin and not is_allowed_origin(origin):
            self._json(403, {"status": "REJECTED", "errors": [{"code": "HOST-002", "message": "Origin not allowed"}]}, None)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 180_000_000:
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

