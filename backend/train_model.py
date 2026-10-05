import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
from pathlib import Path
from backend.config import MODEL_PATH, STATE_DEEP_FOCUS, STATE_ROUTINE_WORK, STATE_IDLE

def generate_synthetic_telemetry(n_samples: int = 3000):
    """
    Generates realistic synthetic telemetry baseline dataset for cognitive state mapping.
    Features:
      - keystrokes_per_min: Typing rate
      - typing_cadence_std: Standard deviation of inter-keystroke intervals (high = erratic, low = smooth flow)
      - mouse_distance_px_min: Total mouse pixels moved per minute
      - app_switches_per_min: Window switching frequency
      - is_focus_app: Binary flag for IDE/Docs (1) vs Social/Comm/Distraction (0)
      - idle_seconds: Seconds without input in window
    """
    np.random.seed(42)
    
    samples_per_state = n_samples // 3
    data = []
    
    # 1. DEEP FOCUS SAMPLES
    for _ in range(samples_per_state):
        keystrokes = np.random.normal(loc=280, scale=60) # 200-350 keystrokes/min
        keystrokes = max(80, keystrokes)
        cadence_std = np.random.uniform(20, 80) # Smooth, rhythmic cadence
        mouse_dist = np.random.normal(loc=1200, scale=400) # Precise mouse moves
        mouse_dist = max(200, mouse_dist)
        app_switches = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1]) # Minimal switching
        is_focus_app = np.random.choice([1, 0], p=[0.92, 0.08])
        idle_secs = np.random.uniform(0, 4)
        
        # Derived Focus & Extraneous Load
        focus_score = min(100, max(65, 85 + (keystrokes/20) - (app_switches * 10) - (idle_secs * 3)))
        extraneous_load = min(100, max(5, 15 + (app_switches * 8)))
        
        data.append({
            "keystrokes_per_min": keystrokes,
            "typing_cadence_std": cadence_std,
            "mouse_distance_px_min": mouse_dist,
            "app_switches_per_min": app_switches,
            "is_focus_app": is_focus_app,
            "idle_seconds": idle_secs,
            "cognitive_state": STATE_DEEP_FOCUS,
            "focus_score": focus_score,
            "extraneous_load": extraneous_load
        })

    # 2. ROUTINE WORK SAMPLES
    for _ in range(samples_per_state):
        keystrokes = np.random.normal(loc=140, scale=50) # 80-200 keystrokes/min
        keystrokes = max(30, keystrokes)
        cadence_std = np.random.uniform(90, 250) # Moderate cadence variance
        mouse_dist = np.random.normal(loc=3500, scale=1200) # High mouse scrolling & clicking
        mouse_dist = max(800, mouse_dist)
        app_switches = np.random.randint(4, 16) # Frequent tab/app jumping
        is_focus_app = np.random.choice([1, 0], p=[0.35, 0.65])
        idle_secs = np.random.uniform(2, 12)
        
        focus_score = min(75, max(30, 45 + (keystrokes/30) - (app_switches * 2)))
        extraneous_load = min(95, max(40, 50 + (app_switches * 3)))
        
        data.append({
            "keystrokes_per_min": keystrokes,
            "typing_cadence_std": cadence_std,
            "mouse_distance_px_min": mouse_dist,
            "app_switches_per_min": app_switches,
            "is_focus_app": is_focus_app,
            "idle_seconds": idle_secs,
            "cognitive_state": STATE_ROUTINE_WORK,
            "focus_score": focus_score,
            "extraneous_load": extraneous_load
        })

    # 3. IDLE / TRANSITIONING SAMPLES
    for _ in range(samples_per_state):
        keystrokes = np.random.normal(loc=10, scale=10) # Minimal typing
        keystrokes = max(0, keystrokes)
        cadence_std = np.random.uniform(300, 800) # Highly erratic or non-existent
        mouse_dist = np.random.normal(loc=200, scale=150)
        mouse_dist = max(0, mouse_dist)
        app_switches = np.random.choice([0, 1], p=[0.9, 0.1])
        is_focus_app = np.random.choice([1, 0], p=[0.5, 0.5])
        idle_secs = np.random.uniform(15, 30)
        
        focus_score = min(35, max(0, 20 - (idle_secs * 0.5)))
        extraneous_load = min(40, max(0, 10 + (idle_secs * 0.2)))
        
        data.append({
            "keystrokes_per_min": keystrokes,
            "typing_cadence_std": cadence_std,
            "mouse_distance_px_min": mouse_dist,
            "app_switches_per_min": app_switches,
            "is_focus_app": is_focus_app,
            "idle_seconds": idle_secs,
            "cognitive_state": STATE_IDLE,
            "focus_score": focus_score,
            "extraneous_load": extraneous_load
        })

    df = pd.DataFrame(data)
    return df


def train_and_save_model():
    print("Generating synthetic baseline behavioral telemetry dataset...")
    df = generate_synthetic_telemetry(n_samples=3600)
    
    feature_cols = [
        "keystrokes_per_min",
        "typing_cadence_std",
        "mouse_distance_px_min",
        "app_switches_per_min",
        "is_focus_app",
        "idle_seconds"
    ]
    
    X = df[feature_cols]
    y = df["cognitive_state"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    print("\nModel Evaluation Metrics:")
    print(classification_report(y_test, y_pred))
    
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"State classification model saved successfully to {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save_model()
