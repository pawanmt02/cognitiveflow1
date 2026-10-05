import re
from typing import Dict, Any, Tuple, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

URGENT_KEYWORDS = [
    "build failed", "critical error", "prod down", "production issue", "outage",
    "p0", "p1", "security alert", "database failure", "urgent", "immediate action",
    "system panic", "api down", "unhandled exception", "deploy failure", "incident"
]

class RAGContextEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def calculate_relevance_and_urgency(
        self,
        notif_title: str,
        notif_body: str,
        task_context: Dict[str, Any]
    ) -> Tuple[float, bool, str]:
        """
        Evaluates incoming notification against active task context using RAG similarity.
        Returns: (relevance_score [0.0-1.0], is_urgent [bool], urgency_reason [str])
        """
        combined_notif = f"{notif_title} {notif_body}".lower()
        
        # 1. Check direct critical urgency keywords
        for kw in URGENT_KEYWORDS:
            if kw in combined_notif:
                return 1.0, True, f"Matched critical keyword trigger: '{kw}'"

        # 2. Compute TF-IDF Contextual Similarity with Active Task Context
        active_task = task_context.get("active_task", "")
        project_name = task_context.get("project_name", "")
        key_terms = " ".join(task_context.get("key_terms", []))
        
        context_doc = f"{active_task} {project_name} {key_terms}".lower()

        # Check explicit key term overlap
        term_matches = [kt for kt in task_context.get("key_terms", []) if kt.lower() in combined_notif]
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform([context_doc, combined_notif])
            sim_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
        except Exception:
            sim_score = 0.0

        # Boost similarity score if key terms overlap directly
        if term_matches:
            sim_score = min(1.0, sim_score + 0.35 * len(term_matches))

        sim_score = round(sim_score, 2)

        # 3. Urgency rules: High context match + urgent words or direct mention
        if sim_score >= 0.70:
            return sim_score, True, f"High semantic relevance ({sim_score * 100}%) to current task '{active_task[:40]}...'"
        elif sim_score >= 0.45 and any(w in combined_notif for w in ["blocker", "review", "failed", "error", "bug"]):
            return sim_score, True, f"Moderate relevance ({sim_score * 100}%) with task blocker action item"
        else:
            return sim_score, False, f"Low/routine relevance ({sim_score * 100}%) to current focus"

rag_context_engine = RAGContextEngine()
