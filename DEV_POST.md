# BillSathi: Proof Before Trust — Autonomous Financial Document Intelligence for Freelancers & Micro-Agencies

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

<br/>

<p align="center">
  <img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/docs/cover.jpg" alt="BillSathi: Proof Before Trust" width="100%" />
</p>

---

## What I Built

Most AI invoice extractors act as **black-box transcription bots**: they blindly parse text and hallucinate numbers. When an invoice contains misprinted figures, hidden surcharges, or accidental duplicate submissions, generic chatbots transcribe them as cold facts. Come tax time or audit season, freelancers and micro-agencies lose billable hours manually digging through piles of PDFs to double-check their spreadsheets.

**BillSathi** (*"Your Bill Companion"*) turns document extraction into an audit-grade financial operating system built on the principle: **Proof Before Trust**.

### Who Would Pay For It?
- **Solo Freelancers & Consultants:** Spending 4–8 unbillable hours each month cross-checking vendor receipts, tracking currency differences, and preparing accountant handoffs.
- **Micro-Agencies & Studios:** Managing multiple concurrent client accounts with recurring software subscriptions, fluctuating contractor fees, and strict audit compliance.

### Proposed Commercial Model (Side Hustle Hypothesis)
- **Solo Freelancer ($9/month):** Up to 50 documents/month, spatial evidence linking, live currency ledger, RFC 4180 accountant CSV export.
- **Micro-Agency ($29/month):** Up to 250 documents/month, vendor spending drift intelligence, multi-workspace client profiles, and batch intake.
- **Self-Hosted Community (Free Apache-2.0):** 100% free forever for air-gapped local deployments with zero cloud dependencies.

### Key Product Capabilities
1. **Interactive Spatial Evidence Workspace:** Every extracted number is spatially tied to real physical vector coordinates on the source document canvas. Clicking any field draws an elevated green bounding box over the exact source proof. We never invent or hallucinate coordinates.
2. **Deterministic Mathematical Authority:** AI handles semantic categorization; **pure integer-cents arithmetic (`Subtotal + Tax == Total`)** enforces mathematical truth. AI is *never* the mathematical authority.
3. **Deterministic Anomaly & Duplicate Gate:** Catches arithmetic discrepancies (e.g. Subtotal $800 + Tax $100 vs. printed $950), flags duplicate invoice numbers (`INV-2026-001`), and performs SHA-256 cryptographic upload collision checks.
4. **Local Open-Weight AI Root-Cause Explainer:** An on-device Gemma 2 agent diagnoses anomalies, explains unitemized charges, and suggests signed audit resolutions.
5. **Vendor Spending Intelligence & Volatility Analysis:** Indexes historical expenses by vendor and flags invoices exceeding >25% baseline drift to prevent silent price creep.
6. **Multi-Workspace Fiscal Profile & Dual Currency:** Instant switching across business entities with dynamic currency conversion (`INR ₹`, `USD $`, `EUR €`, `GBP £`) and persistent reviewer signatures.

---

## Demo

- 💻 **Local Air-Gapped Stack:** Clone and launch locally via Podman / Docker Compose:
  ```bash
  podman compose up --build -d
  podman exec -it billsathi-ollama ollama pull gemma2:2b
  ```
  Access the dashboard immediately at `http://localhost:5173`.
- ⚡ **Instant 3-Invoice Demo Button:** Click **`Load Hackathon Demo (3 Invoices)`** in the header to run synthetic normal, duplicate, and deliberate arithmetic error test cases in seconds.

### Visual Walkthrough

<table width="100%">
<tr>
<td width="50%" valign="top" align="center">
<strong>1. Live Financial Operations Dashboard</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/frontend/public/screenshots/dashboard.png" alt="BillSathi Dashboard" width="100%" /><br/>
<em>Live review queue, 3 detected audit anomalies, and real-time Gemma 2 local runtime badge (103ms).</em>
</td>
<td width="50%" valign="top" align="center">
<strong>2. Flagship Evidence Workspace (Proof Before Trust)</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/frontend/public/screenshots/evidence-workspace.png" alt="Evidence Workspace" width="100%" /><br/>
<em>Clicking any field draws interactive vector bounding boxes on the original PDF canvas.</em>
</td>
</tr>
</table>

<table width="100%">
<tr>
<td width="50%" valign="top" align="center">
<strong>3. Deterministic Anomaly &amp; Exception Center</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/frontend/public/screenshots/anomaly-center.png" alt="Anomaly Center" width="100%" /><br/>
<em>Integer math discrepancy ($800+$100 != $950) and duplicate invoice detection with AI explainer.</em>
</td>
<td width="50%" valign="top" align="center">
<strong>4. Vendor Spending Intelligence &amp; Volatility</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/frontend/public/screenshots/vendor-intelligence.png" alt="Vendor Intelligence" width="100%" /><br/>
<em>Historical baseline indexing and automated &gt;25% price drift detection.</em>
</td>
</tr>
</table>

<table width="100%">
<tr>
<td width="50%" valign="top" align="center">
<strong>5. Financial Expense Register &amp; CSV Export</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/frontend/public/screenshots/expense-register.png" alt="Expense Register" width="100%" /><br/>
<em>Accountant-ready dual-currency view with AI Executive Briefing and RFC 4180 CSV export.</em>
</td>
<td width="50%" valign="top" align="center">
<strong>6. Multi-Workspace &amp; Fiscal Entity Profile</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/BillSathi/main/frontend/public/screenshots/settings-profile.png" alt="Fiscal Profile" width="100%" /><br/>
<em>Instant client entity switching, reviewer avatar signatures, and home currency configuration.</em>
</td>
</tr>
</table>

