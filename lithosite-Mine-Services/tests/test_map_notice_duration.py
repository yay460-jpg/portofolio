from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


MODULES = {
    "Equipment": ROOT / "ui" / "modules" / "equipment" / "equipment.js",
    "Work Front": ROOT / "ui" / "modules" / "workfront" / "workfront.js",
    "HSE": ROOT / "ui" / "modules" / "hse" / "hse.js",
}


def test_show_on_map_notices_auto_dismiss_after_five_seconds():
    for module, path in MODULES.items():
        source = path.read_text(encoding="utf-8")
        assert "_mapNoticeTimer" in source, f"{module} notice should reset its timer"
        assert "},5000);" in source or "}, 5000);" in source, (
            f"{module} notice should auto-dismiss after five seconds"
        )
        assert "el.textContent='';" in source or "el.textContent = '';" in source, (
            f"{module} notice should clear its text after timeout"
        )
