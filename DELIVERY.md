# MedCare AI implementation and verification report

Implemented locally from upstream commit `25a6f2fe69d7628c06694a8b22f4217daf433a5e`. The original source archive was downloaded from Joevkadavan/medcare-ai. The workspace initially contained no application checkout or pre-existing application edits. Changes preserve the existing components and visual identity. No remote commits, deployment or service configuration changes were made.

## Delivered behavior

- Five-step quiz with preserved Back state, Other validation, mutually exclusive None, text limits and an immediate warning for explicit chest-pain/breathing selections.
- Bounded, chronological adaptive chat; automatic result transition; follow-up answers included in results; retry without duplicate user turns; Continue Chat preserves the session.
- Independent deterministic emergency screening before provider or retrieval calls. Emergency sessions stay urgent until reset. Location-neutral urgent-care wording, no diagnosis or prescriptions.
- **RAG question-answering system:** standalone question interface and Continue Chat retrieval. BM25 retrieves from 11 source-checked passages across six NHS topics. Answers are composed from those passages with numbered source links, sections, checked dates and actual relevance scores. Unsupported topics, diagnosis and dosage requests abstain. No key is required.
- Optional backend AI selects a vetted follow-up question from validated JSON. It cannot write unreviewed medical guidance. Provider failures and malformed responses fall back deterministically.
- Token-protected, expiring, capacity-bounded sessions. Only credentials, activity time and emergency state remain on the server; browser memory holds current narratives and history.
- Runtime response validation prevents malformed backend data from breaking screens. Errors do not expose submitted narratives. Reset waits for successful server deletion before clearing frontend state.

## Baseline audit and corrections

Architecture was an existing Next.js frontend plus FastAPI backend, with complete visual components, deterministic symptom/emergency services and a demonstration retrieval scaffold. Backend liveness worked; the requested frontend pieces already existed, but their integration was incomplete.

Reproduced defects included empty and whitespace-only /assess requests returning 200, false emergency positives for “no difficulty breathing” and “my clothes are fitting poorly”, and npm ci failing with EUSAGE because the manifest specified Next 14/React 18 while the lockfile specified Next 16/React 19. Inspection found reordered history, ignored completion responses, discarded follow-up context, unvalidated responses, client-ID-based session access and misleading retrieval claims. Browser review confirmed serif fallback and nearly invisible text caused by an undefined font variable and the theme color named `base` colliding with `text-base`.

Corrected the manifest/lockfile and incompatible duplicate config files, imported the stylesheet, added explicit ESLint configuration, and upgraded to patched Next.js 15.5.25 after npm audit exposed high/critical advisories in Next 14. React 18 and Tailwind 3 are retained. Renamed the theme color to `canvas` and used a system sans-serif stack. Input models, session access, orchestration and retrieval were repaired incrementally; existing page sections were retained.

## Architecture and API

Next.js 15.5.25 / React 18 / Tailwind 3 → validated API client → FastAPI / Pydantic → deterministic safety and guidance, optional constrained provider question selection, BM25 retrieval and citation-bound answer composition.

| Endpoint | Responsibility |
|---|---|
| GET / | Typed service metadata |
| GET /health | Liveness and readiness; no retrieval is performed |
| POST /assess | Stateless structured screening |
| POST /consultation | Dashboard result including user follow-ups and supporting retrieved passages |
| POST /chat | `intent=consultation`: adaptive follow-up; `intent=question`: RAG QA, assessment optional |
| POST /reset | Delete the token-authorized demo session |

Roles are user/assistant only. Symptoms are bounded to 12 entries of 120 characters; notes/messages to 2000 characters; history to 40 turns. The server issues session_id and session_token; an ID alone is not authorization. Sessions expire after 30 minutes and cap at 500. 422 means invalid/bounded input, 401 means invalid/expired session, and 503 can mean demo capacity exhausted.

RAG_DISABLED means off. RAG_READY means enabled but this response did not retrieve supporting passages. RAG_ACTIVE is returned only for responses with actual supporting retrieval. The health endpoint reports readiness rather than claiming it just performed retrieval. The old pseudo-embedding scaffold is unused; BM25 does not require an embedding model or vector database.

## Verification actually performed

| Command/check | Result |
|---|---|
| npm ci in frontend | PASS after lockfile repair; 367 packages installed; a Windows optional-directory cleanup warning did not affect the successful exit |
| npm run typecheck | PASS |
| npm run lint | PASS, no warnings/errors |
| npm run build | PASS; repeated after visual fixes, including build-time type/lint checks |
| npm audit / clean install audit | 0 reported vulnerabilities in the final frontend dependencies |
| Isolated Python environment and requirements installation | PASS |
| python -m compileall backend | PASS |
| python -m unittest discover -s backend/tests -q | 26 tests PASS |
| Live HTTP /, /health, /assess, /consultation, /chat, /reset | All returned expected 200 responses for valid requests |
| Live RAG question | RAG_ACTIVE with 2 supporting sources |
| Playwright headless Chrome, final production build | PASS, 16 recorded checks; no uncaught browser exceptions |
| git diff --check | PASS |

