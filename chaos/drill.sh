#!/usr/bin/env bash
# Chaos drill: kill a consensus replica, pause a vector shard, confirm the fabric stays healthy.
set -euo pipefail
C="docker compose -f deploy/docker-compose.yml"
echo "[1] killing one consensus replica"; $C kill consensus || true; sleep 8
echo "[2] pausing qdrant (shard partition)"; $C pause qdrant; sleep 5
echo "[3] RAG must still answer or abstain, never hang"
$C exec -T rag python -c "import urllib.request as u;print(u.urlopen('http://localhost:8000/health',timeout=3).read())"
echo "[4] healing"; $C unpause qdrant; $C up -d consensus
echo "drill complete"
