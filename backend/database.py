import sqlite3
import json
import time
from typing import List, Dict, Any, Optional
from backend.config import DB_PATH, DEFAULT_TASK_CONTEXT

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        created_at REAL NOT NULL,
        settings_json TEXT
    );
    """)

    # Telemetry table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL NOT NULL,
        keystrokes_count INTEGER DEFAULT 0,
        typing_speed_wpm REAL DEFAULT 0.0,
        mouse_distance REAL DEFAULT 0.0,
        app_switches INTEGER DEFAULT 0,
        active_app TEXT,
        active_title TEXT,
        cognitive_state TEXT,
        focus_score REAL DEFAULT 0.0,
        extraneous_load REAL DEFAULT 0.0,
        confidence REAL DEFAULT 1.0
    );
    """)

    # Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        timestamp REAL NOT NULL,
        source_app TEXT DEFAULT 'System',
        is_urgent INTEGER DEFAULT 0,
        urgency_reason TEXT,
        relevance_score REAL DEFAULT 0.0,
        is_intercepted INTEGER DEFAULT 0,
        is_delivered INTEGER DEFAULT 0,
        delivered_at REAL,
        digest_id INTEGER
    );
    """)

    # Synthesized Digests table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notification_digests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL NOT NULL,
        trigger_state TEXT NOT NULL,
        summary TEXT NOT NULL,
        notification_count INTEGER DEFAULT 0,
        notification_ids_json TEXT
    );
    """)

    # Active Task Context table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS task_context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active_task TEXT NOT NULL,
        project_name TEXT NOT NULL,
        key_terms_json TEXT NOT NULL,
        updated_at REAL NOT NULL
    );
    """)

    conn.commit()

    # Seed initial task context if empty
    cursor.execute("SELECT COUNT(*) FROM task_context;")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO task_context (active_task, project_name, key_terms_json, updated_at) VALUES (?, ?, ?, ?);",
            (
                DEFAULT_TASK_CONTEXT["active_task"],
                DEFAULT_TASK_CONTEXT["project_name"],
                json.dumps(DEFAULT_TASK_CONTEXT["key_terms"]),
                time.time()
            )
        )
        conn.commit()

    conn.close()


def save_telemetry(data: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO telemetry_logs (
        timestamp, keystrokes_count, typing_speed_wpm, mouse_distance,
        app_switches, active_app, active_title, cognitive_state,
        focus_score, extraneous_load, confidence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        data.get("timestamp", time.time()),
        data.get("keystrokes_count", 0),
        data.get("typing_speed_wpm", 0.0),
        data.get("mouse_distance", 0.0),
        data.get("app_switches", 0),
        data.get("active_app", "Unknown"),
        data.get("active_title", ""),
        data.get("cognitive_state", "ROUTINE_WORK"),
        data.get("focus_score", 50.0),
        data.get("extraneous_load", 30.0),
        data.get("confidence", 1.0)
    ))
    conn.commit()
    conn.close()


def get_recent_telemetry(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry_logs ORDER BY timestamp DESC LIMIT ?;", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]


def save_notification(notif: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO notifications (
        sender, title, body, timestamp, source_app, is_urgent,
        urgency_reason, relevance_score, is_intercepted, is_delivered
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        notif["sender"],
        notif["title"],
        notif["body"],
        notif.get("timestamp", time.time()),
        notif.get("source_app", "System"),
        1 if notif.get("is_urgent", False) else 0,
        notif.get("urgency_reason", ""),
        notif.get("relevance_score", 0.0),
        1 if notif.get("is_intercepted", False) else 0,
        1 if notif.get("is_delivered", False) else 0
    ))
    notif_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return notif_id


def get_pending_intercepted_notifications() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM notifications
    WHERE is_intercepted = 1 AND is_delivered = 0
    ORDER BY timestamp ASC;
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_notifications_delivered(ids: List[int], digest_id: int):
    if not ids:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    now = time.time()
    cursor.executemany("""
    UPDATE notifications
    SET is_delivered = 1, delivered_at = ?, digest_id = ?
    WHERE id = ?;
    """, [(now, digest_id, nid) for nid in ids])
    conn.commit()
    conn.close()


def save_digest(summary: str, trigger_state: str, notification_ids: List[int]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO notification_digests (
        timestamp, trigger_state, summary, notification_count, notification_ids_json
    ) VALUES (?, ?, ?, ?, ?);
    """, (
        time.time(),
        trigger_state,
        summary,
        len(notification_ids),
        json.dumps(notification_ids)
    ))
    digest_id = cursor.lastrowid
    conn.commit()
    conn.close()

    mark_notifications_delivered(notification_ids, digest_id)
    return digest_id


def get_all_digests(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notification_digests ORDER BY timestamp DESC LIMIT ?;", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_current_task_context() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM task_context ORDER BY updated_at DESC LIMIT 1;")
    row = cursor.fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["key_terms"] = json.loads(res["key_terms_json"])
        return res
    return DEFAULT_TASK_CONTEXT


def update_task_context(active_task: str, project_name: str, key_terms: List[str]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO task_context (active_task, project_name, key_terms_json, updated_at)
    VALUES (?, ?, ?, ?);
    """, (active_task, project_name, json.dumps(key_terms), time.time()))
    conn.commit()
    conn.close()
