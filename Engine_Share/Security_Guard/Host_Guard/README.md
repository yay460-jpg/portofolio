# Host Guard — Evo 2

## Scope

Penjagaan otoritatif pada batas HTTP/proses: pemeriksaan request, Origin, parsing JSON, ukuran body, path/file, error response, dan akses terhadap operasi runtime.

## Pemilik existing

Mine Services saat ini memakai `lithosite-Mine-Services/desktop-host/server.py`, yang bind ke `127.0.0.1`, memiliki aturan Origin, endpoint Evidence, static-file guard, batas ukuran di beberapa endpoint, dan meneruskan operasi runtime ke `RuntimeAdapter`.

Kontrol tersebut harus diuji sebelum dirapikan. Jangan menganggap setiap dugaan sebagai kerentanan sampai ada reproduksi tes.

## Batas otoritas

- Request mutasi harus melalui RuntimeAdapter dan layanan domain terkait.
- Host tidak boleh membuka jalur langsung ke repository/persistence untuk UI.
- Origin check tidak sama dengan autentikasi caller lokal.
- Port loopback tidak boleh diasumsikan melindungi dari semua proses lokal atau seluruh skenario browser-to-loopback.
- Perubahan limit atau aturan Origin harus mempertimbangkan launcher, Live Server development, dan runtime resmi.

## Status

Evo 2 Host Guard control #1 implemented in `security_guard.py` and imported by `desktop-host/server.py`: accepts the configured host origin and the documented development origins on ports 5500/5501; rejects literal `null` and unlisted ports/origins; a missing Origin header remains supported for local non-browser clients. Unit tests and endpoint regression tests cover the policy.

This is a CORS/browser-origin boundary, **not authentication** for other processes running as the same local user. The change does not modify endpoint payload contracts, RuntimeAdapter routing, database behavior, or Evidence lifecycle. Remaining host/file risks are still under audit.

Static-file access is now restricted to the approved Desktop UI asset roots (`assets/`, `lithosite-Mine-Geologist/assets/`, and `lithosite-Mine-Services/Artifacts/`, `ui/`, `shared/`). Hidden segments, repository metadata, backend source, docs and tests are not served through the generic static fallback. Positive/negative endpoint regression tests passed Full Pytest #611: https://github.com/yay460-jpg/portofolio/actions/runs/38418373578. This guard must be revisited if the UI later adds assets outside the listed roots.
