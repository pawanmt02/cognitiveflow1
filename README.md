# 🧠 Cognitive Flow-State Orchestrator
> **Local, Privacy-First Desktop Agent for Cognitive Load Telemetry, Flow-State Mapping, and Intelligent Notification Interception.**

[![Hackathon](https://img.shields.io/badge/HackNowa-2026-indigo.svg)](https://unstop.com)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.142-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://reactjs.org)
[![Framer Motion](https://img.shields.io/badge/Framer--Motion-Animated-purple.svg)](https://framer.com/motion)
[![ML](https://img.shields.io/badge/Scikit--Learn-Random%20Forest-orange.svg)](https://scikit-learn.org)

---

## 1. Executive Summary & Problem Statement

Modern knowledge workers operate in a state of **continuous partial attention**. Extraneous cognitive load—caused by constant Slack notifications, context switching, and fragmented email alerts—exhausts working memory and prevents deep focus.

Static "Do Not Disturb" rules are rigid and binary, requiring manual activation and blocking all communication indiscriminately.

**Cognitive Flow-State Orchestrator** replaces static rules with **dynamic behavioral mapping**. It locally tracks real-time keyboard cadence, mouse dynamics, and window switching to classify user focus into three tiers:
1. **DEEP FOCUS**: Suppresses non-urgent notifications; intercepts and queues routine messages.
2. **ROUTINE WORK**: Passes through incoming communications live during multitasking.
3. **IDLE / TRANSITIONING**: Automatically generates a synthesized AI RAG digest summarizing all suppressed messages when focus wanes.

---

## 2. Solution Architecture & Telemetry Pipeline

```mermaid
flowchart TD
    subgraph Sensory_Layer["1. Sensory Input Layer"]
        A1[Keystroke Dynamics & Cadence] --> B
        A2[Mouse Velocity & Movement] --> B
        A3[Active Application & Window Switch] --> B
        B[Local Telemetry Daemon / Simulator]
    end

    subgraph Cognitive_Engine["2. Cognitive Context Engine"]
        B --> C[Sliding Feature Window Extractor]
        C --> D[Scikit-Learn Random Forest Classifier]
        D --> E{Cognitive State Classifier}
        E -->|Focus Score > 75%| F1[DEEP FOCUS]
        E -->|Focus Score 30-75%| F2[ROUTINE WORK]
        E -->|Focus Score < 30%| F3[IDLE / TRANSITION]
    end

    subgraph Notification_Proxy["3. Intelligent RAG Notification Proxy"]
        G[Incoming System / Slack / Email Notif] --> H[RAG Context Matcher]
        H -->|TF-IDF / Key Term Overlap| I{Urgency Evaluation}
        I -->|Urgent / Critical Blocker| J[Deliver Immediately]
        I -->|Routine Item| K{Current State?}
        K -->|DEEP FOCUS| L[Intercept & Suppress to Queue]
        K -->|ROUTINE / IDLE| J
    end

    subgraph Digest_Engine["4. Synthesized AI Digest Engine"]
        F1 -->|Shift to Routine/Idle| M[Trigger Digest Generator]
        L --> M
        M --> N[Local LLM Ollama / RAG Summary]
        N --> O[Deliver Synthesized Batch Digest to Dashboard]
    end

    subgraph Dashboard["5. Executive React Dashboard (Framer Motion)"]
        O --> P[Interactive Animated Glassmorphic Dashboard]
        J --> P
        E --> P
    end
```

---

## 3. Key Technical Components

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Sensory Input Layer** | Python (`pynput`, `psutil`, `win32gui`) | Captures keystroke cadence, mouse pixels/min, and active application titles in 5-second sliding windows. |
| **Cognitive Engine** | Scikit-Learn (Random Forest) | Machine Learning model trained on synthetic baseline behavioral data. Predicts state (`DEEP_FOCUS`, `ROUTINE_WORK`, `IDLE`), `Focus Score` (0-100), and `Extraneous Load` (0-100). |
| **RAG Triage Proxy** | TF-IDF / Scikit-Learn / Ollama | Compares incoming message content against active user task context. Filters urgent blockers from routine noise. |
| **Backend API** | FastAPI + WebSockets | Low-latency REST & WebSocket server for real-time telemetry streaming and state change broadcasting. |
| **Frontend UI** | React 18 + Framer Motion + Recharts | Animated glassmorphic dashboard with dynamic canvas background web, fluid state badges, and spring transitions. |

---

## 4. Quickstart & Installation

```bash
# 1. Activate environment and start backend API daemon
.\.venv\Scripts\activate
python run.py

# 2. Launch React Frontend Dashboard (in /frontend directory)
cd frontend
npm run dev
```

Open your browser to **`http://localhost:3000`** to experience the animated dashboard!
