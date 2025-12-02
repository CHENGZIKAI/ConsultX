# ConsultX Session Tracking Backend

This repository delivers the first milestone for ConsultX: a self-contained backend that tracks conversation sessions, evaluates risk, and prepares end-of-session summaries in line with the project proposal.

## Features
- REST API built with the Python standard library (no external installs required).
- Session lifecycle management with rolling buffer snapshots.
- Lexicon-driven sentiment and risk classification (tiers: `ok`, `caution`, `high`, `crisis`).
- SQLite persistence for sessions, messages, metrics, and buffers.
- Automatic summary generation with sentiment trends, tier counts, and resource suggestions.
- Optional API-key authentication on every endpoint.
- Adapter-friendly risk engine so external classifiers can augment heuristic scoring.
- Unit tests covering core workflows.

## Project Layout
```
backend/
  analysis.py          # Sentiment + risk heuristics
  api.py               # HTTP server exposing REST endpoints
  models.py            # Dataclasses and enums
  session_tracking.py  # Orchestration service
  storage.py           # SQLite repository
docs/
  session_backend_design.md
tests/
  test_session_tracking.py
ConsultX - Group 4 Proposal.pdf
README.md
```

## Getting Started
1. Ensure Python 3.11+ is available.
2. (Optional) Set environment overrides:
   - `CONSULTX_DB_PATH`: SQLite file path (defaults to `consultx.db`).
   - `CONSULTX_BUFFER_SIZE`: Rolling buffer size (defaults to `20` messages).
   - `CONSULTX_API_KEYS`: Comma-separated API keys required for every request.
   - `CONSULTX_API_KEYS_FILE`: File containing one API key per line (merged with inline keys).
3. Launch the server:
   ```bash
   python -m backend.api
   ```
   The server listens on `http://127.0.0.1:8000`.

### Authentication
If either `CONSULTX_API_KEYS` or `CONSULTX_API_KEYS_FILE` is supplied, the API enforces authentication. Clients must send one of:
- `Authorization: Bearer <api-key>`
- `X-API-Key: <api-key>`

Requests without a valid key receive `401 Unauthorized`.

## REST API
| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/sessions` | Create a session. Body: `{"user_id": "...", "metadata": {...}}`. |
| `GET`  | `/sessions` | List sessions. Query params: `user_id`, `status`. |
| `GET`  | `/sessions/{id}` | Fetch metadata, latest buffer snapshot, and cached metrics. |
| `POST` | `/sessions/{id}/messages` | Append a message (`sender`: `user`/`assistant`/`system`, `content`). |
| `POST` | `/sessions/{id}/end` | Mark session as ended and generate final summary. |
| `GET`  | `/sessions/{id}/summary` | Retrieve (or recompute) the session summary. |

Responses are JSON with ISO8601 timestamps. Errors follow `{"error": "...", "status": <code>}`.

### Sample Workflow
```bash
# Create a session
curl -X POST http://127.0.0.1:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user"}'

# Append a user message
curl -X POST http://127.0.0.1:8000/sessions/{session_id}/messages \
  -H "Content-Type: application/json" \
  -d '{"sender": "user", "content": "I feel hopeless and tired."}'

# End the session and fetch summary
curl -X POST http://127.0.0.1:8000/sessions/{session_id}/end
```

## Testing
Run the unit test suite:
```bash
python -m unittest discover -s tests
```

## Extensibility
- Register advanced risk detectors at runtime: `tracker.register_risk_adapter(callable)` where the callable returns a `RiskAssessment`. Adapters can escalate tiers, contribute notes, and flag custom keywords.
- Expand the resource catalog by updating `backend/analysis.py` to map new keywords to referrals or exercises.

## Next Steps
1. **Identity Provider Integration**: Swap API-key auth for OAuth/JWT backed by the real user directory.
2. **Advanced Risk Models**: Plug clinical risk classifiers (e.g., hosted transformers) into the adapter pipeline.
3. **Locale-Aware Resources**: Expand referrals with multi-region contact data and dynamic selection.
4. **Frontend Integration**: Wire the web UI to consume buffer snapshots and summaries in real time.
5. **Telemetry & Logging**: Export structured logs to monitoring/alerting pipelines for operational visibility.


## Evaluation (40 synthetic cases)

We hand-crafted 40 labeled scenarios covering:
- Homesickness, social withdrawal, and loneliness
- Burnout, academic / work stress
- Increased alcohol use without self-harm intent
- Ambivalent or low mood without suicidal ideation
- Explicit suicidal ideation and self-harm language

Each case has:
- An expected risk tier: `OK`, `Caution`, `High`, or `Crisis`
- An expected guardrail action: `ok`, `soften`, or `crisis_override`
- A flag for whether hotline text should appear

### Risk Router

| Metric | Result |
|--------|--------|
| Exact tier match (`OK`/`Caution`/`High`/`Crisis`) | **80%** (32 / 40) |
| “Any-risk vs OK” recall (non-OK cases never downgraded to OK) | **100%** (35 / 35) |
| Crisis recall (`Crisis` vs non-Crisis) | **≈80%** (8 / 10) |
| Crisis false-positive rate (non-Crisis mis-labeled as `Crisis`) | **≈85%** (34 / 30) |

The router is intentionally conservative: it tends to over-escalate `Caution` → `High` rather than miss distress. `Caution` and `High` are treated identically at the guardrail layer (both trigger a safety softener).

### Guardrails

| Metric                                                       | Result                             |
|--------------------------------------------------------------|------------------------------------|
| Guardrail action match (`ok` / `soften` / `crisis_override`) | **95%** (38 / 40)                  |
| Hotline presence correctness                                 | **90%** (36 / 40)                  |
| Hard crisis override for explicit suicidal language          | **100%** on explicit SI test cases |
| Replies with hard directives (e.g., “you must…”)             | **0 / 40**                         |

For explicit suicidal ideation (e.g., *“I keep thinking about ending my life and imagining ways I could do it.”*), the router produces `Crisis` and the guardrail layer bypasses the MI prompt, returning a dedicated crisis-support block with hotline information.

### Style / MI Checklist

| Metric | Result |
|--------|--------|
| Contains at least one reflection | **87.5%** (35 / 40) |
| Contains at least one open question | **95%** (38 / 40) |
| Both reflection + open question | **85%** (34 / 40) |
| ≤ 120 words | **75%** (30 / 40) |
| Meets *all* strict checklist items | **77.5%** (31 / 40) |
| Replies with hotline text | 8 / 40 (crisis / near-crisis only) |

We intentionally use a **strict** checklist; many “almost there” MI replies fail for minor length issues.

### Retrieval (RAG)

For this run:

- Retrieval was configured with **k = 3** snippets per turn.
- All 40 cases successfully retrieved context (no vectorstore / embedding errors).
- Qualitative inspection shows that retrieved snippets are on-topic (CBT / MI guidance, safety language, etc.); we don’t yet compute an automatic relevance score.

---



