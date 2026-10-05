import time
import math
import threading
import sys
from typing import Dict, Any, Callable, Optional
from backend.config import TELEMETRY_SAMPLE_INTERVAL_SEC
from backend.cognitive_engine import classifier_engine

# Attempt importing pynput
try:
    from pynput import keyboard, mouse
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False

# Attempt active window detection on Windows / cross-platform
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

if sys.platform == "win32":
    try:
        import win32gui
        import win32process
        WIN32_AVAILABLE = True
    except ImportError:
        WIN32_AVAILABLE = False
else:
    WIN32_AVAILABLE = False


def get_active_window_info() -> Dict[str, str]:
    app_name = "Desktop Environment"
    window_title = "Active Workspace"
    
    if WIN32_AVAILABLE:
        try:
            hwnd = win32gui.GetForegroundWindow()
            if hwnd:
                window_title = win32gui.GetWindowText(hwnd) or "Active Window"
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                if PSUTIL_AVAILABLE and pid:
                    proc = psutil.Process(pid)
                    app_name = proc.name().replace(".exe", "")
        except Exception:
            pass
    elif PSUTIL_AVAILABLE:
        try:
            for proc in psutil.process_iter(['name']):
                if proc.info['name'] in ['code', 'chrome', 'slack', 'cmd', 'powershell', 'idea64']:
                    app_name = proc.info['name']
                    break
        except Exception:
            pass
            
    return {"active_app": app_name, "active_title": window_title}


class TelemetryDaemon:
    def __init__(self, callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.callback = callback
        self.running = False
        self._thread = None
        
        # Telemetry counters for 5-sec window
        self.lock = threading.Lock()
        self.keystrokes_count = 0
        self.keystroke_timestamps = []
        self.mouse_distance = 0.0
        self.last_mouse_pos = None
        self.app_switches = 0
        self.last_active_app = ""
        self.last_input_time = time.time()
        
        self.kb_listener = None
        self.mouse_listener = None

    def start(self):
        if self.running:
            return
        self.running = True

        if PYNPUT_AVAILABLE:
            try:
                self.kb_listener = keyboard.Listener(on_press=self._on_key_press)
                self.mouse_listener = mouse.Listener(on_move=self._on_mouse_move)
                self.kb_listener.start()
                self.mouse_listener.start()
                print("[TelemetryDaemon] pynput listeners attached successfully.")
            except Exception as e:
                print(f"[TelemetryDaemon] Failed to attach pynput listeners: {e}")

        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print("[TelemetryDaemon] Telemetry background thread started.")

    def stop(self):
        self.running = False
        if self.kb_listener:
            try: self.kb_listener.stop()
            except Exception: pass
        if self.mouse_listener:
            try: self.mouse_listener.stop()
            except Exception: pass
        print("[TelemetryDaemon] Telemetry daemon stopped.")

    def _on_key_press(self, key):
        with self.lock:
            now = time.time()
            self.keystrokes_count += 1
            self.keystroke_timestamps.append(now)
            self.last_input_time = now

    def _on_mouse_move(self, x, y):
        with self.lock:
            now = time.time()
            self.last_input_time = now
            if self.last_mouse_pos is not None:
                dx = x - self.last_mouse_pos[0]
                dy = y - self.last_mouse_pos[1]
                dist = math.sqrt(dx*dx + dy*dy)
                self.mouse_distance += dist
            self.last_mouse_pos = (x, y)

    def _run_loop(self):
        while self.running:
            time.sleep(TELEMETRY_SAMPLE_INTERVAL_SEC)
            with self.lock:
                now = time.time()
                win_info = get_active_window_info()
                curr_app = win_info["active_app"]

                if self.last_active_app and curr_app != self.last_active_app:
                    self.app_switches += 1
                self.last_active_app = curr_app

                # Keystrokes normalized to per minute
                kpm = self.keystrokes_count * (60.0 / TELEMETRY_SAMPLE_INTERVAL_SEC)
                typing_speed_wpm = round(kpm / 5.0, 1)

                # Cadence variance
                if len(self.keystroke_timestamps) > 2:
                    diffs = [
                        (self.keystroke_timestamps[i] - self.keystroke_timestamps[i-1]) * 1000
                        for i in range(1, len(self.keystroke_timestamps))
                    ]
                    cadence_std = float(math.sqrt(sum((x - sum(diffs)/len(diffs))**2 for x in diffs) / len(diffs)))
                else:
                    cadence_std = 100.0

                mouse_dist_min = self.mouse_distance * (60.0 / TELEMETRY_SAMPLE_INTERVAL_SEC)
                switches_min = self.app_switches * (60.0 / TELEMETRY_SAMPLE_INTERVAL_SEC)
                idle_secs = now - self.last_input_time

                raw_telemetry = {
                    "timestamp": now,
                    "keystrokes_count": self.keystrokes_count,
                    "keystrokes_per_min": kpm,
                    "typing_speed_wpm": typing_speed_wpm,
                    "typing_cadence_std": cadence_std,
                    "mouse_distance": round(self.mouse_distance, 1),
                    "mouse_distance_px_min": mouse_dist_min,
                    "app_switches": self.app_switches,
                    "app_switches_per_min": switches_min,
                    "active_app": curr_app,
                    "active_title": win_info["active_title"],
                    "idle_seconds": round(idle_secs, 1)
                }

                # Reset interval accumulators
                self.keystrokes_count = 0
                self.keystroke_timestamps = []
                self.mouse_distance = 0.0
                self.app_switches = 0

            # Run state classification engine
            classified = classifier_engine.classify(raw_telemetry)
            combined_payload = {**raw_telemetry, **classified}

            if self.callback:
                try:
                    self.callback(combined_payload)
                except Exception as e:
                    print(f"[TelemetryDaemon] Callback execution error: {e}")
