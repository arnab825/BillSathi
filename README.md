# BillSathi 📑⚡
> **"Financial documents you can verify, not just extract."**  
> *Proof Before Trust — Evidence-Driven Financial Document Intelligence powered by Open-Weight AI.*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-cyan?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Open-Weight AI](https://img.shields.io/badge/AI_Model-Gemma_3_%2F_2B-orange?logo=google)](https://ollama.com)

Built for the **Hacktoberfest 2026 DEV Open-Source AI Challenge** — *Week 2: Side Hustle*.

---

## 🌟 The Core Problem & Our Thesis

Most AI invoice extractors act as **black-box transcription bots**: they blindly parse text and hallucinate totals. If an invoice contains misprinted numbers, missing taxes, or accidental duplicates, generic chatbots transcribe them as facts. When audit time arrives, freelancers and accountants spend billable hours hunting down source documents to verify where those numbers came from.

### BillSathi's Defining Principle: **Proof Before Trust**
1. **Evidence-Linked Extraction:** Every single extracted figure is spatially linked to physical vector coordinates on the source document. Clicking a field visually draws an interactive bounding box on the PDF. If coordinates are unavailable, we explicitly tell you—we never invent coordinates.
2. **Deterministic Mathematical Authority:** AI is used for semantic categorization and parsing descriptions; **deterministic Python integer rules** validate arithmetic (`Subtotal + Tax == Total`), duplicate hashes, and historical vendor drift. AI is *never* the mathematical authority.
3. **Local Open-Weight AI:** Runs locally on your hardware using **Gemma 3 / 2 via Ollama**. Your confidential financial records, client names, and bank invoices never leave your computer.
4. **Human-in-the-Loop Review:** Distinct states (`Imported` ➔ `Processing` ➔ `Needs review` ➔ `Reviewed` ➔ `Confirmed` ➔ `Exported`) guarantee that only verified, human-confirmed records are exported for bookkeeping.

---

## 🚀 Key Product Features

| Feature | Description |
| :--- | :--- |
| **Evidence Workspace** | Split-screen workbench rendering the original document with elevated paper framing alongside extracted fields. Clicking any field highlights the exact supporting bounding box on the document canvas. |
| **Hybrid AI + Deterministic Fusion** | Merges high-level semantic AI intelligence (Gemma 2 via Ollama) with deterministic regex rules for zero-drop arithmetic reliability and instant fallback. |
| **Global Home Ledger Currency** | Dynamically converts all figures across Dashboard, Vendors, Reports, and Evidence Workspace to your chosen entity currency (USD, INR ₹, EUR €, GBP £, CAD, AUD, JPY). |
| **Dual Currency Math Display** | Evidence Workspace presents original invoice amounts alongside real-time converted ledger equivalents for subtotal, tax, and total. |
| **AI Root-Cause Explainer** | Local open-weight AI agent diagnoses why anomalies occurred (unitemized charges, rounding discrepancies, duplicate risks) and suggests signed audit resolutions. |
| **AI Executive Briefing** | Generates instant accountant-ready executive financial briefings summarizing spend, categories, and audit-readiness in the active ledger currency. |
| **Scanned Document & Image OCR** | Built-in Tesseract OCR (`pytesseract`) extracting vector text, spatial coordinates, and bounding boxes from receipts and screenshots (PNG, JPG, WEBP). |
| **Deterministic Financial Checks** | Integer cents arithmetic catches calculation inconsistencies (e.g. Subtotal $800 + Tax $100 != printed $950). |
| **Deduplication Engine** | SHA-256 cryptographic file hashing detects identical duplicate uploads instantly; secondary checks flag duplicate invoice numbers from the same vendor. |
| **Vendor Intelligence & Baselines** | Tracks recurring expenses, maintains baseline records, and alerts when an invoice deviates by >25% from a vendor's historical average. |
| **Time Horizon Filtering** | Dynamic ledger filters on the Dashboard (`All Time`, `This Quarter`, `Last 30 Days`) with real-time KPI and anomaly recalculation. |
| **Accountant-Ready CSV Export** | RFC 4180-compliant CSV export with normalized dates, categories, tax breakdowns, document currency, home ledger currency, and converted totals. |
| **User Profile & Workspace Switching** | Custom persistent avatar upload, reviewer identity management, and instantaneous multi-client workspace switching. |

## 🖼️ DevFest Judge Highlights

These screenshots showcase the core features that best explain BillSathi's value proposition and architectural integrity during a judging walkthrough:

### 1. Live Financial Operations Dashboard
[![BillSathi dashboard](frontend/public/screenshots/dashboard.png)](frontend/public/screenshots/dashboard.png)
**Show this first:** Gives judges an immediate overview of operational status:
- Ingestion metrics: Processed documents, human review queue, and verified ledger counts.
- **Critical Audit Gate:** Top alert banner notifying reviewers of 3 deterministic anomalies requiring resolution.
- Live Home Ledger Currency displayed in INR (`₹`) with dynamic conversion across all summaries.
- Top navigation bar showing real-time local open-weight AI runtime status (`Gemma 2 (Local AI) • 103ms`).

### 2. Flagship Evidence Workspace (Proof Before Trust)
[![BillSathi evidence review workspace](frontend/public/screenshots/evidence-workspace.png)](frontend/public/screenshots/evidence-workspace.png)
**Flagship proof point:** Eliminates AI hallucination anxiety by pairing source documents with extracted records:
- **Interactive Spatial Bounding Boxes:** Clicking extracted fields dynamically draws green bounding boxes over the exact physical coordinates on the document canvas.
- **Multi-Segment Arithmetic Check:** Visualizes line items sum vs. printed subtotal and calculated tax in real-time.
- **Human Verification Gate:** Audit sign-off workflow transitions documents into confirmed, audit-ready financial facts.
- **Dual Currency Math:** Displays printed document totals alongside real-time converted home ledger equivalents (`$950.00 USD ≈ ₹79,325.00 INR`).

### 3. Deterministic Anomaly & Exception Center
[![BillSathi anomaly center](frontend/public/screenshots/anomaly-center.png)](frontend/public/screenshots/anomaly-center.png)
**Explains our core thesis:** BillSathi never lets AI be the mathematical authority:
- Catches calculation mismatches (`$800.00 + $100.00 = $900.00 != $950.00 printed`) using integer-cents arithmetic.
- Flags vendor-level duplicate invoice numbers (`INV-2026-001`) and SHA-256 cryptographic upload collisions.
- **AI Explainer Agent:** Click `Explain with AI` to engage the local Gemma model for root-cause diagnosis and signed audit override recommendations.

### 4. Vendor Spending Intelligence & Volatility Analysis
[![BillSathi vendor intelligence](frontend/public/screenshots/vendor-intelligence.png)](frontend/public/screenshots/vendor-intelligence.png)
**Commercial freelance value:** Continuous vendor spend tracking and proactive anomaly detection:
- Automatic vendor baseline indexing with historical average cost metrics.
- Baseline invoice reference linking (`INV-2026-042`) for instant cross-document verification.
- Automatically flags invoices deviating by >25% from vendor history to catch price creep or billing errors.

### 5. Financial Expense Register & Accountant CSV Export
[![BillSathi financial expense register](frontend/public/screenshots/expense-register.png)](frontend/public/screenshots/expense-register.png)
**Ready for tax handoff:** Comprehensive filterable expense register:
- Complete breakdown across invoice dates, vendors, numbers, categories, subtotals, taxes, and totals.
- Dual-currency normalization for clean domestic tax filing and accountant review.
- One-click **AI Executive Briefing** generation and RFC 4180-compliant **Audit-Ready CSV Export**.

### 6. Business Entity & Multi-Workspace Fiscal Profile
[![BillSathi settings and profile](frontend/public/screenshots/settings-profile.png)](frontend/public/screenshots/settings-profile.png)
**Multi-client freelance flexibility:** 
- Instant switching between client workspaces and business entities (e.g. `Rivera Digital Labs LLC` vs `Personal & Micro Ventures`).
- Reviewer signature photo / avatar customization stored locally in SQLite.
- Entity-specific Home Ledger Currency selection (`INR ₹`, `USD $`, `EUR €`, `GBP £`, etc.) and tax identifier management (`EIN / VAT`).

> 💡 **Suggested 60-Second Demo Story for Judges:**
> 1. Start on the **Dashboard** to show the live local Gemma AI status and the 3 active anomalies.
> 2. Open the **Evidence Workspace** to show spatial bounding box proof and human confirmation.
> 3. Visit the **Anomaly Center** to reveal the intentional arithmetic error and duplicate catch.
> 4. Tour **Vendor Intelligence** and the **Expense Register** to export accountant-ready CSVs.

---

## ⏱️ Repeatable 3-Minute Hackathon Demonstration

Follow this exact workflow to evaluate BillSathi in 3 minutes:

### Step 1: Launch the Application
Open your browser to `http://localhost:5173`. Notice the top navigation bar displaying the live AI runtime badge (`Gemma 2 (Local AI)`) with real-time ping latency and database KPIs.

### Step 2: Seed the 3 Synthetic Demonstration Documents
1. On the **Dashboard**, click the button: **`Load Hackathon Demo (3 Invoices)`** (or **`Seed Demo`** in the header).
2. BillSathi instantly generates and processes three synthetic PDF invoices through the pipeline:
   - **Invoice 1 (`invoice_normal_acme.pdf`):** A clean SaaS infrastructure invoice ($1,000 subtotal + $100 tax = $1,100 total).
   - **Invoice 2 (`invoice_duplicate_acme.pdf`):** An exact duplicate invoice matching hash and invoice number `INV-2026-001`.
   - **Invoice 3 (`invoice_arithmetic_error_apex.pdf`):** An office supplies invoice with a **deliberate arithmetic error** (Subtotal $800 + Tax $100, but printed Total is $950!).

### Step 3: Inspect the Flagship Evidence Workspace
1. Navigate to **`Review Queue`** or **`Documents`** and click `Inspect Evidence` (or open `/workspace`).
2. Select `invoice_normal_acme.pdf`.
3. Notice that `Vendor Name: Acme Cloud Infrastructure` is highlighted with an interactive green bounding box on the invoice.
4. Click on the field **`Total: $1,100.00`** in the right-hand panel.
5. **Observe:** An animated bounding box highlights `$1,100.00` on the invoice canvas with crisp paper elevation.
6. In the **Human Verification Gate**, enter your reviewer name and click **`Confirm Record`**. The status transitions to `Confirmed`.

### Step 4: Resolve the Deliberate Arithmetic Anomaly with AI
1. Navigate to **`Anomalies`**.
2. Notice the alert:
   > *"Calculated $900.00 vs printed $950.00 (Discrepancy: $50.00). Please inspect line items."*
3. Click **`Explain with AI`** to engage the local open-weight auditor agent.
4. **Observe:** The AI agent analyzes the OCR text and reveals that this $50 discrepancy stems from an unitemized surcharge or rounding fee, recommending an `ACCEPTED_OVERRIDE`.
5. Click **`Use AI Suggestion in Resolution`** to pre-populate the audit justification note and resolve.

### Step 5: Switch Home Ledger Currency & Test Dual Math
1. Navigate to **`Settings`**.
2. Change **Home Ledger Currency** from `USD ($)` to `INR (₹)` (or `EUR (€)`), and save.
3. Open **`Dashboard`** or **`Vendors`**: observe all totals instantly recalculated in `₹` with USD base references.
4. Open **`Workspace`**: observe the **Dual Currency Display** showing printed document totals alongside converted home equivalents (`≈ ₹79,325.00`).

### Step 6: Generate AI Executive Briefing & Export CSV
1. Navigate to **`Reports`** (`/register`).
2. Click **`AI Executive Briefing`**: view the synthesized quarterly executive overview.
3. Click **`Export Confirmed CSV (Audit-Ready)`**.
4. Open the downloaded CSV to inspect dual-currency columns (`Document_Currency`, `Home_Ledger_Currency`, and `Home_Converted_Total`).

---

## 🛠️ Technology Stack

```
Frontend:   React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + TanStack Query + Lucide Icons
Backend:    Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2.0 + SQLite
Document:   PyMuPDF (fitz) + Tesseract OCR (pytesseract) + ReportLab 4.x + Pillow
AI Engine:  Ollama (Gemma 2 2B) with in-process deterministic fallback & hybrid fusion
Testing:    Pytest (Backend) + Vitest & React Testing Library (Frontend)
DevOps:     Podman Desktop / Docker Compose (compose.yaml)
```

---

## 💻 Quickstart & Setup

> 📖 **Looking for comprehensive installation steps?** See our dedicated [Detailed Setup Guide](docs/SETUP.md).

### Option A: Podman / Docker Compose (Recommended)

BillSathi includes a full multi-container `compose.yaml` with pre-configured networking, Tesseract OCR, and an Ollama service:

```bash
# In the root repository directory:
podman compose up --build -d
# or
docker compose up --build -d

# Pull the lightweight Gemma 2 open-weight model into the Ollama container:
podman exec -it billsathi-ollama ollama pull gemma2:2b
# or
docker exec -it billsathi-ollama ollama pull gemma2:2b
```
Access the application at **`http://localhost:5173`**.

---

### Option B: Native Development

#### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-username/BillSathi.git
cd BillSathi/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies (including pytesseract)
pip install -r requirements.txt

# Start backend server (Port 8000)
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
# In a new terminal in BillSathi/frontend
cd BillSathi/frontend

# Install dependencies
npm install

# Start Vite dev server (Port 5173)
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🤖 Open-Weight AI Setup (Ollama + Gemma 2)

BillSathi is designed to run completely offline using open-weight models:

```bash
# 1. Install Ollama from https://ollama.com
# 2. Pull and run Gemma 2 2B:
ollama run gemma2:2b
```

Once Ollama is running on port 11434, BillSathi automatically detects it and displays `Gemma 2 (Local AI)` with live latency in the header. If Ollama is offline or uninstalled, BillSathi automatically falls back to its built-in deterministic rule engine so all demos, tests, and exports continue without interruption.


---

## 📊 Evaluation & Benchmark Accuracy

We run an automated ground-truth benchmark across synthetic invoice documents (`evaluation/evaluate_model.py`):

```bash
cd backend
python evaluation/evaluate_model.py
```

### Measured Benchmark Results:
- **Field-Level Extraction Accuracy:** **100.0%** (21/21 fields passed)
- **Deterministic Math Accuracy:** **100.0%** (Zero floating-point inaccuracies using integer cents)
- **Inference Latency:**
  - In-Process Fallback Engine: **~1.0ms - 4.1ms**
  - Local Ollama Gemma 2 2B: **~1,200ms - 2,800ms**
- **Automated Test Suites:**
  - Backend: **7 / 7 passed** (`pytest`)
  - Frontend: **5 / 5 passed** (`vitest`)

---

## 💼 Commercial Potential & Business Model

BillSathi is positioned as a **commercially viable side hustle** for freelancers and micro-agencies:

### 1. The Repetitive Task Eliminated
Independent consultants spend 4–8 hours every month manually renaming invoices, hunting down missing dates, checking for accidental double charges, and typing numbers into spreadsheets.

### 2. Proposed Pricing Model (Hypothesis)
- **Solo Freelancer ($9/month):** Up to 50 documents/month, spatial evidence linking, accountant CSV export.
- **Micro-Agency ($29/month):** Up to 250 documents/month, vendor spending drift intelligence, multi-folder batch intake.
- **Self-Hosted Community (Free / Open-Source Apache 2.0):** 100% free forever for self-hosted local deployments.

---

## 🔒 Security & Privacy Architecture

- **No Public Storage:** Invoices are stored in isolated private directories (`data/uploads`) using cryptographically random UUID filenames (`{uuid}.pdf`) to eliminate path traversal vulnerabilities.
- **Zero Third-Party Telemetry:** Financial documents are never transmitted to cloud APIs or external LLMs.
- **True Cascading Deletion:** Deleting a document removes its database rows and completely purges original files and rendered PNG previews from disk.
- **Sanitized Logging:** Financial figures, tax numbers, and client names are never printed to console logs.

---

## 📜 Documentation Index

- [Complete Setup & Deployment Guide](docs/SETUP.md)
- [PRD (Product Requirements Document)](docs/PRD.md)
- [TRD (Technical Requirements Document)](docs/TRD.md)
- [Architecture & Pipeline Specification](docs/ARCHITECTURE.md)
- [Threat Model & Security](docs/THREAT_MODEL.md)
- [Automated Testing Report](docs/TESTING.md)
- [Model Evaluation & Benchmark](docs/MODEL_EVALUATION.md)
- [User Validation Protocol](docs/USER_VALIDATION.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 📄 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details.
