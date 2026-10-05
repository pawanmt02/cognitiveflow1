import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

def main():
    print("=" * 70)
    print("🧠 Cognitive Flow-State Orchestrator — Unified Launcher")
    print("=" * 70)
    
    # 1. Ensure Python dependencies & database setup
    from backend.database import init_db
    from backend.config import MODEL_PATH
    
    print("[1/3] Initializing local SQLite database...")
    init_db()
    
    if not MODEL_PATH.exists():
        print("[2/3] Baseline ML model not found. Training Random Forest classifier...")
        from backend.train_model import train_and_save_model
        train_and_save_model()
    else:
        print("[2/3] ML cognitive model found ready.")

    print("[3/3] Starting backend FastAPI service on http://127.0.0.1:8000 ...")
    
    # Launch uvicorn server
    cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    
    print("\n🚀 System active!")
    print("  • Backend API & WebSockets: http://127.0.0.1:8000")
    print("  • Swagger OpenAPI Specs:   http://127.0.0.1:8000/docs")
    print("  • Frontend Dashboard:      http://localhost:3000 (run 'npm run dev' in /frontend directory)")
    print("\nPress Ctrl+C to terminate server.\n")

    subprocess.run(cmd, cwd=str(BASE_DIR))

if __name__ == "__main__":
    main()
