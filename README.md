# MedCare AI

Academic health-guidance and retrieval-augmented question-answering prototype. It does not diagnose, prescribe, or replace professional medical advice.

## Architecture

The existing Next.js application and dark cyan design are preserved. The frontend uses Next.js 15.5.25, React 18 and Tailwind 3. FastAPI validates requests, screens emergencies before AI or retrieval, and returns structured results. Next.js was upgraded from the inconsistent 14/16 baseline to resolve security advisories.

The quiz flows into bounded adaptive follow-ups and automatically opens the result dashboard. Continue Chat preserves the conversation and supports source-linked questions. A standalone **Ask a health question** interface appears in the RAG section. Explicit chest-pain or breathing-difficulty selections show an immediate urgent warning. The backend independently screens submitted text and selections.

## Local startup

Use Python 3.11 or 3.12 and Node 20.9+ (Node 22 LTS recommended).

```sh
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv/Scripts/Activate.ps1
python -m pip install -r backend/requirements.txt
cd backend
# Copy .env.example to .env, then configure values if needed.
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```sh
cd frontend
npm ci
# Copy .env.example to .env.local.
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000. The complete demo and retrieval-based QA work without an AI key. Existing temporary frontend/.env.local from upstream should be removed or replaced with your own API URL; it is intentionally excluded from this delivery.

## Environment

Backend reads `.env` from its working directory:

- `FRONTEND_URL`: one exact frontend origin; defaults to localhost:3000.
- `FRONTEND_ORIGINS`: additional exact origins, comma-separated. No wildcard credentials.
- `OPENAI_API_KEY`: optional, backend only.
- `OPENAI_MODEL`: optional provider model, default gpt-4o-mini.
- `MOCK_AI_ONLY`: true disables optional provider question selection.
- `RAG_ENABLED`: true enables the checked local corpus; false disables retrieval.
- `RAG_TOP_K`: maximum retrieved passages for a consultation (capped at 4).

Frontend: `NEXT_PUBLIC_API_URL` is the FastAPI base URL, supplied at build time. Never put secrets in NEXT_PUBLIC variables.

## API responsibilities

- `GET /`: typed service metadata.
- `GET /health`: liveness and configured retrieval readiness. It does not perform retrieval itself.
- `POST /assess`: stateless deterministic screening of a structured assessment.
- `POST /consultation`: final guidance using the assessment and chronological user follow-ups; returns reported fields, risk, warning signs, next steps and citations for explicitly retrieved summary passages.
- `POST /chat`: intent `consultation` starts/continues adaptive follow-ups; intent `question` answers a general question using retrieval and does not require a quiz assessment.
- `POST /reset`: token-authorized session deletion; repeated deletion is safe.

An assessment has `symptoms` (1–12 strings, 1–120 characters each), `duration` (a few hours / 1-2 days / 3-7 days / more than a week / more than a month), `severity` (mild / moderate / severe / very severe), optional `additional_symptoms` (up to 12), and optional `notes` (2000 characters). Duration and severity accept case-insensitive UI labels.

Messages are `{role: "user" | "assistant", content: string}`. History is chronological, limited to 40 turns; each message is limited to 2000 characters. An empty initial consultation message is intentional; blank QA questions and blank follow-up turns are invalid. `message` is the only rendered assistant-text field; there is no conflicting next_question field.

A new chat/consultation omits session credentials. The server returns `session_id` and `session_token`. Subsequent calls pass both in JSON. An ID alone grants no access. Credentials stay in frontend memory, never URLs or localStorage. Store entries hold tokens, activity time and an emergency latch, not raw narratives. The store expires after 30 minutes and caps at 500 sessions. Capacity returns 503; expired/invalid sessions return 401; validation returns 422 without echoing health inputs. Reset clears server and frontend state only after successful confirmation.

## RAG question answering

`backend/rag/corpus.json` contains 11 short, reviewed paraphrases across six NHS topics, with URL, source section and verification date. The old unverified demonstration corpus was replaced. BM25 lexical retrieval uses topic gating; no embedding API or vector database is required. Hashed embeddings remain as an unused extension scaffold and are not represented as semantic embeddings.

Question → deterministic emergency check → topic-gated BM25 retrieval → answer composed from retrieved passage summaries → numbered source links. Each answer sentence is copied from its retrieved, reviewed corpus passage; the associated Source object identifies that same passage. No source-free medical text from an LLM reaches the answer. The corpus supports fever, headache, cough, fatigue, stroke warnings and breathlessness; unrelated questions abstain. Prescription/dosage/diagnosis requests are declined. This is retrieval-augmented answer composition, not unrestricted LLM generation.

- `RAG_DISABLED`: retrieval switched off.
- `RAG_READY`: retrieval enabled, but this response did not use any passages (also used by health).
- `RAG_ACTIVE`: this response actually retrieved passages and returns their citations.

The optional AI provider selects a vetted, relevant follow-up question via validated JSON. Timeouts, provider failures and malformed or irrelevant selections revert to deterministic follow-ups. The emergency path never calls the provider. The result dashboard remains deterministic even when question selection uses AI.

Sources cover general information, not individualized diagnosis. Risk grading and generic warning lists are prototype rules, not claims grounded by every displayed citation. Source links specifically support the numbered retrieved passages. Corpus paraphrases were checked on 2026-09-21; this does not constitute clinical validation. Review source changes and the corpus before any release.

## Codespaces

Forward ports 3000 and 8000. Set NEXT_PUBLIC_API_URL to the exact forwarded backend HTTPS URL. Set FRONTEND_ORIGINS to the exact forwarded frontend origin. Restart services after changing configuration. Use `--host 0.0.0.0` for uvicorn. CORS cannot bypass private-port authentication; configure access appropriately for your environment without sharing real health data. Do not hardcode a temporary Codespaces URL in tracked files.

## Verification

```sh
cd frontend
npm ci
npm run typecheck
npm run lint
npm run build
npm audit
cd ..
python -m compileall backend
python -m unittest discover -s backend/tests -v
```

The browser regression script in `frontend/tests/browser.cjs` requires Playwright (`npm install --no-save playwright`) and local services. Run `node tests/browser.cjs` from frontend with Chrome installed, or set BROWSER_CHANNEL=msedge. It covers the no-key consultation, reset, emergency UI, source-linked questions, invalid responses, network failure/retry and responsive overflow at seven widths. See DELIVERY.md for actual outcomes and limits.

## Deployment preparation

Vercel: import the repository with root directory `frontend`, install `npm ci`, build `npm run build`, framework Next.js. Set NEXT_PUBLIC_API_URL to the actual deployed backend URL before building.

Render: use `render.yaml`, root `backend`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`, health check `/health`. Set FRONTEND_URL to the exact Vercel origin and use FRONTEND_ORIGINS for additional approved origins. OPENAI_API_KEY is optional. Keep RAG_ENABLED true for QA.

Deploy one backend process for this demo; in-memory state is nonpersistent and not shared across instances. For production, add authenticated accounts, durable encrypted storage if needed, rate limits, clinical review, source update governance and operational privacy controls. No services were deployed and no remote commits were pushed.
