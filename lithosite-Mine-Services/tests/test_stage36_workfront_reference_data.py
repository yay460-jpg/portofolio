from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

def test_stage36_reference_vocab_includes_mining_and_cycle():
    persistence = read("src/mine_services/persistence.py")
    assert '"Mining"' in persistence
    assert '"cycle"' in persistence

def test_stage36_workfront_uses_controlled_domain_vocab():
    workfront = read("ui/modules/workfront/workfront.js")
    assert "operation:'READ',entity:'_Lists'" in workfront
    assert "LISTS.domain" in workfront
    assert "f_wf_domain" in workfront

def test_stage36_location_remains_free_text_reference():
    workfront = read("ui/modules/workfront/workfront.js")
    assert "f_wf_location" in workfront
    assert "row.location" in workfront

def test_stage36_persisted_lists_expose_new_reference_values():
    from openpyxl import load_workbook

    db = ROOT / "Database" / "Mine-Services-Database-A3.xlsx"
    wb = load_workbook(db, read_only=True, data_only=True)
    rows = list(wb["_Lists"].values)
    headers = list(rows[0])
    values = {
        header: {
            row[index]
            for row in rows[1:]
            if index < len(row) and row[index] not in (None, "")
        }
        for index, header in enumerate(headers)
        if header not in (None, "")
    }

    assert "Mining" in values["service_domain"]
    assert "cycle" in values["measurement"]
