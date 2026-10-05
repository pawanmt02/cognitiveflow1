import time
import json
import jwt
import hashlib
from typing import Dict, Any, Optional
from passlib.context import CryptContext
from backend.database import get_db_connection

SECRET_KEY = "cognitiveflow_secret_key_change_in_production"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback PBKDF2 hash
        return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'salt_cognitive', 100000).hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        pbkdf2 = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), b'salt_cognitive', 100000).hex()
        return pbkdf2 == hashed_password

def create_access_token(data: dict, expires_delta: int = 86400 * 7) -> str:
    to_encode = data.copy()
    expire = time.time() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def create_user(email: str, password: str, full_name: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    hashed = hash_password(password)
    now = time.time()
    default_settings = {
        "focus_threshold": 75,
        "ollama_model": "llama3:8b",
        "auto_digest": True,
        "sound_alerts": False
    }

    try:
        cursor.execute(
            "INSERT INTO users (email, hashed_password, full_name, created_at, settings_json) VALUES (?, ?, ?, ?, ?);",
            (email.lower(), hashed, full_name, now, json.dumps(default_settings))
        )
        user_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        raise ValueError(f"User with email '{email}' already exists or invalid data.")

    conn.close()

    token = create_access_token({"sub": email.lower(), "user_id": user_id})
    return {
        "user_id": user_id,
        "email": email.lower(),
        "full_name": full_name,
        "token": token,
        "settings": default_settings
    }

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?;", (email.lower(),))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    user = dict(row)
    if not verify_password(password, user["hashed_password"]):
        return None

    token = create_access_token({"sub": user["email"], "user_id": user["id"]})
    settings = json.loads(user["settings_json"]) if user.get("settings_json") else {}

    return {
        "user_id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "token": token,
        "settings": settings
    }

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?;", (email.lower(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        u = dict(row)
        u.pop("hashed_password", None)
        u["settings"] = json.loads(u["settings_json"]) if u.get("settings_json") else {}
        return u
    return None

def update_user_settings(email: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET settings_json = ? WHERE email = ?;",
        (json.dumps(settings), email.lower())
    )
    conn.commit()
    conn.close()
    return settings
