"""Agentic Zero Trust gateway: token isolation + policy gate + behavioral identity."""
import time, uuid, statistics, httpx, jwt  # PyJWT

OPA = "http://opa:8181/v1/data/unseen/agent/allow"
PERSONAS = {  # job-description-driven tool selection (MCP tool names)
    "threat_hunter": {"mcp:flows.query", "mcp:rag.search"},
    "log_triage": {"mcp:logs.read", "mcp:rag.search"},
    "crypto_auditor": {"mcp:cbom.read"},
    "remediation": {"mcp:firewall.patch", "mcp:node.isolate"},
}
HIGH_RISK = {"mcp:firewall.patch", "mcp:node.isolate"}

class Gateway:
    def __init__(self, signer_key: str): self.key, self.calls = signer_key, {}

    def exchange(self, agent: str, task_id: str, tool: str, ttl=60) -> str:
        """RFC 8693-style exchange: one short-lived token per (agent, task, tool)."""
        if tool not in PERSONAS.get(agent, ()): raise PermissionError("tool outside persona")
        now = int(time.time())
        return jwt.encode({"sub": agent, "act": task_id, "aud": tool, "iat": now,
                           "exp": now + ttl, "jti": str(uuid.uuid4())}, self.key, algorithm="EdDSA")

    def authorize(self, agent, tool, args, intent, approved_by=None):
        d = httpx.post(OPA, json={"input": {"agent": agent, "tool": tool, "args": args, "intent": intent}}, timeout=2).json()
        if not d.get("result"): raise PermissionError("policy deny")
        if tool in HIGH_RISK and not approved_by: raise PermissionError("human approval required")
        if self._drift(agent): raise PermissionError("behavioral drift: agent quarantined")
        return self.exchange(agent, str(uuid.uuid4()), tool)

    def _drift(self, agent, window=50, z=3.0) -> bool:
        h = self.calls.setdefault(agent, []); h.append(time.time()); h[:] = h[-window:]
        gaps = [b - a for a, b in zip(h, h[1:])]
        if len(gaps) < 10: return False
        m, s = statistics.mean(gaps[:-1]), (statistics.pstdev(gaps[:-1]) or 1e-6)
        return abs(gaps[-1] - m) / s > z  # call-rate spike => possible hijack