Browser checks cover the no-key consultation, Back-state preservation, automatic summary, follow-up retention, source-linked Continue Chat, reset, standalone QA, failed network/retry, malformed 200-response payloads, free-text emergency lock and immediate quiz interruption. Overflow and composer bounds were checked at 320, 375, 390, 430, 768, 1024 and 1440 pixels. The final font/color regression check also passed. Screenshots were inspected; mobile-qa.png is included.

Backend tests cover request/history validation, role restrictions, sensitive-validation redaction, mild and emergency paths, demo completion, authorization, expiry, capacity, reset, CORS, provider failure/malformed output, emergency provider bypass, RAG citation mapping, disabled/missing retrieval, unsupported topics and context switching.

Initial environment failures were resolved: Git lacked its HTTPS helper, so Python downloaded the upstream archive; npm was bootstrapped into work/ and its cache moved inside the workspace; temporary Windows encoding errors were corrected to UTF-8. A standalone-QA model defect was caught by tests and fixed. The final browser rerun initially used an old server/build; restarting the local service resolved it. A temporary alternate-port attempt was correctly blocked by configured CORS. These were not skipped checks.

No real API key or live provider was used. Provider behavior was tested with mocks. No physical-device virtual keyboard, screen reader, full accessibility audit, load test or clinical validation was performed. Mobile checks are browser viewport checks, not physical-device certification.

## Configuration, startup and deployment

Read README.md in the source archive for complete local, Codespaces, Vercel and Render instructions. Backend variables: FRONTEND_URL, FRONTEND_ORIGINS, OPENAI_API_KEY (optional), OPENAI_MODEL, MOCK_AI_ONLY, RAG_ENABLED and RAG_TOP_K. Frontend: NEXT_PUBLIC_API_URL. No secret values are included; environment-file checks found no nonempty credential keys. The tracked upstream temporary frontend/.env.local is removed from the delivered source and patch.

Local quick start: create a Python virtual environment, install backend/requirements.txt, then from backend run `python -m uvicorn main:app --port 8000`. From frontend run `npm ci` and `npm run dev`. Default UI is http://localhost:3000 and API is http://localhost:8000. In Codespaces configure the exact forwarded origins and API URL, and bind uvicorn to 0.0.0.0.

Vercel root: frontend; install npm ci; build npm run build; set NEXT_PUBLIC_API_URL before building. Render root: backend; install pip install -r requirements.txt; start uvicorn main:app --host 0.0.0.0 --port $PORT; health path /health. Set exact frontend CORS origins. No deployed URLs exist for this work.

## Limitations and next steps

This is an academic prototype with a small reviewed corpus and rule-based risk grading, not a diagnostic product. Retrieval answers use reviewed passage composition rather than unrestricted generative LLM prose. The corpus is limited and must be reviewed periodically; a verification date is not clinical validation. Citations support the numbered retrieved passages, not every generic risk rule or warning elsewhere in the dashboard. Negation detection is deliberately limited and conservative.

Sessions are single-process and nonpersistent. Refresh loses browser-held consultation history. Multi-instance production needs a shared session service, authenticated accounts as appropriate, rate limiting, operational privacy controls and clinical governance. Bearer tokens protect session access but are not account authentication. Requests for children's/pregnancy advice and uncovered causal questions are declined by the QA layer. The source corpus refresh procedure is in backend/rag/CORPUS.md.

## Files changed

### Created

- `DELIVERY.md`
- `backend/rag/CORPUS.md`
- `backend/rag/corpus.json`
- `backend/rag/qa.py`
- `backend/tests/test_api.py`
- `frontend/.eslintignore`
- `frontend/.eslintrc.json`
- `frontend/components/KnowledgeQA.tsx`
- `frontend/components/SourceList.tsx`
- `frontend/tests/browser.cjs`

### Modified

- `.env.example`
- `.gitignore`
- `README.md`
- `backend/.env.example`
- `backend/README.md`
- `backend/config.py`
- `backend/main.py`
- `backend/models.py`
- `backend/rag/__init__.py`
- `backend/rag/knowledge_base.py`
- `backend/rag/retriever.py`
- `backend/services/ai_service.py`
- `backend/services/emergency_service.py`
- `backend/services/symptom_service.py`
- `backend/store.py`
- `frontend/README.md`
- `frontend/app/globals.css`
- `frontend/app/layout.tsx`
- `frontend/components/Chatbot.tsx`
- `frontend/components/Consultation.tsx`
- `frontend/components/ConsultationQuiz.tsx`
- `frontend/components/Features.tsx`
- `frontend/components/Hero.tsx`
- `frontend/components/Navbar.tsx`
- `frontend/components/ResultDashboard.tsx`
- `frontend/lib/api.ts`
- `frontend/next.config.js`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/tailwind.config.js`
- `render.yaml`

### Removed

- `frontend/.env.local`
- `frontend/eslint.config.mjs`
- `frontend/next.config.ts`
- `frontend/postcss.config.mjs`
