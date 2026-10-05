import os
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from backend.config import (
    MODEL_PATH,
    STATE_DEEP_FOCUS,
    STATE_ROUTINE_WORK,
    STATE_IDLE
)

FOCUS_APP_KEYWORDS = [
    "code", "vscode", "pycharm", "intellij", "sublime", "vim", "nvim",
    "cursor", "terminal", "powershell", "cmd", "bash", "zsh", "git",
    "notion", "obsidian", "word", "overleaf", "latex", "jupyter", "colab", "figma"
]

ROUTINE_APP_KEYWORDS = [
    "slack", "teams", "discord", "chrome", "firefox", "edge", "browser",
    "outlook", "gmail", "mail", "zoom", "meet", "whatsapp", "telegram"
]

class CognitiveStateClassifier:
    def __init__(self):
        self.model = None
        self._load_or_train_model()

    def _load_or_train_model(self):
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                print(f"[CognitiveEngine] Model loaded from {MODEL_PATH}")
            except Exception as e:
                print(f"[CognitiveEngine] Failed to load model artifact: {e}, re-training...")
                self._train_fallback()
        else:
            print("[CognitiveEngine] Model artifact not found. Training baseline model...")
            self._train_fallback()

    def _train_fallback(self):
        from backend.train_model import train_and_save_model
        train_and_save_model()
        if MODEL_PATH.exists():
            self.model = joblib.load(MODEL_PATH)

    def is_focus_application(self, app_name: str, window_title: str) -> int:
        combined = f"{app_name} {window_title}".lower()
        if any(kw in combined for kw in FOCUS_APP_KEYWORDS):
            return 1
        return 0

    def compute_heuristic_scores(self, features: Dict[str, Any]) -> Tuple[float, float]:
        """
        Computes calibrated Focus Score (0-100) and Extraneous Load Score (0-100).
        """
        kpm = features.get("keystrokes_per_min", 0.0)
        mouse_dist = features.get("mouse_distance_px_min", 0.0)
        app_switches = features.get("app_switches_per_min", 0.0)
        is_focus_app = features.get("is_focus_app", 1)
        idle_secs = features.get("idle_seconds", 0.0)

        # Baseline calculation
        if idle_secs >= 20:
            focus_score = max(0.0, 25.0 - (idle_secs * 0.5))
            extraneous_load = max(0.0, 10.0 + (idle_secs * 0.2))
        else:
            # Focus score reward high rhythmic typing and focus apps
            typing_contrib = min(50.0, (kpm / 250.0) * 50.0)
            app_contrib = 30.0 if is_focus_app == 1 else 10.0
            mouse_penalty = min(20.0, (mouse_dist / 10000.0) * 20.0) if is_focus_app == 0 else min(5.0, (mouse_dist / 15000.0) * 5.0)
            switch_penalty = min(35.0, app_switches * 5.0)

            focus_score = max(0.0, min(100.0, 20.0 + typing_contrib + app_contrib - switch_penalty - mouse_penalty))
            
            # Extraneous load increases with rapid context switching and non-focus apps
            switch_load = min(50.0, app_switches * 6.5)
            app_load = 25.0 if is_focus_app == 0 else 5.0
            mouse_erratic_load = min(25.0, (mouse_dist / 8000.0) * 25.0)
            extraneous_load = max(0.0, min(100.0, switch_load + app_load + mouse_erratic_load))

        return round(focus_score, 1), round(extraneous_load, 1)

    def classify(self, raw_telemetry: Dict[str, Any]) -> Dict[str, Any]:
        app_name = raw_telemetry.get("active_app", "")
        title = raw_telemetry.get("active_title", "")
        is_focus = self.is_focus_application(app_name, title)

        features = [
            float(raw_telemetry.get("keystrokes_per_min", 0.0)),
            float(raw_telemetry.get("typing_cadence_std", 50.0)),
            float(raw_telemetry.get("mouse_distance_px_min", 0.0)),
            float(raw_telemetry.get("app_switches_per_min", 0.0)),
            is_focus,
            float(raw_telemetry.get("idle_seconds", 0.0))
        ]

        feat_dict = {
            "keystrokes_per_min": features[0],
            "typing_cadence_std": features[1],
            "mouse_distance_px_min": features[2],
            "app_switches_per_min": features[3],
            "is_focus_app": is_focus,
            "idle_seconds": features[5]
        }

        # Predict ML state
        if self.model:
            X = np.array([features])
            pred_state = self.model.predict(X)[0]
            probs = self.model.predict_proba(X)[0]
            classes = self.model.classes_
            prob_dict = {c: round(float(p), 3) for c, p in zip(classes, probs)}
            confidence = float(np.max(probs))
        else:
            # Heuristic fallback
            if feat_dict["idle_seconds"] >= 20:
                pred_state = STATE_IDLE
            elif feat_dict["keystrokes_per_min"] >= 180 and feat_dict["app_switches_per_min"] <= 3 and is_focus:
                pred_state = STATE_DEEP_FOCUS
            else:
                pred_state = STATE_ROUTINE_WORK
            prob_dict = {pred_state: 1.0}
            confidence = 1.0

        focus_score, extraneous_load = self.compute_heuristic_scores(feat_dict)

        return {
            "cognitive_state": pred_state,
            "focus_score": focus_score,
            "extraneous_load": extraneous_load,
            "confidence": round(confidence, 2),
            "state_probabilities": prob_dict,
            "features": feat_dict
        }

# Global singleton
classifier_engine = CognitiveStateClassifier()
