"""Native Windows desktop shell for Mine Services."""
from __future__ import annotations
import importlib.util, os, sys, threading, time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

def _runtime_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS).resolve()
    return Path(__file__).resolve().parents[2]

def _load_host(root: Path):
    host_file = root / "lithosite-Mine-Services" / "desktop-host" / "server.py"
    if not host_file.is_file():
        host_file = Path(__file__).resolve().with_name("server.py")
    spec = importlib.util.spec_from_file_location("mine_services_desktop_host", host_file)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load local runtime host: {host_file}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module

def _user_data_root() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if not local_app_data:
        raise RuntimeError("Windows LOCALAPPDATA is unavailable; user data cannot be located safely.")
    return Path(local_app_data) / "Lithosite" / "Mine Services"

def main() -> int:
    if os.name != "nt":
        raise RuntimeError("The standalone desktop shell is intended for Windows.")
    root = _runtime_root()
    data_root = _user_data_root()
    data_root.mkdir(parents=True, exist_ok=True)
    # Keep operational files outside the install directory.
    os.environ["MINE_SERVICES_DB"] = str(data_root / "Database" / "Mine-Services-Database-A3.xlsx")
    os.environ["MINE_SERVICES_PORT"] = os.environ.get("MINE_SERVICES_PORT", "8765")
    os.environ["MINE_SERVICES_DESKTOP"] = "1"
    host = _load_host(root)
    from mine_services.database_factory import ensure_a3_database
    ensure_a3_database(os.environ["MINE_SERVICES_DB"])
    httpd = host.ThreadingHTTPServer((host.HOST, host.PORT), host.Handler)
    threading.Thread(target=httpd.serve_forever, name="MineServicesLocalHost", daemon=True).start()
    url = f"http://{host.HOST}:{host.PORT}/"
    try:
        for _ in range(100):
            try:
                with urlopen(url + "health", timeout=0.5) as response:
                    if response.status == 200:
                        break
            except (OSError, URLError):
                time.sleep(0.1)
        else:
            raise RuntimeError("Mine Services local host did not become ready.")
        import webview
        webview.create_window("Lithosite Mine Services", url, width=1440, height=900, min_size=(1024, 680), text_select=True, icon=str(root / "lithosite-Mine-Geologist" / "assets" / "favicon.ico"))
        webview.start(gui="edgechromium", debug=False)
    finally:
        httpd.shutdown()
        httpd.server_close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
