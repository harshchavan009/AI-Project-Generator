# Meridian — Live Deployment Guide

This guide details how to deploy **Meridian** live to production with HTTPS and free/low-cost cloud hosting.

---

## Architecture Overview
```
┌──────────────────────────────────────────────────────────────┐
│                    User Browser / Mobile                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
               HTTPS Requests  ▼
┌──────────────────────────────────────────────────────────────┐
│              Frontend (React + Vite + Tailwind)              │
│       Hosted on: Vercel, Netlify, or Render Static Site      │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST / SSE
                               ▼
┌──────────────────────────────────────────────────────────────┐
│              Backend (FastAPI + ONNX INT8 + RBAC)            │
│         Hosted on: Render, Railway, or VPS Docker            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│            Database (PostgreSQL + Connection Pool)           │
│         Hosted on: Render Postgres, Supabase, or Neon        │
└──────────────────────────────────────────────────────────────┘
```

---

## Option 1: 1-Click Cloud Deployment via Render Blueprint (Recommended)

Render provides free hosting for PostgreSQL, Python Web Services, and Static React sites. Because `render.yaml` is pre-configured in this repository, you can deploy the complete stack with zero manual wiring:

### Steps:
1. **Push the latest commits to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Meridian AI Mentor & Production Deployment Config"
   git push origin main
   ```
2. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in with GitHub.
3. Click **New +** → **Blueprint**.
4. Select repository: `harshchavan009/AI-Project-Generator`.
5. Render reads [`render.yaml`](file:///Users/harsh/Desktop/Ai%20Project%20Generator/render.yaml) and automatically creates:
   - `meridian-db`: Managed PostgreSQL database.
   - `meridian-api`: FastAPI backend web service.
   - `meridian-frontend`: Static site with SPA routing and automatic HTTPS.
6. Click **Apply**.
7. In ~3 minutes, your live site URL will be active (e.g. `https://meridian-frontend.onrender.com`)!

---

## Option 2: Split Deploy (Vercel Frontend + Render / Railway Backend)

This is the most popular, high-performance architecture (instant global CDN for React + dedicated server for FastAPI).

### Part A: Deploy Backend on Render
1. Go to **[dashboard.render.com](https://dashboard.render.com)** → **New +** → **Web Service**.
2. Connect your GitHub repository: `harshchavan009/AI-Project-Generator`.
3. Configure settings:
   - **Name**: `meridian-api`
   - **Language**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `ALLOWED_ORIGINS` = `*`
   - `JWT_SECRET_KEY` = (Click Generate)
   - `PII_ENCRYPTION_KEY` = (Click Generate)
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://meridian-api.onrender.com`).

### Part B: Deploy Frontend on Vercel
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Import `harshchavan009/AI-Project-Generator`.
4. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Click Edit and select `frontend`)
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://meridian-api.onrender.com` (Your Render backend URL from Part A)
6. Click **Deploy**. Vercel will build and assign you a global HTTPS domain (e.g. `https://meridian-app.vercel.app`).

---

## Option 3: Single-Server VPS Deployment (Docker Compose)

If you have a Linux VPS (DigitalOcean Droplet, AWS EC2, GCP Compute Engine, Hetzner):

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshchavan009/AI-Project-Generator.git
   cd AI-Project-Generator
   ```
2. **Start all services**:
   ```bash
   docker compose up -d --build
   ```
3. **Verify status**:
   ```bash
   docker compose ps
   ```
   - Nginx frontend is accessible at port `80` (or `5173`).
   - FastAPI is at port `8000`.
   - PostgreSQL is healthy at `5432`.

---

## Option 4: Instant Temporary Live Public URL (for Testing Right Now)

To share the app immediately without signing up for cloud hosting:

### Using Localtunnel (No installation required with npx):
1. Keep your local servers running:
   - Backend on `http://127.0.0.1:8000`
   - Frontend on `http://localhost:5173`
2. Open a terminal and run:
   ```bash
   npx localtunnel --port 5173
   ```
   Localtunnel generates a public HTTPS URL (e.g., `https://meridian-demo.loca.lt`) accessible from anywhere!
