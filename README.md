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
| **Evidence Workspace** | Split-screen workbench rendering the original document alongside extracted fields. Clicking any field highlights the exact supporting bounding box on the document canvas. |
| **Deterministic Financial Checks** | Integer cents arithmetic catches calculation inconsistencies (e.g. Subtotal $800 + Tax $100 != printed $950). |
| **Deduplication Engine** | SHA-256 cryptographic file hashing detects identical duplicate uploads instantly; secondary checks flag duplicate invoice numbers from the same vendor. |
| **Vendor Intelligence** | Tracks recurring expenses and alerts when an invoice deviates by >25% from a vendor's historical average (based on $\ge 2$ prior invoices). Shows exact math—never accuses of fraud. |
| **Accountant-Ready CSV Export** | RFC 4180-compliant CSV export with normalized dates, categories, tax breakdowns, and human confirmation timestamps. |
| **Zero-Drop Resilience** | Auto-detects local Ollama inference; seamlessly falls back to a deterministic regex extraction engine if Ollama is offline or uninstalled. |

---

## ⏱️ Repeatable 3-Minute Hackathon Demonstration

Follow this exact workflow to evaluate BillSathi in 3 minutes:

### Step 1: Launch the Application
Open your browser to `http://localhost:5173`. Notice the top navigation bar displaying the live AI runtime badge and the live database KPI dashboard.

### Step 2: Seed the 3 Synthetic Demonstration Documents
1. On the **Dashboard**, click the button: **`Load Hackathon Demo (3 Invoices)`**.
2. BillSathi instantly generates and processes three synthetic PDF invoices through the pipeline:
   - **Invoice 1 (`invoice_normal_acme.pdf`):** A clean SaaS infrastructure invoice ($1,000 subtotal + $100 tax = $1,100 total).
   - **Invoice 2 (`invoice_duplicate_acme.pdf`):** An exact duplicate invoice matching hash and invoice number `INV-2026-001`.
   - **Invoice 3 (`invoice_arithmetic_error_apex.pdf`):** An office supplies invoice with a **deliberate arithmetic error** (Subtotal $800 + Tax $100, but printed Total is $950!).

### Step 3: Inspect the Flagship Evidence Workspace
1. Navigate to **`Evidence Workspace`** from the navbar.
2. Select `invoice_normal_acme.pdf`.
3. Click on the field **`Total Due: $1,100.00`** in the right-hand panel.
4. **Observe:** An animated, glowing bounding box appears on the PDF viewer on the left, highlighting the exact coordinates of `$1,100.00` on the invoice.
5. In the **Human Review Gate**, enter your name and click **`Confirm Record`**. The status immediately transitions to `Confirmed`.

### Step 4: Resolve the Deliberate Arithmetic Anomaly
1. Navigate to **`Anomaly Center`**.
2. Notice the `CRITICAL` alert:
   > *"Subtotal ($800.00) + Tax ($100.00) = $900.00, but printed Total is $950.00. Discrepancy: $50.00."*
3. Click **`Resolve Warning`**, choose `Accepted & Override (Valid Discrepancy/Fee)`, enter an audit note, and confirm.

### Step 5: Export Accountant-Ready CSV
1. Navigate to **`Financial Register`**.
2. Click **`Export Confirmed CSV (Audit-Ready)`**.
3. Open the downloaded CSV in Excel or a text editor to verify RFC 4180 formatting, decimal amounts, and confirmation signatures.

---

## 🛠️ Technology Stack

```
Frontend:   React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + TanStack Query + Lucide Icons
Backend:    Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2.0 + SQLite
Document:   PyMuPDF (fitz) + ReportLab 4.x + Pillow
AI Engine:  Ollama (Gemma 3 4B / Gemma 2 2B) with in-process deterministic fallback
Testing:    Pytest (Backend) + Vitest & React Testing Library (Frontend)
DevOps:     Podman Desktop / Docker Compose (compose.yaml)
```

---

## 💻 Quickstart & Installation

### Option A: Native Development (Recommended for Testing)

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

# Install dependencies
pip install -r requirements.txt

# Start backend server (Port 8000)
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
# Open a new terminal in the repository root
cd BillSathi/frontend

# Install packages
npm install

# Start Vite dev server (Port 5173)
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Option B: Podman / Docker Compose

BillSathi includes a full `compose.yaml` configured with explicit Windows host-to-container networking:

```bash
# In the root repository directory:
podman compose up --build
# or
docker compose up --build
```
Access the application at `http://localhost:5173`. The backend connects to the host machine's Ollama runtime via `host.containers.internal:11434`.

---

## 🤖 Open-Weight AI Setup (Ollama + Gemma)

BillSathi is designed to run completely offline using open-weight models:

```bash
# Install Ollama from https://ollama.com
# Pull and run Gemma 2 (or Gemma 3):
ollama run gemma2:2b
```

Once Ollama is running on port 11434, BillSathi automatically detects it and marks the runtime as `Ollama: Gemma 3`. If Ollama is not installed or offline, BillSathi automatically switches to the built-in deterministic fallback engine so all demos, tests, and exports continue without interruption.

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
