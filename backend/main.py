import time
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

from backend.config import STATE_DEEP_FOCUS, STATE_ROUTINE_WORK, STATE_IDLE
from backend.database import (
    init_db,
    save_telemetry,
    get_recent_telemetry,
    get_pending_intercepted_notifications,
    get_all_digests,
    get_current_task_context,
    update_task_context,
    get_db_connection
)
from backend.telemetry_daemon import TelemetryDaemon
from backend.simulator import WorkloadSimulator
from backend.notification_proxy import notification_proxy
from backend.auth import (
    create_user,
    authenticate_user,
    get_user_by_email,
    decode_access_token,
    update_user_settings
)

app = FastAPI(
    title="Cognitive Flow-State Orchestrator API",
    description="Local privacy-first desktop agent API with JWT User Auth, telemetry, and intelligent notification interception.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

current_state_payload: Dict[str, Any] = {
    "cognitive_state": STATE_DEEP_FOCUS,
    "focus_score": 88.5,
    "extraneous_load": 12.0,
    "confidence": 0.95,
    "active_app": "VSCode",
    "active_title": "cognitive_engine.py - Cognitiveflow",
    "keystrokes_per_min": 290.0,
    "mouse_distance_px_min": 1200.0,
    "app_switches_per_min": 0.5,
    "timestamp": time.time()
}
simulator_mode = "SIM_DEEP_FOCUS"

def handle_telemetry_event(telemetry: Dict[str, Any]):
    global current_state_payload
    old_state = current_state_payload.get("cognitive_state", STATE_ROUTINE_WORK)
    new_state = telemetry.get("cognitive_state", STATE_ROUTINE_WORK)
    current_state_payload = telemetry
    save_telemetry(telemetry)

    if old_state != new_state:
        print(f"[Orchestrator] State Shift Detected: {old_state} -> {new_state}")
        digest_event = notification_proxy.on_state_change(new_state, old_state)
        if digest_event:
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "DIGEST_CREATED", "data": digest_event}),
                loop
            )

    asyncio.run_coroutine_threadsafe(
        manager.broadcast({"type": "TELEMETRY_UPDATE", "data": telemetry}),
        loop
    )

telemetry_daemon = TelemetryDaemon(callback=handle_telemetry_event)
workload_simulator = WorkloadSimulator(callback=handle_telemetry_event)
loop = None

@app.on_event("startup")
async def startup_event():
    global loop
    loop = asyncio.get_running_loop()
    init_db()
    
    # Seed Demo User if not exists
    if not get_user_by_email("demo@cognitiveflow.ai"):
        try:
            create_user("demo@cognitiveflow.ai", "password123", "Pawan (Lead Dev)")
            print("[Auth] Default Demo User created (demo@cognitiveflow.ai / password123)")
        except Exception:
            pass

    workload_simulator.start()
    telemetry_daemon.start()

@app.on_event("shutdown")
def shutdown_event():
    telemetry_daemon.stop()
    workload_simulator.stop()

# Auth Pydantic Schemas
class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., min_length=6, example="password123")
    full_name: str = Field(..., example="Alex Vance")

class LoginRequest(BaseModel):
    email: str = Field(..., example="demo@cognitiveflow.ai")
    password: str = Field(..., example="password123")

class NotificationRequest(BaseModel):
    sender: str
    title: str
    body: str
    source_app: str = "Slack"

class TaskContextRequest(BaseModel):
    active_task: str
    project_name: str
    key_terms: List[str]

class SimulatorModeRequest(BaseModel):
    mode: str

class UserSettingsRequest(BaseModel):
    focus_threshold: int = 75
    ollama_model: str = "llama3:8b"
    auto_digest: bool = True
    sound_alerts: bool = False

# Auth Routes
@app.post("/api/auth/register")
def register_account(req: RegisterRequest):
    try:
        res = create_user(req.email, req.password, req.full_name)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
def login_account(req: LoginRequest):
    res = authenticate_user(req.email, req.password)
    if not res:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return res

@app.get("/api/auth/me")
def get_current_user_profile(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Expired or invalid token.")
    user = get_user_by_email(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

@app.post("/api/auth/settings")
def save_user_settings(req: UserSettingsRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token.")
    
    settings = req.dict()
    update_user_settings(payload["sub"], settings)
    return {"status": "ok", "settings": settings}

# Main App Routes
@app.get("/api/status")
def get_status():
    task_context = get_current_task_context()
    pending = get_pending_intercepted_notifications()
    return {
        "current_state": current_state_payload,
        "simulator_mode": simulator_mode,
        "active_task_context": task_context,
        "pending_intercepted_count": len(pending)
    }

@app.get("/api/telemetry/recent")
def get_telemetry_history(limit: int = 40):
    return get_recent_telemetry(limit=limit)

@app.post("/api/notifications/incoming")
async def send_incoming_notification(req: NotificationRequest):
    curr_state = current_state_payload.get("cognitive_state", STATE_ROUTINE_WORK)
    result = notification_proxy.process_incoming_notification(
        sender=req.sender,
        title=req.title,
        body=req.body,
        source_app=req.source_app,
        current_state=curr_state
    )
    await manager.broadcast({"type": "NOTIFICATION_RECEIVED", "data": result})
    return result

@app.get("/api/notifications")
def list_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/digests")
def list_digests():
    return get_all_digests(limit=20)

@app.post("/api/task-context")
async def set_task_context(req: TaskContextRequest):
    update_task_context(req.active_task, req.project_name, req.key_terms)
    updated = get_current_task_context()
    await manager.broadcast({"type": "TASK_CONTEXT_UPDATED", "data": updated})
    return updated

@app.post("/api/simulator/mode")
async def set_simulator_mode(req: SimulatorModeRequest):
    global simulator_mode
    success = workload_simulator.set_mode(req.mode)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid simulator mode")
    simulator_mode = req.mode
    await manager.broadcast({"type": "SIMULATOR_MODE_CHANGED", "mode": req.mode})
    return {"status": "ok", "mode": req.mode}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await websocket.send_json({
        "type": "INITIAL_STATE",
        "data": {
            "current_state": current_state_payload,
            "simulator_mode": simulator_mode,
            "task_context": get_current_task_context(),
            "pending_count": len(get_pending_intercepted_notifications())
        }
    })
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
