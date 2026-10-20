from pathlib import Path
import os
from PyInstaller.utils.hooks import collect_submodules

MODULE_ROOT = Path(SPECPATH).resolve().parent
REPO_ROOT = MODULE_ROOT.parent
DATA_ROOTS = ["assets", "lithosite-Mine-Geologist/assets", "lithosite-Mine-Services/Artifacts", "lithosite-Mine-Services/ui", "lithosite-Mine-Services/shared", "lithosite-Mine-Services/src", "lithosite-Mine-Services/desktop-host", "Engine_Share/Security_Guard/Host_Guard"]
datas = []
for relative in DATA_ROOTS:
    source = REPO_ROOT / relative
    if source.exists():
        for folder, dirs, names in os.walk(source):
            dirs[:] = [name for name in dirs if name not in {".git", "__pycache__", "node_modules"}]
            for name in names:
                file_path = Path(folder) / name
                if file_path.suffix.lower() in {".pyc", ".pyo", ".xlsx", ".xls", ".csv"}:
                    continue
                datas.append((str(file_path), file_path.parent.relative_to(REPO_ROOT).as_posix()))
hiddenimports = collect_submodules("webview") + collect_submodules("openpyxl") + ["security_guard", "mine_services"]
a = Analysis([str(MODULE_ROOT / "desktop-host" / "desktop_app.py")], pathex=[str(MODULE_ROOT / "src"), str(REPO_ROOT / "Engine_Share" / "Security_Guard" / "Host_Guard")], binaries=[], datas=datas, hiddenimports=hiddenimports, hookspath=[], hooksconfig={}, runtime_hooks=[], excludes=["pytest", "tkinter"], noarchive=False)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="LithositeMineServices", debug=False, bootloader_ignore_signals=False, strip=False, upx=False, console=False, icon=str(REPO_ROOT / "lithosite-Mine-Geologist" / "assets" / "favicon.ico"))
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name="LithositeMineServices")
