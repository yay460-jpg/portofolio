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
STATIC_ENTRY = os.environ.get("MINE_SERVICES_ENTRY", "/lithosite-Mine-Services/Artifacts/Mine-Services-Concept-2-Dashboard-Operations-v38-STAGE27.html")
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
    if not origin or origin == "null":
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
    """Build a clean, compact management-grade A4 PDF using only the Python stdlib."""
    if not isinstance(model, dict):
        raise ValueError("Report model must be an object.")

    W, H = 595, 842
    M = 42
    usable = W - 2 * M
    pages: list[list[str]] = []
    current: list[str] = []
    y = H - 42

    def start_page() -> None:
        nonlocal current, y
        current = []
        pages.append(current)
        y = H - 42

    def emit(s: str) -> None:
        current.append(s)

    def ensure(h: float) -> None:
        nonlocal y
        if y - h < 48:
            start_page()

    def fmt_number(value: object, decimals: int = 2) -> str:
        try:
            n = float(value)
            return f"{n:.{decimals}f}"
        except (TypeError, ValueError):
            return str(value)

    def display_value(key: str, value: object) -> str:
        if value is None:
            return "—"
        if isinstance(value, bool):
            return "Yes" if value else "No"
        if key in {"PA", "UA", "EU"}:
            try:
                return f"{float(value):.2f}%"
            except (TypeError, ValueError):
                return str(value)
        if key in {"actual_records", "planned_records", "record_count", "completed_count",
                   "open_count", "open_issue_count", "open_plan_count"}:
            return fmt_number(value, 0)
        return str(value)

    def txt(value: object, x: float, size: float = 8.5, bold: bool = False,
            leading: float = 11, color=(0.16, 0.24, 0.34)) -> None:
        nonlocal y
        ensure(leading)
        r, g, b = color
        font = "F2" if bold else "F1"
        emit(f"{r:.3f} {g:.3f} {b:.3f} rg")
        emit(f"BT /{font} {size:.2f} Tf {x:.2f} {y:.2f} Td ({_pdf_escape(value)}) Tj ET")
        y -= leading

    def at(value: object, x: float, ypos: float, size: float = 8.5,
           bold: bool = False, color=(0.16, 0.24, 0.34)) -> None:
        r, g, b = color
        font = "F2" if bold else "F1"
        emit(f"{r:.3f} {g:.3f} {b:.3f} rg")
        emit(f"BT /{font} {size:.2f} Tf {x:.2f} {ypos:.2f} Td ({_pdf_escape(value)}) Tj ET")

    def wrap(value: object, width: int = 96) -> list[str]:
        import textwrap
        if value is None:
            return []
        if isinstance(value, bool):
            value = "Yes" if value else "No"
        elif isinstance(value, (int, float)):
            value = str(value)
        elif isinstance(value, list):
            value = " · ".join(str(v) for v in value)
        elif isinstance(value, dict):
            rows = []
            for key, item in value.items():
                if isinstance(item, dict):
                    item = " · ".join(f"{k}: {v}" for k, v in item.items())
                elif isinstance(item, list):
                    item = " · ".join(str(v) for v in item)
                rows.append(f"{str(key).replace('_', ' ').title()}: {item}")
            value = "\n".join(rows)
        return [line for raw in str(value).splitlines()
                for line in (textwrap.wrap(raw, width=width) or [""])]

    def rect(x: float, top: float, w: float, h: float,
             fill=(0.97, 0.98, 0.99), stroke=(0.78, 0.82, 0.87), sw=0.6) -> None:
        fr, fg, fb = fill
        sr, sg, sb = stroke
        emit(f"{fr:.3f} {fg:.3f} {fb:.3f} rg {sr:.3f} {sg:.3f} {sb:.3f} RG {sw:.2f} w "
             f"{x:.2f} {top-h:.2f} {w:.2f} {h:.2f} re B")

    def line(ypos: float, color=(0.14, 0.29, 0.47), sw=1.0) -> None:
        r, g, b = color
        emit(f"{r:.3f} {g:.3f} {b:.3f} RG {sw:.2f} w {M:.2f} {ypos:.2f} m {W-M:.2f} {ypos:.2f} l S")

    def heading(title: str) -> None:
        nonlocal y
        ensure(25)
        top = y + 5
        rect(M, top, usable, 19, fill=(0.92, 0.95, 0.98), stroke=(0.78, 0.83, 0.89))
        at(title.upper(), M + 8, top - 13, 9.3, True, (0.14, 0.29, 0.47))
        y = top - 25

    def field_pair(label1, value1, label2, value2, height: float = 24) -> None:
        nonlocal y
        ensure(height + 6)
        col = usable / 2
        top = y + 4
        for i, (label, value) in enumerate(((label1, value1), (label2, value2))):
            x = M + i * col
            rect(x, top, col, height, fill=(0.975, 0.98, 0.99))
            at(str(label).upper(), x + 7, top - 8, 6.2, True, (0.39, 0.46, 0.55))
            at(str(value), x + 7, top - 18, 7.8, False, (0.16, 0.24, 0.34))
        y = top - height - 2

    def paragraph(value: object, size=8.3, leading=11, width=96) -> None:
        nonlocal y
        lines = wrap(value, width)
        if not lines:
            lines = ["No section-specific narrative is available."]
        for s in lines:
            txt(s, M + 5, size, False, leading)
        y -= 2

    def source_table(counts: dict) -> None:
        nonlocal y
        rows = list(counts.items())
        if not rows:
            paragraph("No source records were reported for this snapshot.", 8.2, 10.5)
            return
        col = usable / 2
        row_h = 19
        for idx in range(0, len(rows), 2):
            ensure(row_h + 3)
            top = y + 4
            for j in range(2):
                if idx + j >= len(rows):
                    continue
                domain, count = rows[idx + j]
                x = M + j * col
                rect(x, top, col, row_h, fill=(0.985, 0.988, 0.992), stroke=(0.84, 0.87, 0.91))
                at(str(domain).upper(), x + 7, top - 8, 6.5, True, (0.39, 0.46, 0.55))
                at(f"{fmt_number(count, 0)} records", x + 7, top - 15.5, 8.2, True, (0.16, 0.29, 0.45))
            y = top - row_h - 3

    def compact_status_box(label: str, value: object, height: float = 28) -> None:
        nonlocal y
        ensure(height + 5)
        top = y + 3
        rect(M + 5, top, usable - 10, height, fill=(0.98, 0.985, 0.99), stroke=(0.82, 0.86, 0.91))
        at(label.upper(), M + 12, top - 8, 6.3, True, (0.14, 0.29, 0.47))
        lines = wrap(value, 92)
        if lines:
            at(lines[0], M + 12, top - 19, 7.8, False, (0.29, 0.36, 0.44))
        y = top - height - 4

    def kpi_summary(section: dict) -> None:
        nonlocal y
        rows = [
            ("Comparison", "comparison_available"),
            ("Current PA", "PA"),
            ("Current UA", "UA"),
            ("Current EU", "EU"),
            ("Current Status", "status"),
        ]
        for label, key in rows:
            if key not in section:
                continue
            value = section[key]
            if key == "comparison_available" and isinstance(value, bool):
                value = "Available" if value else "Not available"
            elif key in {"PA", "UA", "EU"}:
                value = display_value(key, value)
            else:
                value = str(value)
            field_pair(label, value, "", "", 22)
            # cover the empty right-hand cell with the same background, but keep
            # it visually quiet so the section reads as a compact KPI register.
            # The empty cell is intentional for alignment.
            y += 0

    start_page()
    report_type = str(model.get("report_type") or "REPORT").upper()
    period = model.get("period") or {}
    start = str(period.get("start") or "—")
    end = str(period.get("end") or start)
    period_text = start if start == end else f"{start} to {end}"
    status = str(model.get("status") or "DRAFT")
    kpi = model.get("kpi") or {}
    counts = model.get("source_counts") or {}
    sections = model.get("section_data") or {}
    plan = model.get("sections") or []

    # Header
    txt("LITHOSITE MINE SERVICES", M, 8, True, 9, (0.14, 0.29, 0.47))
    y -= 3
    txt("Reports & KPI", M, 19, True, 22, (0.08, 0.18, 0.30))
    txt(f"{report_type} REPORT  |  {period_text}", M, 8.8, False, 11, (0.39, 0.47, 0.56))
    y -= 3
    line(y, (0.14, 0.29, 0.47), 1.5)
    y -= 9

    # Document control
    heading("Document Control")
    field_pair("Report Type", report_type, "Period", period_text)
    field_pair("Status", status, "Scope", str(model.get("scope") or "ALL"))
    field_pair("Report ID", str(model.get("report_id") or "—"), "Snapshot", str(model.get("snapshot_id") or "DRAFT"))
    field_pair("Records", str(model.get("total_records", model.get("total_source_records", 0))),
               "Data Status", str(model.get("report_data_status") or "REQUESTED_PERIOD"))
    y -= 4

    # Fleet KPI — one self-contained donut per KPI.
    # The label and percentage live inside the donut so the card has no redundant text.
    heading("Fleet KPI")
    card_gap = 6
    card_w = (usable - 3 * card_gap) / 4
    top = y + 4
    card_h = 58

    def circle_path(cx: float, cy: float, radius: float) -> None:
        """Append a four-segment cubic Bézier circle path."""
        k = 0.5522847498
        emit(
            f"{cx+radius:.2f} {cy:.2f} m "
            f"{cx+radius:.2f} {cy+k*radius:.2f} {cx+k*radius:.2f} {cy+radius:.2f} {cx:.2f} {cy+radius:.2f} c "
            f"{cx-k*radius:.2f} {cy+radius:.2f} {cx-radius:.2f} {cy+k*radius:.2f} {cx-radius:.2f} {cy:.2f} c "
            f"{cx-radius:.2f} {cy-k*radius:.2f} {cx-k*radius:.2f} {cy-radius:.2f} {cx:.2f} {cy-radius:.2f} c "
            f"{cx+k*radius:.2f} {cy-radius:.2f} {cx+radius:.2f} {cy-k*radius:.2f} {cx+radius:.2f} {cy:.2f} c"
        )

    def donut(cx: float, cy: float, radius: float, percent: object, label: str) -> None:
        import math
        try:
            pct = max(0.0, min(100.0, float(percent)))
        except (TypeError, ValueError):
            pct = 0.0

        # Track ring.
        emit("0.84 0.87 0.91 RG 5.2 w")
        circle_path(cx, cy, radius)
        emit("S")

        # Progress ring. Use a dense polyline so the arc is smooth in the
        # stdlib PDF renderer and remains visually stable at print scale.
        if pct > 0:
            emit("0.14 0.29 0.47 RG 5.2 w")
            steps = max(12, int(180 * pct / 100))
            start_angle = -math.pi / 2
            end_angle = start_angle + (2 * math.pi * pct / 100)
            x0 = cx + radius * math.cos(start_angle)
            y0 = cy + radius * math.sin(start_angle)
            emit(f"{x0:.2f} {y0:.2f} m")
            for i in range(1, steps + 1):
                a = start_angle + (end_angle - start_angle) * (i / steps)
                x1 = cx + radius * math.cos(a)
                y1 = cy + radius * math.sin(a)
                emit(f"{x1:.2f} {y1:.2f} l")
            emit("S")

        # White center clears the track and creates the donut.
        emit("0.975 0.98 0.99 rg")
        circle_path(cx, cy, radius - 6.0)
        emit("f")

        # The only text inside the donut: KPI name + percentage.
        at(label, cx - 8.5, cy + 2.0, 6.6, True, (0.39, 0.46, 0.55))
        at(f"{pct:.2f}%", cx - 15.5, cy - 9.0, 7.8, True, (0.10, 0.25, 0.43))

    cards = [
        ("PA", kpi.get("PA", "—")),
        ("UA", kpi.get("UA", "—")),
        ("EU", kpi.get("EU", "—")),
    ]
    for i, (label, value) in enumerate(cards):
        x = M + i * (card_w + card_gap)
        rect(x, top, card_w, card_h, fill=(0.975, 0.98, 0.99), stroke=(0.75, 0.81, 0.88))
        donut(x + card_w / 2, top - 29, 21, value, label)

    # Status remains a dedicated state card because it is not a percentage.
    x = M + 3 * (card_w + card_gap)
    rect(x, top, card_w, card_h, fill=(0.975, 0.98, 0.99), stroke=(0.75, 0.81, 0.88))
    at("KPI STATUS", x + 9, top - 16, 7.0, True, (0.39, 0.46, 0.55))
    status_value = str(kpi.get("status", "UNAVAILABLE")).upper()
    at(status_value, x + 9, top - 36, 12.5, True, (0.10, 0.25, 0.43))

    y = top - card_h - 7

    # Executive summary
    executive_name = "Management Executive Summary" if report_type == "MONTHLY" else "Executive Summary"
    executive = sections.get(executive_name) or sections.get("Executive Summary") or {}
    heading(executive_name)
    if isinstance(executive, dict):
        statement = executive.get("statement") or executive.get("headline") or executive
        paragraph(statement, 8.5, 10.5, 105)
        attention = executive.get("management_attention")
        if attention:
            compact_status_box("Management Attention", attention, 27)
    else:
        paragraph(executive, 8.5, 10.5, 105)

    # Operational source summary
    heading("Operational Source Summary")
    source_table(counts)
    y -= 3

    # Remaining sections. Render populated sections in detail and collapse
    # empty sections into one compact register. This keeps sparse Daily reports
    # genuinely one-page while preserving the complete section taxonomy.
    empty_sections = []

    def is_empty_section(value: object) -> bool:
        if value is None:
            return True
        if isinstance(value, str):
            return not value.strip() or value.strip().lower() == "no section-specific narrative is available."
        if isinstance(value, (list, tuple, set)):
            return len(value) == 0
        if isinstance(value, dict):
            if not value:
                return True
            return all(
                str(v).strip().lower() in {"", "no section-specific narrative is available."}
                for v in value.values()
            )
        return False

    for name in plan:
        if name == executive_name:
            continue
        value = sections.get(name)
        name_upper = str(name).upper()

        if is_empty_section(value):
            empty_sections.append(str(name))
            continue

        # Start a detailed section on the next page only when there is not
        # enough vertical room for a useful section body. This avoids orphan
        # headings while still allowing short sections to remain on page 1.
        if y < 145:
            start_page()

        heading(str(name))

        if name_upper == "PLANNED VS ACTUAL" and isinstance(value, dict):
            pairs = []
            for label, key in (("Planned Records", "planned_records"), ("Actual Records", "actual_records")):
                if key in value:
                    pairs.append((label, display_value(key, value[key])))
            if pairs:
                a_pair = pairs[0]
                b_pair = pairs[1] if len(pairs) > 1 else ("", "")
                field_pair(a_pair[0], a_pair[1], b_pair[0], b_pair[1], 22)
            remaining = {k: v for k, v in value.items()
                         if k not in {"planned_records", "actual_records"}}
            if remaining:
                paragraph(remaining, 7.9, 10.2, 104)
            y -= 2
            continue

        if name_upper == "EQUIPMENT PERFORMANCE" and isinstance(value, dict):
            record_count = value.get("record_count", value.get("Record Count"))
            if record_count is not None:
                field_pair("Record Count", display_value("record_count", record_count), "", "", 22)
            kpi_value = value.get("kpi") or value.get("Kpi")
            if isinstance(kpi_value, dict):
                pairs = []
                if "status" in kpi_value:
                    pairs.append(("Status", str(kpi_value["status"]).upper()))
                for key in ("PA", "UA", "EU"):
                    if key in kpi_value:
                        pairs.append((key, display_value(key, kpi_value[key])))
                for i in range(0, len(pairs), 2):
                    a_pair = pairs[i]
                    b_pair = pairs[i + 1] if i + 1 < len(pairs) else ("", "")
                    field_pair(a_pair[0], a_pair[1], b_pair[0], b_pair[1], 22)
            elif kpi_value:
                paragraph(kpi_value, 7.8, 10.2, 104)
            continue

        if name_upper == "KPI TREND" and isinstance(value, dict):
            if "comparison_available" in value:
                v = value["comparison_available"]
                compact_status_box("Comparison", "Available" if v else "Not available", 25)
            current_kpi = value.get("current") if isinstance(value.get("current"), dict) else value
            if isinstance(current_kpi, dict):
                pairs = []
                for key in ("PA", "UA", "EU", "status"):
                    if key in current_kpi:
                        pairs.append((key, display_value(key, current_kpi[key])))
                for i in range(0, len(pairs), 2):
                    a_pair = pairs[i]
                    b_pair = pairs[i + 1] if i + 1 < len(pairs) else ("", "")
                    field_pair(a_pair[0], a_pair[1], b_pair[0], b_pair[1], 22)
            continue

        if name_upper in {"TOP MANAGEMENT CONCERNS", "RECOMMENDED ACTIONS"} and isinstance(value, dict):
            v = value.get("status")
            if v is not None:
                compact_status_box("Status", str(v).upper(), 25)
            else:
                paragraph(value, 8.0, 10.2, 104)
            continue

        if name_upper == "KEY HIGHLIGHTS" and isinstance(value, dict):
            items = []
            for key in ("operations", "completed", "equipment", "workfront", "hse", "maintenance"):
                if key in value:
                    items.append((key.title(), display_value(key, value[key])))
            if items:
                for i in range(0, len(items), 2):
                    a_pair = items[i]
                    b_pair = items[i + 1] if i + 1 < len(items) else ("", "")
                    field_pair(a_pair[0], a_pair[1], b_pair[0], b_pair[1], 22)
            else:
                paragraph(value, 8.0, 10.2, 104)
            continue

        if isinstance(value, dict):
            paragraph(value, 8.0, 10.2, 104)
        else:
            paragraph(value, 8.0, 10.2, 104)
        y -= 2

    if empty_sections:
        if y < 105:
            start_page()
        heading("Additional Operational Sections")
        col = usable / 2
        row_h = 17
        for idx in range(0, len(empty_sections), 2):
            ensure(row_h + 3)
            top = y + 4
            for j in range(2):
                if idx + j >= len(empty_sections):
                    continue
                x = M + j * col
                rect(x, top, col, row_h, fill=(0.985, 0.988, 0.992), stroke=(0.86, 0.89, 0.92))
                at(empty_sections[idx + j].upper(), x + 7, top - 7, 6.2, True, (0.39, 0.46, 0.55))
                at("No activity / narrative reported", x + 7, top - 14, 7.2, False, (0.32, 0.39, 0.47))
            y = top - row_h - 3

    # Reserve enough room for the footer. If the current page is genuinely full,
    # create a new page rather than pushing a footer onto an otherwise blank page.
    if y < 72:
        start_page()
    line(y + 4, (0.78, 0.82, 0.87), 0.7)
    at(f"Lithosite Mine Services · V38 · {report_type} Report", M, y - 8, 7, False, (0.42, 0.48, 0.55))
    at("Immutable report snapshot", W - M - 112, y - 8, 7, False, (0.42, 0.48, 0.55))

    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [] /Count 0 >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ]
    page_ids = []
    content_ids = []
    next_id = 5
    for _ in pages:
        page_ids.append(next_id)
        content_ids.append(next_id + 1)
        next_id += 2
    kids = " ".join(f"{n} 0 R" for n in page_ids)
    objects[1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode()

    for idx, commands in enumerate(pages):
        stream = "\n".join(commands).encode("latin-1", "replace")
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] "
            f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
            f"/Contents {content_ids[idx]} 0 R >>".encode()
        )
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")

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
    pdf.extend(
        f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n".encode()
    )
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
                self._json(200, {
                    "status": "READY",
                    "filename": "lithosite-report.pdf",
                    "mime": "application/pdf",
                    "data": base64.b64encode(payload).decode("ascii"),
                }, origin)
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

