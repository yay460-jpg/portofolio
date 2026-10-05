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
