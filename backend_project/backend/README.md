# Adaptive Autonomous Decision Intelligence Platform (Backend)
### Track 01 — Artificial Intelligence: Adaptive Autonomous Decision System

A production-grade, modular, and explainable AI-powered REST API backend built with **FastAPI**, **PostgreSQL / SQLAlchemy**, **Scikit-learn**, and **WebSockets**. Designed for reliable autonomous decision-making in complex, uncertain, and rapidly degrading environments.

---

## 1. System Architecture

```
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │               MULTIMODAL INGESTION LAYER                    │
                                  │   (Text / JSON / CSV / Image / Sensor Streams / Events)     │
                                  └──────────────────────────────┬──────────────────────────────┘
                                                                 │
                                                                 ▼
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │            VALIDATION & QUALITY ENGINE                      │
                                  │   • Quality Score (0.0 - 1.0)  • Safe Statistical Imputation│
                                  │   • Missing Data Tracking      • Track 01 Hard Mode Resil.  │
                                  └──────────────────────────────┬──────────────────────────────┘
                                                                 │
                                       ┌─────────────────────────┴─────────────────────────┐
                                       ▼                                                   ▼
                     ┌───────────────────────────────────┐               ┌───────────────────────────────────┐
                     │         PREDICTION ENGINE         │               │     ANOMALY DETECTION ENGINE      │
                     │  (RandomForest / GradientBoost)   │               │   (Isolation Forest + Z-Score)    │
                     └─────────────────┬─────────────────┘               └─────────────────┬─────────────────┘
                                       │                                                   │
                                       └─────────────────────────┬─────────────────────────┘
                                                                 │
                                                                 ▼
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │         MULTI-FACTOR UNCERTAINTY & CONFIDENCE ENGINE        │
                                  │   • Model Probabilities        • Data Quality Metric        │
                                  │   • Anomaly Penalty            • Freshness / Completeness   │
                                  │   • Historical Accuracy        • Reliability Classification │
                                  └──────────────────────────────┬──────────────────────────────┘
                                                                 │
                                                                 ▼
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │               CENTRAL DECISION ENGINE & GUARDRAILS          │
                                  │   • Business Rule Engine       • Autonomous Approver        │
                                  │   • Risk Evaluation (Low-Crit) • Human Review Escalator     │
                                  └──────────────────────────────┬──────────────────────────────┘
                                                                 │
                                   ┌─────────────────────────────┴─────────────────────────────┐
                                   ▼                                                           ▼
                 ┌───────────────────────────────────┐                       ┌───────────────────────────────────┐
                 │       AUTONOMOUS EXECUTION        │                       │      HUMAN-IN-THE-LOOP (HITL)     │
                 │  (Risk: Low/Med, Conf: >= 75%)    │                       │  (Risk: High/Crit or Conf: < 75%) │
                 └─────────────────┬─────────────────┘                       └─────────────────┬─────────────────┘
                                   │                                                           │
                                   │                                                           ▼
                                   │                                         ┌───────────────────────────────────┐
                                   │                                         │      OPERATOR ACTION (APPROVE/    │
                                   │                                         │          REJECT / MODIFY)         │
                                   │                                         └─────────────────┬─────────────────┘
                                   │                                                           │
                                   └─────────────────────────────┬─────────────────────────────┘
                                                                 │
                                                                 ▼
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │          EXPLAINABLE AI & AUDIT TRAIL RECORDING             │
                                  │   • 6-Point Transparent XAI    • Pluggable LLM Narrator     │
                                  │   • Immutable Audit Logs       • WebSocket Real-time PubSub │
                                  └──────────────────────────────┬──────────────────────────────┘
                                                                 │
                                                                 ▼
                                  ┌─────────────────────────────────────────────────────────────┐
                                  │           CONTINUOUS FEEDBACK & ADAPTIVE LEARNING           │
                                  │   • Ground Truth Ingestion     • Override Rate Tracking     │
                                  │   • Background Auto-Retraining • Online Model Versioning    │
                                  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Features & Capabilities

* **Multimodal Ingestion**: Ingests IoT sensor telemetry, unstructured text logs, nested JSON, CSV historical records, real-time discrete events, and images with automatic computer vision feature extraction.
* **Track 01 Hard Mode Resilience**: Capable of sustaining accurate operational recommendations even under **20–30% missing or corrupted data** using automated safe domain imputation and degradation tracking (`/api/data/simulate-degradation`).
* **Deterministic & Pluggable ML Engine**: Pre-calibrated Scikit-learn baseline predictors (`RandomForestClassifier`, `GradientBoostingClassifier`) with feature importance ranking and model versioning.
* **Isolation Forest Anomaly Detection**: Identifies multivariate statistical outliers, computes normalized anomaly scores ($0.0 - 1.0$), determines severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and highlights top deviating features.
* **Multi-Factor Confidence & Uncertainty Estimation**: Calculates epistemic and aleatoric confidence across 6 weighted factors:
  $$\text{Confidence} = w_1 P_{\text{model}} + w_2 Q_{\text{data}} + w_3 (1 - R_{\text{missing}}) + w_4 (1 - S_{\text{anomaly}}) + w_5 F_{\text{freshness}} + w_6 H_{\text{reliability}}$$
* **Safety Guardrails**: Critical-risk decisions and low-confidence predictions are strictly blocked from autonomous execution and automatically routed to human reviewers.
* **6-Point Explainable AI (XAI)**: Generates structured, deterministic root-cause explanations with a pluggable LLM narrative layer (OpenAI / Gemini / Ollama fallback).
* **Human-In-The-Loop (HITL) Workflow**: Pending review queue with operator approval, rejection, and custom action overrides.
* **Continuous Adaptive Learning**: Collects ground-truth feedback, tracks human override rates, computes live performance metrics, and triggers background adaptive retraining.
* **Real-time WebSockets**: Push notifications on `/ws/events` for instant frontend updates.
* **Live Industrial Demo Simulator**: Background simulator generating realistic normal, anomalous, degraded, and critical scenarios.

---

## 3. Technology Stack

* **Language**: Python 3.11+
* **Framework**: FastAPI (ASGI) & Uvicorn
* **Database & ORM**: PostgreSQL 16 / SQLite with SQLAlchemy 2.0
* **Data Validation**: Pydantic v2 & Pydantic-Settings
* **Security & Auth**: JWT (PyJWT), bcrypt password hashing, Role-Based Access Control (RBAC)
* **Machine Learning**: Scikit-learn, NumPy, Pandas, SciPy, Pillow
* **Real-time Protocol**: WebSockets
* **Testing**: Pytest & pytest-asyncio (100% test pass rate)
* **Containerization**: Docker & Docker Compose

---

## 4. Quick Start

### 4.1 Prerequisites
* Python 3.11+ or Anaconda
* Optional: Docker & Docker Compose

### 4.2 Local Installation

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4.3 Running with Docker Compose (PostgreSQL + FastAPI)

```bash
docker-compose up --build
```

---

## 5. Default Credentials & Role-Based Access Control

The database seeds default accounts on first startup:

| Role | Username | Email | Default Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin@decision.ai` | `adminpassword123` | Full system access, retraining, audit trail |
| **HUMAN_REVIEWER** | `reviewer` | `reviewer@decision.ai` | `reviewerpassword123` | Approve, reject, and modify pending decisions |
| **ANALYST** | `analyst` | `analyst@decision.ai` | `analystpassword123` | Ingestion, predictions, performance analytics |
| **VIEWER** | `viewer` | `viewer@decision.ai` | `viewerpassword123` | Read-only dashboard access |

