Mở **hai terminal riêng biệt**:

**Terminal 1 — Backend:**
.\venv\Scripts\activate
cd backend
uvicorn app.main:app --reload --port 8000

**Terminal 2 — Frontend:**
cd frontend
npm run dev
