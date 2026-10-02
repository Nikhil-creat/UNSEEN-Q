import sys, types, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "services/agents"))
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "services/rag"))
from gateway import Gateway
from retriever import grounded

def test_persona_blocks_foreign_tool():
    g = Gateway("k")
    try: g.exchange("log_triage", "t1", "mcp:node.isolate"); assert False
    except PermissionError: pass

def test_grounded_abstains_without_evidence():
    out = grounded([{"text": "x", "src": "CVE-1"}], hits=[])
    assert out[0]["src"] is None

def test_grounded_accepts_supported_claim():
    h = types.SimpleNamespace(score=0.9, payload={"id": "CVE-1"})
    assert grounded([{"text": "x", "src": "CVE-1"}], [h])[0]["src"] == "CVE-1"
