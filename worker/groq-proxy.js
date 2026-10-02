// Optional Cloudflare Worker: keeps your Groq key secret. Set secret GROQ_API_KEY in the Worker, then put the Worker URL in docs/chat.js (PROXY).
export default {
  async fetch(req, env) {
    const o = req.headers.get('Origin') || '', ok = o === 'https://nikhil-creat.github.io';
    const cors = { 'Access-Control-Allow-Origin': ok ? o : 'null', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!ok || req.method !== 'POST') return new Response('forbidden', { status: 403, headers: cors });
    const body = await req.json(); body.max_tokens = Math.min(body.max_tokens || 400, 1000);
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.GROQ_API_KEY }, body: JSON.stringify(body) });
    return new Response(r.body, { status: r.status, headers: { ...cors, 'content-type': 'application/json' } });
  }
};
