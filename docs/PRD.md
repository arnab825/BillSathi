# Product Requirements Document (PRD) — BillSathi

**Product Name:** BillSathi  
**Tagline:** "Financial documents you can verify, not just extract."  
**Core Thesis:** **Proof Before Trust**  
**Hackathon Event:** Hacktoberfest 2026 DEV Open-Source AI Challenge — Week 2: Side Hustle  

---

## 1. Executive Summary & Problem Statement

Freelancers, independent consultants, micro-agencies, and small businesses face severe pain when handling financial documents:
1. **Generic OCR/AI Wrappers are Untrustworthy:** Existing tools silently hallucinate invoice numbers or tax amounts. When an audit occurs, the business owner has no way of verifying why the tool generated that number without manually cross-referencing every PDF.
2. **Arithmetic Errors Go Undetected:** Vendors frequently make billing errors (misprinted totals, missing sales taxes, unitemized shipping). AI extractors blindly transcribe wrong numbers as facts.
3. **Data Privacy Risks:** Proprietary cloud APIs demand uploading confidential financial statements to external corporate servers.
4. **Accountant Handoff Friction:** Accountants spend billable hours verifying missing vendor dates and fixing spreadsheet discrepancies.

**BillSathi** transforms scattered invoices, receipts, and expense documents into structured, searchable, evidence-backed financial records using local open-weight AI.

---

## 2. Target Customer Personas & Use Cases

### Persona 1: The Independent Freelancer (Maya)
- **Profile:** Software contractor processing 20–40 SaaS invoices, travel receipts, and hardware bills each month.
- **Goal:** Normalize vendor names, categorize expenses, and hand off an accountant-ready CSV for tax filing.
- **Value Realization:** BillSathi extracts date, vendor, currency, and suggests categories while linking every figure to its source bounding box.

### Persona 2: The Small Agency Owner (David)
- **Profile:** Digital marketing agency managing 50–150 subcontractor and vendor invoices monthly.
- **Goal:** Catch accidental double-billing, invoice number duplicates, and vendor rate drift.
- **Value Realization:** Anomaly Center flags duplicate cryptographic hashes, identical vendor invoice numbers, and >25% historical price changes.

### Persona 3: The Tax Accountant (Rachel)
- **Profile:** Certified accountant receiving year-end expense folders from freelance clients.
- **Goal:** Audit expense items quickly with evidence-backed provenance.
- **Value Realization:** One-click CSV export with RFC 4180 compliance, human verification stamps, and linked document previews.

---

## 3. Product Principles & Differentiators

| Traditional AI Invoice Extractor | BillSathi |
| :--- | :--- |
| Blind extraction with no spatial coordinates | **Evidence-linked extraction** (visual bounding box overlay) |
| Relies on LLM arithmetic (hallucinates totals) | **Deterministic Python validation** using integer cents |
| Unverified AI output exported directly | **Human-in-the-Loop review** workflow before export |
| Proprietary API lock-in ($$$ per token) | **Open-weight AI (Gemma 3 / 2 via Ollama)** running locally |
| Hardcoded marketing metrics | **Live database KPI engine** with zero simulated statistics |

---

## 4. Key Functional Requirements

1. **Document Intake (PDF, PNG, JPEG):**
   - SHA-256 cryptographic hashing to detect identical duplicate uploads immediately.
   - Vector PDF extraction with PyMuPDF and OCR support.
2. **Evidence Workspace:**
   - Interactive canvas overlaying physical bounding boxes on source documents.
   - Clicking an extracted field highlights its exact source coordinates.
   - Inline correction with audit logging.
3. **Deterministic Financial Validation:**
   - Strict integer cents arithmetic: `Subtotal + Tax == Total`.
   - Exact duplicate and attribute duplicate detection.
   - Missing required audit fields (date, invoice #).
   - Vendor spending drift (>25% variance against >=2 historical invoices).
4. **Human Review Workflow:**
   - Explicit state transitions: `Imported` -> `Processing` -> `Needs review` -> `Reviewed` -> `Confirmed` -> `Exported`.
5. **Accountant Export:**
   - RFC 4180 CSV export with proper quotation, decimal conversion, and reviewer signatures.
