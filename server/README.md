# AI Customer Success Platform — Backend

A production-ready, multi-agent AI backend for customer support automation. Built with **FastAPI**, **LangGraph**, **Gemini 2.5 Flash** (via OpenAI-compatible API), **FAISS** RAG, and **Pydantic**.

---

## Architecture Overview

```
User Request → POST /chat → run_graph()
                              └─ Supervisor Node (intent classification)
                                    ├─ order_status  → Order Status Node → Mock DB
                                    ├─ troubleshooting → Troubleshooting Node → FAISS RAG
                                    ├─ subscription  → Subscription Node → FAISS RAG + Mock DB
                                    ├─ general       → RAG Node → FAISS RAG
                                    ├─ escalate      → Escalate Node → Ticket Service
                                    └─ clarify       → Clarify Node → LLM
```

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Your institution's OpenAI-compatible API key and base URL

### 2. Create Virtual Environment

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy the example and fill in your keys
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `.env`:
```env
OPENAI_API_KEY=your-institution-api-key-here
OPENAI_BASE_URL=https://your-institution-openai-compatible-base-url/v1
LLM_MODEL=gemini-2.5-flash
```

### 5. Build the FAISS Index (one-time setup)

Run this after first install or whenever policy documents change:

```bash
python -m app.rag.ingest
```

This processes the 4 markdown files in `app/rag/documents/` and saves a FAISS index to `faiss_index/`.

### 6. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at: **http://localhost:8000**

Interactive docs: **http://localhost:8000/docs**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Liveness probe |
| `POST` | `/session/start` | Create a new conversation session |
| `GET` | `/session/{id}/history` | Get full conversation history |
| `POST` | `/chat` | Send a message, receive an AI response |
| `POST` | `/voice/transcribe` | [STUB] Audio transcription placeholder |

### Example: Start a Session

```bash
curl -X POST http://localhost:8000/session/start
# {"session_id": "abc123-...", "message": "Session started successfully."}
```

### Example: Send a Chat Message

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc123-...", "message": "Where is my order ORD-100001?", "channel": "web"}'
```

---

## Running Tests

```bash
pip install pytest httpx
pytest tests/ -v
```

---

## Project Structure

```
server/
├── main.py                  # FastAPI app, CORS, routers, /health
├── requirements.txt
├── .env.example
├── .gitignore
│
├── app/
│   ├── config.py            # Pydantic settings (reads .env)
│   ├── api/                 # Route handlers (thin, delegate to services/graph)
│   ├── graph/               # LangGraph pipeline
│   │   ├── builder.py       # Compiled graph + run_graph() entry point
│   │   ├── state.py         # ConversationState schema
│   │   └── nodes/           # One file per agent node
│   ├── rag/                 # FAISS ingestion + retriever
│   │   └── documents/       # Policy .md files
│   ├── data/                # Mock JSON data + db.py helpers
│   ├── schemas/             # Pydantic request/response models
│   ├── services/            # LLM client, session store, ticket service
│   └── utils/               # Structured logger
│
└── tests/
    ├── test_chat_endpoint.py
    └── test_graph_nodes.py
```

---

## Key Design Decisions

- **No business logic in routes** — routes only call `run_graph()` or session store helpers
- **Single LLM client** — all nodes share `llm_service.chat_completion()`, never instantiate their own
- **Nodes ≤ 50 lines** — each node has one job, is independently testable via mocks
- **In-memory session store** — swap `app/services/session_store.py` for Redis with zero graph changes
- **FAISS index is external** — run `python -m app.rag.ingest` once; index is gitignored
- **OpenAI-compatible client** — works with any endpoint that follows the OpenAI chat completions spec
