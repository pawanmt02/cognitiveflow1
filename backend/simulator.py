import time
import random
import threading
from typing import Dict, Any, Callable, Optional
from backend.config import STATE_DEEP_FOCUS, STATE_ROUTINE_WORK, STATE_IDLE
from backend.cognitive_engine import classifier_engine

class WorkloadSimulator:
    def __init__(self, callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.callback = callback
        self.mode = "SIM_DEEP_FOCUS" # Default simulation mode
        self.running = False
        self._thread = None
        self.lock = threading.Lock()

    def set_mode(self, mode: str):
        valid_modes = ["REAL", "SIM_DEEP_FOCUS", "SIM_ROUTINE", "SIM_IDLE"]
        if mode in valid_modes:
            with self.lock:
                self.mode = mode
            print(f"[WorkloadSimulator] Mode set to {mode}")
            return True
        return False

    def start(self):
        if self.running:
            return
        self.running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print("[WorkloadSimulator] Simulator loop started.")

    def stop(self):
        self.running = False

    def _generate_telemetry_payload(self) -> Dict[str, Any]:
        with self.lock:
            curr_mode = self.mode

        now = time.time()

        if curr_mode == "SIM_DEEP_FOCUS":
            kpm = random.uniform(240, 360)
            typing_speed_wpm = round(kpm / 5.0, 1)
            cadence_std = random.uniform(20, 55)
            mouse_dist = random.uniform(800, 1600)
            app_switches = random.choice([0, 0, 1])
            active_app = "VSCode"
            active_title = "cognitive_engine.py - Cognitiveflow - Visual Studio Code"
            idle_secs = random.uniform(0.1, 1.5)

        elif curr_mode == "SIM_ROUTINE":
            kpm = random.uniform(70, 160)
            typing_speed_wpm = round(kpm / 5.0, 1)
            cadence_std = random.uniform(90, 240)
            mouse_dist = random.uniform(3500, 7000)
            app_switches = random.randint(4, 9)
            active_app = random.choice(["Slack", "Google Chrome", "Outlook"])
            active_title = random.choice([
                "#engineering - Slack",
                "Inbox (42) - pawan@company.com - Outlook",
                "Stack Overflow - Python FastAPI WebSocket - Google Chrome"
            ])
            idle_secs = random.uniform(2.0, 7.0)

        elif curr_mode == "SIM_IDLE":
            kpm = random.uniform(0, 10)
            typing_speed_wpm = round(kpm / 5.0, 1)
            cadence_std = random.uniform(400, 800)
            mouse_dist = random.uniform(40, 180)
            app_switches = 0
            active_app = "Desktop Environment"
            active_title = "Desktop"
            idle_secs = random.uniform(20.0, 60.0)

        else: # Fallback
            kpm = 120.0
            typing_speed_wpm = 24.0
            cadence_std = 90.0
            mouse_dist = 1200.0
            app_switches = 1
            active_app = "Browser"
            active_title = "Dashboard"
            idle_secs = 4.0

        raw_telemetry = {
            "timestamp": now,
            "keystrokes_count": int(kpm / 15.0),
            "keystrokes_per_min": round(kpm, 1),
            "typing_speed_wpm": typing_speed_wpm,
            "typing_cadence_std": round(cadence_std, 1),
            "mouse_distance": round(mouse_dist / 15.0, 1),
            "mouse_distance_px_min": round(mouse_dist, 1),
            "app_switches": app_switches,
            "app_switches_per_min": app_switches * 15.0,
            "active_app": active_app,
            "active_title": active_title,
            "idle_seconds": round(idle_secs, 1)
        }

        classified = classifier_engine.classify(raw_telemetry)
        return {**raw_telemetry, **classified}

    def _run_loop(self):
        while self.running:
            time.sleep(2.0)
            with self.lock:
                m = self.mode
            if m != "REAL":
                payload = self._generate_telemetry_payload()
                if self.callback:
                    try:
                        self.callback(payload)
                    except Exception as e:
                        print(f"[WorkloadSimulator] Callback error: {e}")
