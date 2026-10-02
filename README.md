# UNSEEN-Q v1.0 — Quantum-Safe Autonomous Cognitive Security Fabric

Self-healing, post-quantum, agentic zero-trust security fabric.

## What's new vs v3.0
| Area | v3.0 | v1.0 |
|---|---|---|
| Workload identity | Vault PKI | **SPIFFE/SPIRE** SVIDs + Vault/OpenBao for secrets |
| Agent tooling | custom | **MCP** tool servers + **A2A** agent messaging, policy-gated |
| Policy | in-code | **OPA/Rego** policy-as-code, decision logs to JetStream |
| Kernel telemetry | pcap sniffer | **eBPF** (Cilium/Tetragon) flow + syscall events |
| TLS | PQC wrappers | **Hybrid X25519MLKEM768** + ML-DSA-65, CBOM-driven rotation |
| RAG | sharded vectors | **GraphRAG** + hybrid dense/sparse + citation-or-abstain guardrail |
| Detection | CNN | **Temporal CNN + Transformer** flow model, ONNX at edge, drift monitor |
| Reasoning safety | none | Prompt-injection firewall, semantic-privilege checks, human-approval tier |
| Observability | basic | **OpenTelemetry** traces/metrics/logs → Grafana LGTM |
| Supply chain | none | **Sigstore** signing, SBOM + CBOM, SLSA provenance |
| Resilience | circuit breakers | **Chaos drills** (partition, node kill) + digital-twin replay |

## Layout
- `services/consensus` (Go): etcd-backed leader election, heartbeats, split-brain fencing tokens
- `services/pqc` (Rust): hybrid KEM, ML-DSA signing, CBOM generation, rollback
- `services/agents` (Python): token-isolation gateway, OPA check, behavioral identity monitor
- `services/rag` (Python): sharded Qdrant + graph expansion + grounded answers
- `services/cnn` (Python/PyTorch): flow classifier + ONNX export
- `policy/agent.rego`, `deploy/docker-compose.yml`, `docs/index.html` (GitHub Pages simulator)

## Run
```
docker compose -f deploy/docker-compose.yml up -d
```
Enable Pages on `/docs` to publish the simulator.

## Production notes
Skeletons are reference scaffolds: PQC calls use `oqs`/`aws-lc-rs` bindings, which must be pinned to FIPS-validated builds before real deployment.

---
Designed and Developed by NIKHIL CHARY SRIRAMOJU. Publishing steps are in DEPLOY.md.

## Full contents
Dockerfiles for every service, FastAPI health/authorize endpoints, eBPF (Tetragon) telemetry, Kubernetes manifests with default-deny network policy, CI with SBOM + Sigstore signing, pytest suite, chaos drill (`chaos/drill.sh`), architecture diagram (`docs/ARCHITECTURE.md`), SECURITY.md, MIT license.

## v1.1 additions
- **Chatbot** (`docs/chat.js`): Groq-powered assistant inside the 3D page. It reads the live simulator state. Each visitor pastes their own free Groq key (stored only in their browser), or you deploy `worker/groq-proxy.js` and set `PROXY`. Never commit an API key.
- **Rust packet sniffer** (`services/sniffer`): passive flow builder with beacon detection, JSON output. Run: `sudo cargo run --release -- eth0`. Only monitor networks you own or are authorised to test.
- **Helm chart** (`deploy/helm/unseen-q`): `helm lint deploy/helm/unseen-q` then `helm install unseen deploy/helm/unseen-q`.