---

## 6. Interactive API Documentation

Once the server is running, open:
* **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Redoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **System Health Check**: [http://localhost:8000/api/dashboard/system-health](http://localhost:8000/api/dashboard/system-health)
* **Real-Time WebSocket**: `ws://localhost:8000/ws/events`

---

## 7. Key REST API Endpoints

### 7.1 Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new account
* `POST /api/auth/login` — Authenticate and receive JWT Bearer token
* `GET /api/auth/me` — Get current user profile
* `POST /api/auth/seed-users` — Seed demo users

### 7.2 Multimodal Data Ingestion (`/api/data`)
* `POST /api/data/sensor` — Ingest IoT sensor stream (temperature, pressure, vibration, energy, humidity)
* `POST /api/data/text` — Ingest log text or operator remarks
* `POST /api/data/json` — Ingest arbitrary JSON telemetry
* `POST /api/data/csv` — Batch ingest historical CSV files
* `POST /api/data/image` — Ingest inspection photos with CV feature extraction
* `POST /api/data/event` — Ingest discrete system events
* `POST /api/data/simulate-degradation` — **Track 01 Hard Mode** missing/corrupted simulation

### 7.3 Predictions & ML (`/api/predict`)
* `POST /api/predict` — Generate state predictions and feature importances

### 7.4 Anomaly Detection (`/api/anomaly`)
* `POST /api/anomaly/detect` — Run Isolation Forest outlier detection
* `GET /api/anomalies` — List historical anomaly detection logs
* `GET /api/anomalies/{id}` — Get single anomaly report

### 7.5 Central Decision Engine (`/api/decision`)
* `POST /api/decision/evaluate` — Evaluate complete autonomous decision pipeline
* `GET /api/decisions` — List historical decision logs
* `GET /api/decisions/{id}` — Get detailed decision with 6-point XAI explanation

### 7.6 Human-in-the-Loop Reviews (`/api/reviews`)
* `GET /api/reviews/pending` — List pending reviews awaiting human approval
* `POST /api/reviews/{id}/approve` — Operator approves recommendation
* `POST /api/reviews/{id}/reject` — Operator overrides/rejects recommendation
* `POST /api/reviews/{id}/modify` — Operator modifies recommended action

### 7.7 Feedback & Model Adaptation (`/api/feedback` & `/api/model`)
* `POST /api/feedback` — Submit ground-truth outcome
* `GET /api/model/performance` — Live accuracy, FPR, FNR, override rate
* `POST /api/model/retrain` — Background model retraining

### 7.8 Dashboard Analytics (`/api/dashboard`)
* `GET /api/dashboard/overview` — High-level KPI aggregations
* `GET /api/dashboard/recent-decisions` — Latest decision feed
* `GET /api/dashboard/recent-anomalies` — Latest anomaly feed
* `GET /api/dashboard/system-health` — Uptime, DB status, active models

### 7.9 Decision Audit Trail (`/api/audit`)
* `GET /api/audit/{decision_id}` — Trace full chronological decision lifecycle
* `GET /api/audit/logs` — Query system-wide audit records

### 7.10 Live Demo Simulator (`/api/demo`)
* `POST /api/demo/start` — Start automated background simulation
* `POST /api/demo/stop` — Stop simulation
* `GET /api/demo/status` — Live simulation metrics
* `POST /api/demo/trigger-step` — Manually trigger specific scenario (`NORMAL_EVENT`, `ANOMALOUS_EVENT`, `MISSING_DATA_EVENT`, `CORRUPTED_DATA_EVENT`, `HIGH_RISK_EVENT`, `LOW_CONFIDENCE_EVENT`)

---

## 8. Running Automated Tests

Run the complete test suite:

```bash
pytest tests/ -v
```

Output:
```
tests/test_anomalies.py::test_anomaly_detect_nominal PASSED              [  4%]
tests/test_anomalies.py::test_anomaly_detect_spike PASSED                [  8%]
tests/test_anomalies.py::test_query_anomalies PASSED                     [ 12%]
tests/test_auth.py::test_register_and_login PASSED                       [ 16%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 20%]
tests/test_auth.py::test_register_duplicate_user PASSED                  [ 24%]
tests/test_confidence.py::test_confidence_calculation_nominal PASSED     [ 28%]
tests/test_confidence.py::test_confidence_calculation_degraded PASSED    [ 32%]
tests/test_dashboard.py::test_dashboard_overview_and_health PASSED       [ 36%]
tests/test_decision_engine.py::test_decision_evaluate_nominal_autonomous PASSED [ 40%]
tests/test_decision_engine.py::test_decision_evaluate_critical_risk_escalation PASSED [ 44%]
tests/test_decision_engine.py::test_decision_evaluate_force_human_review PASSED [ 48%]
tests/test_e2e_pipeline.py::test_full_end_to_end_decision_intelligence_pipeline PASSED [ 52%]
tests/test_feedback.py::test_feedback_and_performance PASSED             [ 56%]
tests/test_human_review.py::test_human_review_workflow PASSED            [ 60%]
tests/test_human_review.py::test_human_review_modify PASSED              [ 64%]
tests/test_ingestion.py::test_ingest_sensor_nominal PASSED               [ 68%]
tests/test_ingestion.py::test_ingest_sensor_with_missing_and_out_of_bounds PASSED [ 72%]
tests/test_ingestion.py::test_ingest_text PASSED                         [ 76%]
tests/test_ingestion.py::test_ingest_json PASSED                         [ 80%]
tests/test_ingestion.py::test_ingest_csv PASSED                          [ 84%]
tests/test_ingestion.py::test_ingest_image PASSED                        [ 88%]
tests/test_ingestion.py::test_simulate_degradation_track01_hard_mode PASSED [ 92%]
tests/test_predictions.py::test_predict_nominal PASSED                   [ 96%]
tests/test_predictions.py::test_predict_critical_condition PASSED        [100%]

======================== 25 passed in 2.90s ========================
```

---

## 9. Environment Variables Reference (`.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./decision_system.db` | PostgreSQL or SQLite connection URI |
| `SECRET_KEY` | `antigravity-super-secret-key...` | JWT encryption secret |
| `CONFIDENCE_THRESHOLD_AUTONOMOUS` | `0.75` | Minimum confidence score for autonomous execution |
| `CONFIDENCE_THRESHOLD_ESCALATION` | `0.50` | Escalation threshold |
| `ANOMALY_CONTAMINATION` | `0.10` | Isolation Forest contamination parameter |
| `LLM_PROVIDER` | `none` | Optional LLM provider (`openai`, `gemini`, `ollama`, `none`) |
| `LLM_API_KEY` | `""` | Optional API key for LLM natural language explanations |
| `SIMULATION_INTERVAL_SECONDS` | `4` | Simulation event generation cadence |
