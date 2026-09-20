# MedCare AI — Backend

FastAPI service providing symptom assessment, risk grading, an emergency
detector, a conversational consultation endpoint, and a retrieval layer.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Service banner |
| GET | `/health` | Liveness + current AI/RAG mode |
| POST | `/assess` | Structured symptom assessment |
| POST | `/consultation` | Full risk grade, summary, guidance, sources |
| POST | `/chat` | One conversational follow-up turn |
| POST | `/reset` | Clear consultation state |

## AI modes

Set `OPENAI_API_KEY` in `.env` to enable live generation. With no key — or with
`MOCK_AI_ONLY=true` — the service runs in **mock mode**: deterministic,
rule-based follow-up questions. Everything works; the frontend is told which
mode is active via `ai_mode`, so nothing is misrepresented as AI output.

## RAG status

The retrieval pipeline is wired end to end (`rag/retriever.py`) over a curated
local corpus (`rag/knowledge_base.py`). Embeddings are a hashing placeholder.

The service therefore reports **RAG READY**, not RAG ACTIVE. Wire a real
embedding model into `rag/embeddings.py` (set `EMBEDDING_LIVE = True`) and the
status flips.

## Safety

This service does not diagnose. Output is general health information. Emergency
detection is deliberately over-inclusive and fails open — a false positive costs
alarm, a false negative could cost far more.
