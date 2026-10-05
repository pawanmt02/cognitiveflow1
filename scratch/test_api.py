import time
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("Testing GET /api/status...")
    res = requests.get(f"{BASE_URL}/api/status")
    print("Status:", res.status_code, res.json())

    print("\nTesting POST /api/notifications/incoming (Urgent)...")
    urgent_notif = {
        "sender": "GitHub Actions",
        "title": "Build Failed",
        "body": "Critical error in FastAPI WebSocket handler on main branch",
        "source_app": "GitHub"
    }
    res = requests.post(f"{BASE_URL}/api/notifications/incoming", json=urgent_notif)
    print("Urgent Notif Response:", res.json())

    print("\nTesting POST /api/notifications/incoming (Routine)...")
    routine_notif = {
        "sender": "Dave (Marketing)",
        "title": "Lunch order",
        "body": "Hey, ordering tacos today at 1 PM.",
        "source_app": "Slack"
    }
    res = requests.post(f"{BASE_URL}/api/notifications/incoming", json=routine_notif)
    print("Routine Notif Response:", res.json())

    print("\nTesting POST /api/simulator/mode (SIM_ROUTINE)...")
    res = requests.post(f"{BASE_URL}/api/simulator/mode", json={"mode": "SIM_ROUTINE"})
    print("Simulator Mode Response:", res.json())

    print("\nTesting GET /api/digests...")
    res = requests.get(f"{BASE_URL}/api/digests")
    print("Digests Count:", len(res.json()))

if __name__ == "__main__":
    test_endpoints()
