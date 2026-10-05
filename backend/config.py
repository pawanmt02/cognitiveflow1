import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# SQLite Database
DB_PATH = DATA_DIR / "cognitive_flow.db"

# ML Model artifact path
MODEL_PATH = DATA_DIR / "cognitive_model.joblib"

# Telemetry Sampling Settings
TELEMETRY_SAMPLE_INTERVAL_SEC = 5.0
FEATURE_WINDOW_SIZE_SEC = 30.0

# State Constants
STATE_DEEP_FOCUS = "DEEP_FOCUS"
STATE_ROUTINE_WORK = "ROUTINE_WORK"
STATE_IDLE = "IDLE"

# Local LLM / Ollama settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b")
USE_LOCAL_LLM = os.getenv("USE_LOCAL_LLM", "true").lower() == "true"

# Default Task Context
DEFAULT_TASK_CONTEXT = {
    "active_task": "Developing Cognitive Flow-State Orchestrator backend architecture and RAG triage engine",
    "project_name": "Cognitive Flow-State Orchestrator",
    "key_terms": ["FastAPI", "pynput", "scikit-learn", "RAG", "notification interception", "cognitive load", "flow state"]
}
