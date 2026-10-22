from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
STATUS = ROOT / "ui" / "shared" / "runtime-status.js"
CLIENT = ROOT / "ui" / "shared" / "runtime-client.js"


def read(path):
    return path.read_text(encoding="utf-8")


def test_offline_status_dot_pulses_smoothly_every_fifteen_seconds():
    html = read(ARTIFACT)
    status = read(STATUS)

    assert 'class="ok offline-pulse" id="runtimeStatusDot"' in html
    offline_pulse = html.split("@keyframes runtime-offline-pulse{", 1)[1].split("}", 1)[0]
    assert "@keyframes runtime-offline-pulse" in html
    assert "animation:runtime-offline-pulse 15s ease-in-out infinite" in html
    assert "box-shadow" not in offline_pulse
    assert "text-shadow:0 0 4px rgba(74,222,128,.75)" in offline_pulse
    assert "statusDot.classList.toggle('offline-pulse',offline)" in status
    assert "statusDot.classList.add('offline-pulse')" in status
    assert "runtime-status.js?v=20261022-runtime-indicator-pulse-1" in html


def test_database_ready_dot_pulses_once_only_after_a_committed_mutation():
    html = read(ARTIFACT)
    status = read(STATUS)
    client = read(CLIENT)

    assert "@keyframes runtime-recorded-pulse" in html
    assert "animation:runtime-recorded-pulse .72s ease-in-out 1" in html
    assert "global.addEventListener('lithosite:runtime-mutated',pulseReadyDot)" in status
    assert "readyDot.classList.remove('recorded-pulse')" in status
    assert "readyDot.classList.add('recorded-pulse')" in status
    assert "const committed = result.status === 'COMMITTED';" in client
    assert "if (mutating && committed)" in client
    assert "window.dispatchEvent(new CustomEvent('lithosite:runtime-mutated'" in client


def test_status_indicator_animations_respect_reduced_motion_preference():
    html = read(ARTIFACT)

    assert "@media(prefers-reduced-motion:reduce)" in html
    assert "#runtimeStatusDot.offline-pulse,#runtimeReadyDot.recorded-pulse{animation:none}" in html
