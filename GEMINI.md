# GEMINI.md - Himalayan Salt Lamp E-commerce Project

# Communication Rules: You MUST output all your final explanations, responses, and thinking logs to the user in Vietnamese.

## 1. Project Overview

This project is a comprehensive B2C E-commerce platform for selling Himalayan Salt Lamps, featuring a modern tech stack and integrated AI capabilities.

- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, TailwindCSS 4, Three.js (3D Product Viewer), Zustand (State Management).
- **Backend:** FastAPI (Python), SQLAlchemy 2.0 (ORM), Alembic (Migrations), MySQL.
- **AI/Chatbot:** RAG (Retrieval-Augmented Generation) architecture using LangChain, LangGraph, and ChromaDB. Supports multiple LLM providers (OpenAI, Gemini, HuggingFace, Ollama).
- **Key Features:** 3D product interaction, AI-powered customer support (consulting, ordering, order tracking), comprehensive Admin Dashboard (Catalog, Orders, Inventory, Statistics, AI Data Management).

## 2. Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### Backend Setup

1. **Virtual Environment:**
   ```bash
   python -m venv .venv
   .venv/Scripts/activate # Windows
   # source .venv/bin/activate # Linux/macOS
   ```
2. **Install Dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Environment Configuration:**
   - Copy `backend/.env.example` to `backend/.env`.
   - Configure `DATABASE_URL`, `SECRET_KEY`, and AI API keys (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, etc.).
4. **Database Migrations:**
   ```bash
   cd backend
   alembic upgrade head
   ```
5. **Run Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Environment Configuration:**
   - Copy `.env.production.example` to `.env.local`.
   - Set `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3. **Run Dev Server:**
   ```bash
   npm run dev
   ```

## 3. Development Conventions

### Backend

- **Framework:** FastAPI with asynchronous handlers.
- **API Prefix:** All endpoints should use `/api/v1`.
- **Response Format:** Every response must follow the `BaseResponse` schema (defined in `app/schemas/base.py`).
- **Authentication:** JWT-based, managed via `app/core/security.py`.
- **Database:** Use SQLAlchemy 2.0 (Async) and Alembic for all schema changes.
- **Validation:** Use Pydantic schemas for request validation and response serialization.
- **AI Integration:** Follow the service-based architecture in `app/services/ai_agent/`. Use the `LLM_PROVIDER` and `EMBEDDING_PROVIDER` settings for flexibility.

### Frontend

- **Framework:** Next.js with App Router and TypeScript.
- **Styling:** TailwindCSS 4 (utility-first).
- **State Management:** Zustand for global state (Auth, Cart).
- **Components:** Modular structure with separate directories for `admin`, `shop`, `layout`, and `ui`.
- **API Interaction:** Centralized services in `src/services/` using Axios.
- **3D Rendering:** Use `react-three-fiber` and `three.js` for product models.

### Documentation & Testing

- **API Docs:** Available at `/docs` (Swagger UI) and `/redoc`.
- **Testing:** Use `pytest` for backend testing. Run tests with `pytest backend/tests`.
- **Task Management:** Refer to the `tasks/` directory for the development roadmap and implementation details of various phases.

## 4. Key Directories

- `backend/app/`: Core backend logic (models, schemas, routers, services).
- `backend/app/services/ai_agent/`: AI Chatbot engine and RAG implementation.
- `frontend/src/app/`: Next.js pages and route groups.
- `frontend/src/components/`: Reusable React components.
- `docs/`: Project documentation (ERD, functional analysis).
- `tasks/`: Phased development roadmap.
- `chroma_db/`: Persistent storage for AI vector embeddings.
