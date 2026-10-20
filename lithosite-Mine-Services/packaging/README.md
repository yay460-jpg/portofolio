# Windows standalone packaging

This packaging layer targets a native Windows window backed by Microsoft Edge WebView2. It does not open a normal browser window and does not bundle the developer's operational workbook.

## Builder prerequisites

- Windows x64
- Python 3.10+ in an isolated build environment
- Inno Setup 6
- The official Microsoft WebView2 Evergreen Standalone Installer x64 at `redist/MicrosoftEdgeWebView2RuntimeInstallerX64.exe`

The WebView2 redistributable is not checked into this repository. Obtain it from Microsoft's official distribution and verify its publisher. Without that file, an offline installer cannot be built; the installer script intentionally requires it rather than silently relying on internet access.

## Build

From `lithosite-Mine-Services` in PowerShell:

```powershell
python -m venv .venv-packaging
.\.venv-packaging\Scripts\python.exe -m pip install -r packaging\requirements-build.txt
.\.venv-packaging\Scripts\pyinstaller.exe --clean --noconfirm packaging\mine-services.spec
& "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe" packaging\LithositeMineServices.iss
```

PyInstaller output is under `dist/LithositeMineServices`; the installer is under `dist-installer`.

## User data and upgrades

Operational files are stored under `%LOCALAPPDATA%\Lithosite\Mine Services\`. First run creates an empty A.3 workbook at `Database\Mine-Services-Database-A3.xlsx` under that location. The bootstrap factory must never replace an existing file. NIK profiles, Evidence, datasets, topography, marker backups, KPI history, and other operational files must remain in this data directory across upgrades. Uninstall intentionally does not remove it.

The built-in Backup/Restore snapshot covers runtime snapshot/audit data; it is not a complete file-system backup of auxiliary folders. Back up the entire user data directory separately before major maintenance.

## Verification required before distribution

These are initial packaging scaffolds, not a release-certified installer. Validate on a clean Windows VM with networking disabled: first launch, WebView2 installation, map rendering, Evidence upload and preview, PDF display, file downloads, Backup/Restore, upgrade preservation, and uninstall preservation. Verify all required static assets are present in the packaged bundle.
