#!/bin/bash
# ProjectPilot Turnkey Startup Script

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting ProjectPilot: AI Capstone & Engineering Studio "
echo "=========================================================="

# Check Python virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
else
    source .venv/bin/activate
fi

# Start FastAPI Backend in background
echo "Starting FastAPI Backend on http://127.0.0.1:8000..."
PYTHONPATH=. uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Trap Ctrl+C to stop both processes cleanly
trap "echo 'Stopping servers...'; kill $BACKEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

# Start Frontend Dev Server
echo "Starting Frontend on http://127.0.0.1:5173..."
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173

wait $BACKEND_PID
