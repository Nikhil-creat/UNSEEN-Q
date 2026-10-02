(() => {
const PROXY = ''; // optional: your Cloudflare Worker URL (see worker/groq-proxy.js). Empty = each visitor uses their own key.
const PREFER = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'llama-3.3-70b-versatile']; // first one your key can use wins
let model = null;
async function pickModel(key) {
  if (model) return model;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { authorization: 'Bearer ' + key } });
    const ids = (await r.json()).data.map(m => m.id);
    model = PREFER.find(p => ids.includes(p)) || ids.find(i => !/whisper|guard|tts|orpheus|safeguard|compound|prompt/.test(i));
  } catch {}
  return model || PREFER[0];
}
const API = PROXY || 'https://api.groq.com/openai/v1/chat/completions';
const KEY = 'unseen_groq_key';
const SYS = `You are the assistant inside UNSEEN-Q, a portfolio project by Nikhil Chary Sriramoju: a quantum-safe autonomous cognitive security fabric. Components: Go etcd Raft leader election with fencing terms; Rust hybrid X25519+ML-KEM-768 crypto and CycloneDX CBOM with rotate/rollback; Rust packet sniffer that builds flow features and flags beaconing; Python agent gateway (OPA policy, MCP tool personas, single-tool short-lived tokens, behavioral drift detection, human approval for high-risk actions); sharded Qdrant GraphRAG with citation-or-abstain; CNN+Transformer flow classifier with energy-based zero-day detection; NATS JetStream; OpenTelemetry; Docker, Kubernetes, Helm; Sigstore-signed SBOM in CI. The web page is a simulator, not a live backend. Be concise (under 120 words). Do not invent features. The builder is Nikhil Chary Sriramoju, a final-year CSE student (GitHub: github.com/Nikhil-creat). If asked about the builder, say this and nothing invented beyond it. If you do not know something, say so plainly. Never ask for or reveal API keys.`;
const st = document.createElement('style');
st.textContent = `#cb-b{position:fixed;right:16px;bottom:16px;z-index:9;background:#3de0ff;color:#04101c;border:0;border-radius:24px;padding:12px 16px;font-weight:600;cursor:pointer;margin:0}
#cb{position:fixed;right:12px;bottom:12px;z-index:10;width:min(380px,calc(100vw - 24px));height:min(520px,75vh);background:#0d1424;border:1px solid #1e2b45;border-radius:12px;display:none;flex-direction:column;color:#dce8ff}
#cb.o{display:flex}#cb .h{padding:10px 12px;border-bottom:1px solid #1e2b45;display:flex;justify-content:space-between;align-items:center;color:#3de0ff;font-weight:600}
#cm{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px;font-size:14px}
.m{padding:8px 10px;border-radius:8px;max-width:88%;white-space:pre-wrap;overflow-wrap:anywhere}.mu{align-self:flex-end;background:#14305a}.ma{background:#162036}
#cf,#ck{display:flex;gap:6px;padding:8px;border-top:1px solid #1e2b45}#cf input,#ck input{flex:1;min-width:0;background:#050912;color:#dce8ff;border:1px solid #1e2b45;border-radius:7px;padding:8px;font:inherit}
#cb button:not(#cb-b){background:#14305a;color:#dce8ff;border:1px solid #2a5aa0;border-radius:7px;padding:8px 10px;cursor:pointer;margin:0}`;
document.head.appendChild(st);
const root = document.createElement('div');
root.innerHTML = `<button id="cb-b">Ask UNSEEN-Q AI</button><section id="cb" aria-label="AI assistant"><div class="h"><span>UNSEEN-Q AI (Groq)</span><span><button id="cr" title="Remove saved key">Reset key</button> <button id="cx" aria-label="Close">X</button></span></div><div id="cm" role="log" aria-live="polite"></div><div id="ck"><input id="ki" type="password" autocomplete="off" placeholder="Paste your free Groq key (gsk_...)"><button id="ks">Save</button></div><form id="cf"><input id="ci" autocomplete="off" placeholder="Ask about the architecture or the simulator"><button>Send</button></form></section>`;
document.body.appendChild(root);
const $ = s => document.querySelector(s), box = $('#cb'), msgs = $('#cm');
const add = (t, c) => { const d = document.createElement('div'); d.className = 'm ' + c; d.textContent = t; msgs.appendChild(d); msgs.scrollTop = 1e9; return d };
const getKey = () => { try { return localStorage.getItem(KEY) || '' } catch { return '' } };
function sync() { $('#ck').style.display = (PROXY || getKey()) ? 'none' : 'flex'; $('#cr').style.display = (PROXY || !getKey()) ? 'none' : '' }
$('#cb-b').onclick = () => { box.classList.add('o'); $('#cb-b').style.display = 'none'; if (!msgs.children.length) add('Hi! I am the UNSEEN-Q assistant. Ask me how the fabric works, or about what you see in the simulator.', 'ma'); sync() };
$('#cx').onclick = () => { box.classList.remove('o'); $('#cb-b').style.display = '' };
$('#ks').onclick = () => { const v = $('#ki').value.trim(); if (!v.startsWith('gsk_')) { add('That does not look like a Groq key (starts with gsk_).', 'ma'); return } try { localStorage.setItem(KEY, v) } catch {} $('#ki').value = ''; sync(); add('Key saved in this browser only.', 'ma') };
$('#cr').onclick = () => { try { localStorage.removeItem(KEY) } catch {} sync(); add('Key removed.', 'ma') };
const t = s => (document.querySelector(s) || {}).textContent || '?';
let hist = [];
$('#cf').onsubmit = async e => {
  e.preventDefault(); const q = $('#ci').value.trim(); if (!q) return; const key = getKey();
  if (!PROXY && !key) { add('Save a Groq key first (free at console.groq.com).', 'ma'); return }
  $('#ci').value = ''; add(q, 'mu'); hist.push({ role: 'user', content: q }); hist = hist.slice(-8);
  const out = add('...', 'ma');
  const state = `Live simulator state: leader ${t('#sL')}, term ${t('#sT')}, suite ${t('#sS')}, quarantined ${t('#sQ')}, healthy ${t('#sH')}, blocked ${t('#sB')}.`;
  try {
    const m = PROXY ? PREFER[0] : await pickModel(key);
    const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', ...(PROXY ? {} : { authorization: 'Bearer ' + key }) },
      body: JSON.stringify({ model: m, temperature: .3, max_tokens: 1000, ...(m.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}), messages: [{ role: 'system', content: SYS + ' ' + state }, ...hist] }) });
    if (r.status === 401) throw new Error('Key rejected. Use Reset key and paste a valid one.');
    if (r.status === 429) throw new Error('Free-tier rate limit hit. Wait a minute and retry.');
    if (!r.ok) throw new Error('Groq error ' + r.status + '. Check the model list at console.groq.com/docs/models.');
    const a = (await r.json()).choices[0].message.content || 'No answer, try again.'; out.textContent = a.replace(/\*\*/g, ''); hist.push({ role: 'assistant', content: a });
  } catch (err) { out.textContent = err.message || 'Network error.'; hist.pop() }
};
})();
