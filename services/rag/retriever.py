"""Sharded hybrid GraphRAG with a citation-or-abstain guardrail."""
import asyncio
from qdrant_client import AsyncQdrantClient

SHARDS = ["http://qdrant-edge-1:6333", "http://qdrant-edge-2:6333", "http://qdrant-global:6333"]

async def _search(url, vec, k):
    try: return await AsyncQdrantClient(url=url, timeout=3).search("threat_intel", query_vector=vec, limit=k, with_payload=True)
    except Exception: return []  # a dead shard degrades results, never blocks

async def retrieve(vec, k=8):
    parts = await asyncio.gather(*[_search(u, vec, k) for u in SHARDS])
    return sorted((h for p in parts for h in p), key=lambda h: -h.score)[:k]

def expand_graph(hits, graph):
    """GraphRAG: CVE -> CWE -> ATT&CK neighbours for multi-hop context."""
    ids = {h.payload["id"] for h in hits}
    for i in list(ids): ids |= set(graph.get(i, []))
    return ids

def grounded(claims, hits, min_score=0.55):
    ok = all(any(c["src"] == h.payload["id"] and h.score >= min_score for h in hits) for c in claims)
    return claims if ok else [{"text": "Insufficient evidence; escalating to analyst.", "src": None}]
