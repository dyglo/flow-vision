# VisionFlow

VisionFlow is an AI-assisted object detection platform. The repository is organised as a monorepo
with a Vite + React frontend and a FastAPI backend. Phase 1 established the core scaffolding; Phase 2
introduces the YOLO inference service, MongoDB persistence via Beanie, and an HTTP endpoint for
single-image detection with class filtering.

## Structure

- `frontend/`: React UI shell with navigation stubs matching the design comps. TailwindCSS and Vite
  configuration include shared aliases and theming primitives.
- `backend/`: FastAPI application with CORS, environment-driven configuration, SQLite (for auxiliary
  metadata), MongoDB + Beanie setup, and YOLO service modules.
- `docker-compose.yml`: Spins up frontend, backend, Redis (for future task queues), and MongoDB.
- `.env.example`: Shared configuration template—copy to `.env` / `frontend/.env` before running.

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

> **Important**  
> Before starting the stack, edit your local `.env` (and deployment secrets) to set  
> `MONGO_URL=mongodb+srv://tafardev_db_user:TQAAZNvLacy0GUOv@flowvision.yfaqlyl.mongodb.net/?retryWrites=true&w=majority&appName=flowvision`.  
> Keep this out of version control by updating only local environment files or secret stores.

### Environment Configuration

| Variable | Description |
| --- | --- |
| `MONGO_URL` | Defaults to `mongodb://mongo:27017`. Override with the Atlas URI above for production. |
| `MONGO_DB_NAME` | Mongo database name; defaults to `visionflow`. |
| `YOLO_MODEL_PATH` | Path to YOLO weights, default `yolo11n.pt`. Place custom weights under `backend/models`. |
| `YOLO_CONFIDENCE` | Confidence threshold for detections (0-1). |
| `YOLO_DEVICE` | `cpu` or CUDA device (e.g. `cuda:0`). |

## Testing

```bash
cd backend
pytest
```

## Current Focus

- Phase 2 backend: YOLO service wrapper with class filtering, detection endpoint, and MongoDB
  persistence.
- Next (Phase 3): Frontend single-image workflow consuming the new API.
