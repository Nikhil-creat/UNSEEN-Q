from fastapi import FastAPI
app = FastAPI(title="UNSEEN-Q RAG")
@app.get("/health")
def health(): return {"ok": True}