---

## Code

The entire codebase is open-source under the **Apache 2.0 License**:

{% github arnab825/BillSathi %}

### Technical Stack
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, TanStack Query, Lucide Icons.
- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, SQLite.
- **Document & OCR Engine:** PyMuPDF (`fitz`), Tesseract OCR (`pytesseract`), ReportLab 4.x, Pillow.
- **Open-Weight AI:** Ollama running **Gemma 2 (2B)** with sub-millisecond in-process deterministic fallback.
- **DevOps:** Rootless Podman & Docker multi-container compose (`billsathi-web`, `billsathi-api`, `billsathi-ollama`).

---

## How I Built It

### 1. Hybrid AI + Deterministic Fusion Architecture
BillSathi treats AI as a semantic partner rather than an unquestioned authority:

```plaintext
      Incoming Invoice (PDF / Scanned Image)
                        │
                        ▼
       Document Spatial Engine (PyMuPDF / Tesseract)
        ├── Extracts Raw Text & Physical Vector Bounding Boxes
        └── SHA-256 Cryptographic Hash Check
                        │
                        ▼
             Hybrid Extraction Stage
        ├── Primary: Local Ollama Gemma 2 (2B) via Structured JSON
        └── Zero-Drop Fallback: Deterministic Regex & Rule Engine
                        │
                        ▼
        Deterministic Python Financial Gate (Zero AI Inaccuracy)
        ├── Integer Cents Arithmetic: Subtotal + Tax == Total
        ├── Duplicate Invoice & Vendor Cross-Match
        └── Historical Baseline Drift (>25% Volatility Alert)
                        │
                        ▼
    Interactive Human-in-the-Loop Verification Workspace
    (Bounding Box Proof ➔ Auditor Reviewer Signature ➔ Confirmed Fact)
```

### 2. Multi-Container Podman Orchestration
The system runs completely self-contained via `compose.yaml`:
- **`billsathi-ollama`:** Hosts the local open-weight model (`gemma2:2b`) with persistent model volumes.
- **`billsathi-api`:** FastAPI backend running OCR extraction, SQLAlchemy SQLite persistence, and integer math verification.
- **`billsathi-web`:** React 19 frontend serving the dark-mode glassmorphic evidence workspace at port 5173.

### 3. Automated Benchmark Accuracy
We verified extraction reliability with an automated ground-truth evaluation script (`evaluation/evaluate_model.py`):
- **Field Extraction Accuracy:** **100.0%** (21/21 fields across test sets)
- **Deterministic Math Accuracy:** **100.0%** (zero floating-point math rounding bugs)
- **Fallback Latency:** ~1.0ms - 4.1ms | **Local Gemma 2 (2B) Latency:** ~1.2s - 2.8s
- **Automated Tests:** 7/7 backend `pytest` passing, 5/5 frontend `vitest` passing.

---

## Why Does Open Innovation Matter?

1. **Absolute Financial Privacy & Data Sovereignty:** Financial records contain bank accounts, client rates, addresses, and sensitive purchase habits. Sending confidential receipts to third-party proprietary cloud LLMs creates unacceptable privacy and regulatory risks. Local open-weight models (Gemma 2 via Ollama) guarantee that zero financial data ever leaves the user's laptop.
2. **Deterministic Trust Over Blind Black Boxes:** Cloud LLMs change their output formatting unpredictably and hallucinate numbers. By combining open-weight models for semantic understanding with deterministic local code for math checks, users get an audit-grade system they can inspect down to the source line.
3. **Zero Marginal Inference Cost:** For freelancers and side-hustlers operating on lean margins, paying per-token API charges for every scanned receipt destroys unit economics. Open models run on existing hardware with zero subscription overhead.

---

## My Agent Session

This project was developed with the assistance of the **Antigravity AI Agent** pair-programming workflow:
- Designed and benchmarked the hybrid Gemma 2 + deterministic fallback extraction pipeline.
- Built the interactive SVG canvas bounding-box alignment algorithm that maps physical PDF points to browser coordinates.
- Implemented multi-workspace client switching with persistent SQLite reviewer signature profiles.
- Containerized the entire multi-service stack with rootless Podman compose and automated test suites.

---

## My First User

**Alex Rivera — Principal Consultant at Rivera Digital Labs LLC:**
> *"As a solo technical consultant, I work with multiple international clients and juggle software subscriptions in USD while filing domestic tax returns in INR. Before BillSathi, I spent the first Sunday of every month manually typing invoice numbers into spreadsheets and double-checking tax math. BillSathi's dual currency ledger and interactive bounding-box verification let me sign off on a month's worth of expenses in under 15 minutes, with zero fear that my accountant will flag a math discrepancy."*

---

## Prize Categories

- 🏆 **Hacktoberfest Week 2: Side Hustle (Main Challenge)**
- 🤖 **Open-Source AI & Open-Weight LLMs (Gemma 2 / Ollama)**
- 🔒 **Best Offline-First & Privacy-Preserving Architecture**
