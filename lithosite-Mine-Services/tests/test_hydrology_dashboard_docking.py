"""Contract checks for the temporary Rainfall workspace on the operations dashboard."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "Artifacts" / "Mine-Services-Operations.html"
PANEL = ROOT / "shared" / "hydrology" / "hydrology-panel.js"
STYLES = ROOT / "shared" / "hydrology" / "hydrology.css"
README = ROOT / "shared" / "hydrology" / "README.md"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rainfall_uses_the_dashboard_right_workspace_and_keeps_flow_on_site_map():
    artifact = read(ARTIFACT)
    panel = read(PANEL)

    # Both existing operational cards and the map toolbar remain in the canonical artifact.
    assert 'id="dashboardEquipmentDonut"' in artifact
    assert 'id="dashboardMaterialBars"' in artifact
    assert 'id="dashboardSiteMap"' in artifact
    assert 'id="dashboardHydrologyRainfallToggle"' not in artifact  # mounted once by the module at runtime

    assert "mountSimulationPanel(right,mapHost,button,closeRainfall)" in panel
    assert "panelHost.appendChild(panel)" in panel
    assert "create({host:mapHost,topo:global.MineServicesTopo3D})" in panel
    assert "main.classList.add('is-rainfall-mode')" in panel
    assert "main.classList.remove('is-rainfall-mode')" in panel
    assert "card.inert=!!unavailable" in panel
    assert "event.key==='Escape'" in panel
    assert "simulationPanel.hidden=true" in panel
    assert "button.setAttribute('aria-expanded','true')" in panel
    assert "button.setAttribute('aria-expanded','false')" in panel
    assert 'id="hydrologyGuide"' in panel
    assert "Guide_Panel_Rainfall_Simulation.pdf" in panel
    assert "getElementById('reportPdfReaderModal')" in panel
    assert "getElementById('reportPdfReaderFrame')" in panel
    assert "guideModal.classList.add('show')" in panel
    assert "global.fetch(guideUrl,{credentials:'same-origin'})" in panel
    assert "URL.createObjectURL(pdfBlob)" in panel
    assert "guideFrame.dataset.reportPdfObjectUrl=objectUrl" in panel
    assert "Guide_Panel_Rainfall_Simulation.pdf" in panel
    assert 'id="hydrologyClear"' in panel
    assert "clearButton.addEventListener('click',clearSimulation)" in panel
    assert "Topography and saved A3 records are unchanged." in panel
    assert ".user-guide-reader-modal" in read(ROOT / "ui" / "shared" / "user-guide.css")


def test_rainfall_dock_has_reduced_motion_and_restores_dashboard_cards():
    styles = read(STYLES)
    panel = read(PANEL)
    readme = read(README)

    assert ".hydrology-panel--docked" in styles
    assert "#dashboardScreen .main.is-rainfall-mode>.right>.panel" in styles
    assert "transition:opacity .18s ease,transform .18s ease" in styles
    assert "@media(prefers-reduced-motion:reduce)" in styles
    assert "setDashboardCardsUnavailable(false)" in panel
    assert "matchMedia('(prefers-reduced-motion: reduce)')" in panel
    assert "right-hand workspace" in readme


def test_artifact_cache_keys_reference_the_docked_rainfall_assets():
    artifact = read(ARTIFACT)
    assert "../shared/hydrology/hydrology.css?v=20261018-rain-wind-controls" in artifact
    assert "../shared/hydrology/hydrology-panel.js?v=20261018-rain-wind-controls" in artifact
