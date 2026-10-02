import os
from fastapi import FastAPI, HTTPException
from gateway import Gateway
app = FastAPI(title="UNSEEN-Q agent gateway")
gw = Gateway(os.environ.get("SIGNING_KEY", "dev-only-key"))

@app.get("/health")
def health(): return {"ok": True}

@app.post("/authorize")
def authorize(body: dict):
    try: return {"token": gw.authorize(body["agent"], body["tool"], body.get("args", {}), body.get("intent", ""), body.get("approved_by"))}
    except PermissionError as e: raise HTTPException(403, str(e))
