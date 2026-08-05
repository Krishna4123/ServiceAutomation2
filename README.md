# NovaSupport — Multi-Agent AI Customer Success Platform

NovaSupport is an enterprise-grade, multi-agent AI customer support platform designed to handle customer inquiries across text and voice channels. Powered by **LangGraph**, **FastAPI**, **Gemini 2.5 Flash / OpenAI-compatible LLMs**, **FAISS RAG**, **Whisper STT**, and **gpt-4o-mini-tts**, NovaSupport seamlessly routes intents, looks up order & account data, performs vector policy retrieval, and escalates complex issues to human specialists.

---

## 🌟 Key Features

- 🧠 **Multi-Agent State Graph (LangGraph)**
  - **Supervisor Router**: Classifies incoming messages into exact intent categories (`greetings`, `order_status`, `troubleshooting`, `subscription`, `warranty`, `pricing`, `escalate`, `clarify`).
  - **Specialized Worker Nodes**:
    - **Order Status Node**: Queries mock order databases with prefix-agnostic and case-insensitive ID matching (`ORD-XXXXXX` or bare order numbers).
    - **RAG Policy Node**: Grounded policy retrieval using FAISS vector search across returns, warranty, and pricing documents.
    - **Subscription / Billing Node**: Handles account plan queries and billing policy details.
    - **Troubleshooting Node**: Step-by-step diagnostic guidance for hardware and software issues.
    - **Escalate Node**: Terminal handoff node that automatically generates support tickets (`TKT-XXXXXXXX`) and sets escalation priorities.
    - **Clarify & Greetings Nodes**: Natural conversation handling for greetings and ambiguous inputs.

- 🎙️ **Dual Interaction Modes (Text & Voice)**
  - Seamless **Text ↔ Voice** toggle UI in the header.
  - **Speech-To-Text (STT)**: High-accuracy transcription powered by OpenAI Whisper (`POST /voice/transcribe`).
  - **Text-To-Speech (TTS)**: High-quality audio synthesis powered by `gpt-4o-mini-tts` (`POST /voice/speak`).
  - Live RMS audio visualizer for active voice recording feedback.

- 🎨 **Modern, Responsive Frontend**
  - Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.
  - Modern dark/light mode UI with dynamic glassmorphism, animated status badges, escalation cards, source citations, and suggested actions.

---

## 📁 Repository Structure

```text
service_Automation/
├── client/                     # Frontend (Vite + React + TypeScript + Tailwind)
│   ├── src/
│   │   ├── api/                # Axios API client setup & endpoint calls
│   │   ├── components/         # UI Components (Header, VoiceModeUI, ModeToggle, ChatWindow, EscalationCard, etc.)
│   │   ├── hooks/              # Custom hooks (useChat, useSession, useMode, useVoiceRecorder, useVoicePlayback)
│   │   ├── pages/              # SupportChat main page layout
│   │   └── types/              # TypeScript schemas & contracts
│   └── package.json
│
└── server/                     # Backend (FastAPI + LangGraph + FAISS RAG)
    ├── app/
    │   ├── api/                # FastAPI routers (/chat, /session, /voice)
    │   ├── data/               # Mock DB access & JSON datasets (mock_orders, mock_accounts)
    │   ├── graph/              # LangGraph definition, state, supervisor, and worker nodes
    │   ├── rag/                # FAISS vector store ingest & retriever logic
    │   ├── services/           # Shared services (llm_service, voice_service, ticket_service, session_store)
    │   └── config.py           # Typed environment settings (Pydantic Settings)
    ├── tests/                  # Pytest integration & unit test suite
    ├── main.py                 # FastAPI application entrypoint & CORS middleware
    └── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.10+
- **Node.js**: 18+ and `npm`
- **API Key**: Gemini API key or OpenAI-compatible endpoint key set in `server/.env`.

---

### Backend Setup (`server/`)

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file inside `server/` with the following variables:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
   LLM_MODEL=gemini-2.5-flash
   TTS_MODEL=gpt-4o-mini-tts
   STT_MODEL=whisper-1
   APP_PORT=8000
   ```

5. **Initialize RAG Index**:
   ```bash
   python -m app.rag.ingest
   ```

6. **Start the Backend Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be running at `http://localhost:8000`.

---

### Frontend Setup (`client/`)

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The web app will open at `http://localhost:5173`.

---

## 📡 API Endpoints

### Chat & Session
- `POST /session/start` — Initializes a new support session and returns a `session_id` and initial greeting.
- `GET /session/{session_id}/history` — Fetches complete message history for the specified session.
- `POST /chat` — Main conversation endpoint.
  - **Request**: `{ "session_id": "...", "message": "...", "channel": "web|voice" }`
  - **Response**: `{ "session_id": "...", "reply": "...", "intent": "...", "escalated": false, "sources": [...] }`

### Voice Pipeline
- `POST /voice/transcribe` — Accepts an `audio/*` multipart file and returns Whisper text transcription `{ "transcription": "..." }`.
- `POST /voice/speak` — Accepts `{ "text": "...", "voice": "alloy" }` and streams back MP3 audio bytes (`audio/mpeg`).

---

## 🧪 Testing

The backend includes a comprehensive `pytest` suite testing all endpoints, supervisor routing, isolation node behaviors, slot extraction, and escalation flows.

Run tests from the `server/` directory:
```bash
python -m pytest tests/ -v --tb=short
```

---

## 🛠️ Technology Stack

- **Backend**: FastAPI, LangGraph, LangChain, Pydantic, FAISS, OpenAI SDK
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios
- **Speech**: Whisper (STT), OpenAI TTS (`gpt-4o-mini-tts`)
- **Testing**: Pytest, Asyncio, Starlette TestClient