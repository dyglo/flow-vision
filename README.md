# VisionFlow

Monorepo scaffold for the VisionFlow platform. Phase 1 establishes the full-stack foundations (React
+ FastAPI), containerised tooling, and environment configuration to support subsequent feature
phases.

## Structure

- `frontend/`: React + Vite + Tailwind UI shell with navigation stubs for all roadmap phases.
- `backend/`: FastAPI service with env-driven configuration, CORS, SQLite (dev) session factory, and
  Docker-ready packaging.
- `docker-compose.yml`: Spins up frontend, backend, and Redis for local orchestration (forward-looking
  for batch processing).
- `.env.example`: Shared configuration template. Copy to `.env` / `frontend/.env` before running.

## Getting Started

```bash
# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev

# Backend (Python 3.11+)
cd backend
python -m venv .venv
.venv/Scripts/activate  # On Windows use .venv\Scripts\activate
pip install -r requirements/dev.txt
uvicorn app.main:app --reload
```

Or use Docker Compose:

```bash
cp .env.example .env
cd frontend && cp .env.example .env && cd ..
docker compose up --build
```

## Next Steps

- Phase 2: Implement YOLO service wrapper, detection endpoints, and persistence.
- Phase 3+: Flesh out the UI components per the provided design system.
