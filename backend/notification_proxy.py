import time
import httpx
import json
from typing import Dict, Any, List, Optional
from backend.config import OLLAMA_BASE_URL, OLLAMA_MODEL, USE_LOCAL_LLM, STATE_DEEP_FOCUS, STATE_ROUTINE_WORK, STATE_IDLE
from backend.database import (
    get_current_task_context,
    save_notification,
    get_pending_intercepted_notifications,
    save_digest
)
from backend.rag_store import rag_context_engine

def query_local_ollama_summary(prompt: str) -> Optional[str]:
    if not USE_LOCAL_LLM:
        return None
    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=3.0
        )
        if response.status_code == 200:
            res_json = response.json()
            return res_json.get("response", "").strip()
    except Exception:
        pass
    return None


class IntelligentNotificationProxy:
    def __init__(self):
        self.last_cognitive_state = STATE_ROUTINE_WORK

    def process_incoming_notification(
        self,
        sender: str,
        title: str,
        body: str,
        source_app: str = "Slack",
        current_state: str = STATE_ROUTINE_WORK
    ) -> Dict[str, Any]:
        task_context = get_current_task_context()
        
        # Calculate RAG relevance score & urgency
        relevance_score, is_urgent, urgency_reason = rag_context_engine.calculate_relevance_and_urgency(
            title, body, task_context
        )

        # Decide interception behavior based on Cognitive State
        # In DEEP_FOCUS, suppress non-urgent notifications.
        # In ROUTINE_WORK or IDLE, or if urgent, pass through.
        if current_state == STATE_DEEP_FOCUS and not is_urgent:
            is_intercepted = True
            is_delivered = False
            status_text = "INTERCEPTED & SUPPRESSED (User in Deep Focus)"
        else:
            is_intercepted = False
            is_delivered = True
            status_text = "DELIVERED IMMEDIATELY (Urgent message or User in Routine/Idle state)"

        notif_record = {
            "sender": sender,
            "title": title,
            "body": body,
            "source_app": source_app,
            "timestamp": time.time(),
            "is_urgent": is_urgent,
            "urgency_reason": urgency_reason,
            "relevance_score": relevance_score,
            "is_intercepted": is_intercepted,
            "is_delivered": is_delivered
        }

        notif_id = save_notification(notif_record)
        notif_record["id"] = notif_id
        notif_record["status_text"] = status_text

        print(f"[NotificationProxy] Notif #{notif_id} from {sender}: {status_text}")
        return notif_record

    def generate_digest_summary(self, pending_notifs: List[Dict[str, Any]]) -> str:
        if not pending_notifs:
            return "No intercepted notifications to summarize."

        count = len(pending_notifs)
        bullet_items = [f"- [{n['source_app']}] {n['sender']}: {n['title']} - {n['body']}" for n in pending_notifs]
        joined_items = "\n".join(bullet_items)

        # Try Local LLM Ollama call
        prompt = (
            f"Synthesize a concise 2-3 sentence executive digest for a knowledge worker transitioning out of deep focus.\n"
            f"Here are the {count} intercepted notifications:\n{joined_items}\n\n"
            f"Provide a clear, actionable summary grouping related items."
        )
        
        llm_summary = query_local_ollama_summary(prompt)
        if llm_summary:
            return f"🤖 AI Executive Digest ({count} intercepted items):\n{llm_summary}"

        # Fallback RAG Smart Digest generator
        by_app = {}
        for n in pending_notifs:
            app = n.get("source_app", "Messages")
            by_app.setdefault(app, []).append(n)

        summary_lines = [f"📊 Focus Transition Digest — {count} notifications intercepted during Deep Focus:"]
        for app, items in by_app.items():
            summary_lines.append(f"• {app} ({len(items)} items):")
            for item in items[:3]:
                summary_lines.append(f"   - {item['sender']}: {item['title']} ({item['body'][:60]}...)")
            if len(items) > 3:
                summary_lines.append(f"   - ... and {len(items)-3} more from {app}")

        summary_lines.append("\n💡 Context Status: You are now free to review these routine items without breaking deep focus cadence.")
        return "\n".join(summary_lines)

    def on_state_change(self, new_state: str, old_state: str) -> Optional[Dict[str, Any]]:
        """
        Triggered when user cognitive state changes.
        If transitioning from DEEP_FOCUS -> ROUTINE_WORK or IDLE, compile and deliver digest.
        """
        self.last_cognitive_state = new_state
        
        if old_state == STATE_DEEP_FOCUS and new_state in [STATE_ROUTINE_WORK, STATE_IDLE]:
            pending = get_pending_intercepted_notifications()
            if pending:
                print(f"[NotificationProxy] State shift {old_state} -> {new_state}. Synthesizing digest for {len(pending)} suppressed items...")
                summary = self.generate_digest_summary(pending)
                notif_ids = [n["id"] for n in pending]
                digest_id = save_digest(summary, new_state, notif_ids)
                
                return {
                    "digest_id": digest_id,
                    "trigger_state": new_state,
                    "notification_count": len(pending),
                    "summary": summary,
                    "timestamp": time.time()
                }
        return None

notification_proxy = IntelligentNotificationProxy()
