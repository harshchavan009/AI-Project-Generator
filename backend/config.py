import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present (root or backend)
root_env = Path(__file__).resolve().parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

DEFAULT_PROVIDER = os.getenv("DEFAULT_PROVIDER", "auto") # auto, gemini, anthropic, openai, groq, fallback
DATABASE_PATH = os.getenv("DATABASE_PATH", str(Path(__file__).resolve().parent / "projectpilot.db"))
