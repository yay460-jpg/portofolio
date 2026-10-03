from pathlib import Path
import sys

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "src"))

from mine_services.kpi_snapshot_store import KPIHistoryStore


def snapshot(pa, ua, event_version):
    return {
        "snapshot_version": "V34-KPI-SNAPSHOT-1",
        "scope_type": "FLEET",
        "scope_id": "FLEET:ALL",
        "period_id": "2026-10-04",
        "status": "FINAL_CANDIDATE",
        "calculation_version": "V34-KPI-FOUNDATION-E2E-0.1",
        "policy": {"id": "V34-PA-UA-BASELINE", "version": "1.0"},
        "time_baseline": {"id": "TB-PROJECT-DAY-0600-1800", "version": "1.0"},
        "result": {
            "PA": {"kpi": "PA", "status": "READY", "value": pa},
            "UA": {"kpi": "UA", "status": "READY", "value": ua},
            "EU": {"kpi": "EU", "status": "PENDING_DEFINITION", "value": None},
        },
        "event_versions": [
            {
                "event_id": "OPS:1:S1",
                "source_entity": "Operations",
                "source_id": "OPS-1",
                "version": event_version,
                "validation_status": "VALID",
            }
        ],
        "population": {"total": 1, "eligible": 1, "excluded": 0},
        "contributing_hours": {
            "scheduledHours": 11,
            "availableHours": 9,
            "usedHours": 7,
        },
        "exclusions": [],
    }


def test_snapshot_is_append_only_and_revisions_are_sequential(tmp_path):
    store = KPIHistoryStore(tmp_path / "KPI-History.json")

    first = store.finalize(snapshot(81.81818, 77.77777, "VAAA"), source="test")
    assert first["status"] == "COMMITTED"
    assert first["revision"] == 1

    identical = store.finalize(snapshot(81.81818, 77.77777, "VAAA"), source="test")
    assert identical["status"] == "EXISTING"
    assert identical["revision"] == 1

    revised = store.finalize(snapshot(90.0, 80.0, "VBBB"), source="test")
    assert revised["status"] == "COMMITTED"
    assert revised["revision"] == 2

    history = store.list("FLEET:ALL", "2026-10-04")
    assert [row["revision"] for row in history] == [1, 2]
    assert history[0]["result"]["PA"]["value"] == 81.81818
    assert history[0]["status"] == "FINAL"
    assert history[1]["supersedes_snapshot_id"] == history[0]["snapshot_id"]


def test_snapshot_refuses_non_ready_kpi(tmp_path):
    store = KPIHistoryStore(tmp_path / "KPI-History.json")
    item = snapshot(81.8, 77.7, "VAAA")
    item["result"]["UA"]["status"] = "NEEDS_VALIDATION"

    result = store.finalize(item)
    assert result["status"] == "REJECTED"
    assert result["reason"] == "KPI_NOT_READY"


def test_snapshot_survives_reload(tmp_path):
    path = tmp_path / "KPI-History.json"
    store = KPIHistoryStore(path)
    store.finalize(snapshot(81.8, 77.7, "VAAA"))

    reloaded = KPIHistoryStore(path)
    assert len(reloaded.list("FLEET:ALL", "2026-10-04")) == 1
