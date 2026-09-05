# Meridian — Live Production Deployment Guide

This guide details the exact architecture, environment variables, and platform settings to deploy **Meridian** live to production with zero build errors.

---

## 1. Repository Architecture
The repository is a **frontend + backend monorepo**:
```
AI-Project-Generator/
├── backend/                      # Python FastAPI application
│   ├── main.py                   # FastAPI app instance (app = FastAPI(...))
│   ├── database.py               # SQLAlchemy async connection pooling & ORM
│   ├── config.py                 # Configuration & environment loader
│   ├── schemas.py                # Pydantic request/response validation schemas
│   ├── services/                 # Embedding, matching, feasibility & RAG engines
│   └── requirements.txt          # Python dependencies for backend/ subdirectory
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/                      # Client UI, 3D Graph, Mentor Chat & Studio
│   ├── package.json              # Frontend scripts (build: "tsc -b && vite build")
│   └── vercel.json               # SPA client-side rewrite rules for Vercel
├── requirements.txt              # Root Python dependencies (Render root build)
├── package.json                  # Root package.json (delegates builds to frontend)
├── vercel.json                   # Root Vercel SPA configuration
├── render.yaml                   # Render 1-click infrastructure blueprint
├── docker-compose.yml            # Containerized deployment (Postgres + Backend + Frontend)
└── .env.example                  # Template of all production environment variables
```

---

## 2. Deploying Backend to Render (Resolving Build Errors)

### Root Cause of the Error:
Render failed with:
```
ERROR: Could not open requirements file:
[Errno 2] No such file or directory: 'requirements.txt'
```
Render's default Web Service configuration runs `pip install -r requirements.txt` at the repository root (`./`). Because the project originally only had `backend/requirements.txt`, Render could not find `requirements.txt` at the root.

### Fix Implemented:
1. `requirements.txt` is now placed at the **root (`./requirements.txt`)** AND inside **`backend/requirements.txt`**.
2. Both files contain the complete set of required production packages (`fastapi`, `uvicorn[standard]`, `pydantic`, `httpx`, `sqlalchemy`, `asyncpg`, `psycopg2-binary`, `bcrypt`, `pyjwt`, `cryptography`, `slowapi`, `sentry-sdk`, `numpy`, `joblib`, `scikit-learn`, `fastembed`, `networkx`, `onnxruntime`).
3. `backend/main.py` automatically injects the parent and current directory into `sys.path` so that imports succeed regardless of working directory.

### Exact Render Settings:

#### Recommended Configuration (Root Directory: Blank / `.`)
- **Name:** `meridian-api`
- **Environment:** `Python 3`
- **Region:** Any (e.g., Oregon or Frankfurt)
- **Branch:** `main`
- **Root Directory:** *(leave blank or set to `.`) *
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

#### Alternative Configuration (Root Directory: `backend`)
If you set Render's **Root Directory** to `backend`:
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 3. Deploying Frontend to Vercel

### Recommended Configuration (Root Directory: `frontend`)
1. Go to **[vercel.com](https://vercel.com)** → **Add New...** → **Project**.
2. Select `harshchavan009/AI-Project-Generator`.
3. In the project setup screen, click **Edit** next to `./` and select **`frontend`**.
4. Vercel automatically detects:
   - **Framework:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-meridian-api.onrender.com` (Your live Render backend URL)
6. Click **Deploy**.

---

## 4. Environment Variables Reference

Never commit secrets to source control. Configure these in the Render and Vercel dashboards:

### Backend Environment Variables (Render Dashboard):
| Variable Name | Required | Description | Example / Notes |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Optional | PostgreSQL connection string | Defaults to local SQLite if omitted |
| `JWT_SECRET_KEY` | **Yes** | 256-bit key for signing auth tokens | Render can generate this or use 32 hex chars |
| `PII_ENCRYPTION_KEY` | **Yes** | Fernet AES-256 key for encrypting student data | Generated via `Fernet.generate_key()` |
| `ENVIRONMENT` | **Yes** | App runtime mode | `production` |
| `FRONTEND_URL` | Optional | Custom frontend URL for strict CORS | e.g. `https://meridian.vercel.app` |
| `ALLOWED_ORIGINS` | Optional | Allowed CORS origins | Defaults to auto-allowing `*.vercel.app`, `*.onrender.com` |
| `ANTHROPIC_API_KEY` | Optional | Anthropic Claude API Key | Offline deterministic RAG active if omitted |
| `GEMINI_API_KEY` | Optional | Google Gemini API Key | Offline deterministic RAG active if omitted |
| `OPENAI_API_KEY` | Optional | OpenAI API Key | Offline deterministic RAG active if omitted |
| `SENTRY_DSN` | Optional | Sentry error tracking endpoint | Optional |

### Frontend Environment Variables (Vercel Dashboard):
| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | **Yes** | Live backend HTTPS URL (e.g., `https://meridian-api.onrender.com`) |

---

## 5. Verifying the Deployed Backend

Once Render finishes building and starts your service:

1. **Root Probe**:
   ```bash
   curl https://<your-render-url>.onrender.com/
   ```
   **Expected Response:**
   ```json
   {
     "status": "ok",
     "service": "meridian-backend",
     "version": "2.0.0",
     "docs_url": "/docs",
     "health_url": "/health"
   }
   ```

2. **Health Check**:
   ```bash
   curl https://<your-render-url>.onrender.com/health
   ```
   **Expected Response:**
   ```json
   {
     "status": "healthy",
     "service": "meridian-backend",
     "database": { "status": "healthy" }
   }
   ```

3. **Interactive Swagger Documentation**:
   Navigate in browser to:
   `https://<your-render-url>.onrender.com/docs`
   and `https://<your-render-url>.onrender.com/openapi.json`.

---

## 6. 1-Click Full-Stack Deploy via Render Blueprint

Because [`render.yaml`](file:///Users/harsh/Desktop/Ai%20Project%20Generator/render.yaml) is pre-configured in the repository root:
1. Go to **Render Dashboard** → **New +** → **Blueprint**.
2. Connect `harshchavan009/AI-Project-Generator`.
3. Render automatically provisions:
   - `meridian-db` (PostgreSQL Database)
   - `meridian-api` (FastAPI Python Service)
   - `meridian-frontend` (Static React Site)
4. Click **Apply** to launch the complete system.
