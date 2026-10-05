import requests

BASE_URL = "http://127.0.0.1:8000"

def test_auth():
    print("Testing Account Registration...")
    reg_payload = {
        "email": "testuser@cognitiveflow.ai",
        "password": "mysecretpassword123",
        "full_name": "Pawan Kumar"
    }
    try:
        res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        print("Registration Response:", res.status_code, res.json())
    except Exception as e:
        print("Registration error:", e)

    print("\nTesting Account Login (Demo User)...")
    login_payload = {
        "email": "demo@cognitiveflow.ai",
        "password": "password123"
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    print("Login Response:", res.status_code, res.json())
    token = res.json().get("token")

    if token:
        print("\nTesting GET /api/auth/me with Bearer token...")
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        print("Profile Response:", res.status_code, res.json())

        print("\nTesting POST /api/auth/settings...")
        settings_payload = {
            "focus_threshold": 80,
            "ollama_model": "llama3:8b",
            "auto_digest": True,
            "sound_alerts": True
        }
        res = requests.post(f"{BASE_URL}/api/auth/settings", json=settings_payload, headers=headers)
        print("Settings Response:", res.status_code, res.json())

if __name__ == "__main__":
    test_auth()
