from fastapi import FastAPI
app = FastAPI(title="UNSEEN-Q flow inspector")
@app.get("/health")
def health(): return {"ok": True}
