# ProjectPilot — AI Capstone & Engineering Project Studio

> **Transforming Vague Project Anxiety into an End-to-End Validated Architecture, Sprint-by-Sprint Roadmap, Persistent AI Mentor, and Viva-Ready Defense in Minutes.**

Built to win hackathons with real multi-LLM integration, strict Pydantic JSON validation, interactive SVG architecture topologies, a 6-axis Recharts skill-gap radar, and downloadable academic PDF blueprints.

---

## 🌟 Key Capabilities

1. **Onboarding & Profile Discovery (`/onboarding`)**:
   - 4-step wizard capturing branch, degree, team size, timeline (6–24 weeks), hardware limits (e.g. CPU-only laptop), and comfort levels per skill (beginner / intermediate / advanced).
   - Saved to structured SQLite profile for reuse across sessions.

2. **Grounded AI Idea Engine (`/ideas`)**:
   - Generates 4–6 distinct, publication-grade or production-ready capstone proposals.
   - Grounded in modern 2025/2026 tech stacks (e.g., ONNX Runtime INT8 quantization, TinyML, FastEmbed, TimescaleDB, Graph ML).
   - Side-by-side comparison drawer (Feasibility, Novelty, Effort).
   - Conversational refinement bar ("More IoT-focused", "More research-heavy", "Smaller scope").

3. **Interactive System Topology & Blueprint Studio (`/project/:id`)**:
   - **Interactive Architecture Flowchart**: SVG diagram with protocol cables, animated data flow particles, and clickable node inspector.
   - **Feature Scope**: MVP Must-Haves (Phase 1) vs Stretch Goals (Phase 2 & 3).
   - **Tech Stack**: Layered breakdown sized to student's exact hardware with deep technical justifications.
   - **Sprint Roadmap**: Week-by-week timeline with concrete code deliverables and quantifiable checkpoint metrics.
   - **Viva Voce Defense**: Likely examiner trap questions with rigorous model answers.
   - **Academic PDF Blueprint Export**: Client-side `jsPDF` generating a submission-grade academic spec with university headers and HOD signature blocks.

4. **Persistent AI Technical Guide — Dr. Aris (`/project/:id/mentor`)**:
   - Scoped to active blueprint with persistent memory of stack, architecture, and milestones.
   - Quick prompts: database schema modeling, guide presentations, unit tests, and viva coaching.

5. **6-Axis Skill-Gap Radar (`/project/:id/skills`)**:
   - Dynamic Recharts spider chart comparing student mastery against project demands.
   - Curated links to free official documentation, interactive labs, and GitHub reference repos.

6. **Saved Projects Dashboard (`/dashboard`)**:
   - Switch between capstones, track progress, or launch new discoveries.

---

## 🚀 Quick Start & Running Locally

### 1. Start Both Backend & Frontend (One Command)
```bash
./start.sh
```

Or start them individually:

#### Backend (FastAPI + Python 3.14):
```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies if not already installed
pip install -r backend/requirements.txt

# Run server on port 8000
PYTHONPATH=. uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend (React 19 + TypeScript + Tailwind v4):
```bash
cd frontend
npm install
npm run dev
```
Open **`http://127.0.0.1:5173`** in your browser.

---

## 🔑 LLM Provider Configuration

ProjectPilot supports 4 real LLM providers plus an offline Domain-Aware Fallback Engine:
- **Google Gemini** (Gemini 2.0 Flash) — default via `GEMINI_API_KEY`
- **Anthropic Claude** (Claude 3.5 Sonnet / Haiku) — via `ANTHROPIC_API_KEY`
- **OpenAI** (GPT-4o / GPT-4o-mini) — via `OPENAI_API_KEY`
- **Groq** (Llama 3.3 70B) — via `GROQ_API_KEY`

> [!TIP]
> **In-App Settings**: Click the **Settings icon** in the top navigation bar to choose your preferred model, paste your API key, and test connectivity live with a latency ping.
>
> If no external API key is entered, ProjectPilot runs on its **Local Resilient Fallback Engine**, ensuring the platform never crashes or displays blank screens during unsupervised judge evaluation.

---

## ⚡ 1-Click Hackathon Judge Demo

In the top navbar or on the landing page, click the **"1-Click Demo"** button to simulate pre-calibrated student personas:
1. **Priya Sharma** (AI/ML & Medical Vision — Offline-first chest pathology triage with ONNX INT8)
2. **Rohan Deshmukh** (IoT & Microgrid — Autonomous ESP32 solar telemetry balancing)
3. **Vikram Malhotra** (Cybersecurity & FinTech — Temporal Graph neural fraud detection for UPI)

---

## 🛠 Tech Stack Summary

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, jsPDF
- **Backend**: FastAPI, Uvicorn, Pydantic v2, HTTPX, SQLite Async (`aiosqlite`), Python-dotenv
- **Testing**: In-memory ASGI pipeline verification (`backend/test_backend.py`)
