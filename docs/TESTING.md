# Testing Strategy & Verification Report — BillSathi

## 1. Overview

BillSathi implements a multi-tiered automated testing strategy covering arithmetic integrity, API contracts, model extraction evaluation, and UI components.

---

## 2. Test Execution Summary

### Backend Unit & Integration Tests (Pytest)
Command: `pytest` in `backend/`
- **Result:** **7 passed** (100% pass rate)
- **Coverage Areas:**
  - `test_to_cents_conversion`: Validates integer minor units conversion for various currencies (`$1,250.50` -> `125050`) avoiding binary floating point drift.
  - `test_format_cents_display`: Validates clean string formatting without IEEE 754 drift.
  - `test_arithmetic_consistency_logic`: Tests subtotal + tax = total math verification and discrepancy flagging.
  - `test_root_endpoint`: Verifies API metadata and "Proof Before Trust" tagline.
  - `test_system_health`: Validates AI health reporting and storage stats.
  - `test_dashboard_stats`: Tests live database querying for KPIs.
  - `test_demo_seed_and_verification_workflow`: Full end-to-end integration test creating 3 synthetic invoices, parsing vector text, generating bounding boxes, flagging arithmetic inconsistencies, and exporting accountant-ready RFC 4180 CSV.

### Frontend Unit & Component Tests (Vitest & React Testing Library)
Command: `npm test` in `frontend/`
- **Result:** **5 passed** (100% pass rate)
- **Coverage Areas:**
  - `StatusBadge Component`: Renders `Confirmed`, `critical`, and `Needs review` badges with appropriate accessible color tokens.
  - `formatCents Helper`: Validates client-side currency display across USD and EUR without floating-point inaccuracies.

### Model Evaluation Benchmark (Ground-Truth Dataset)
Command: `python evaluation/evaluate_model.py` in `backend/`
- **Result:** **100.0% Field-Level Accuracy** (21/21 fields passed across the synthetic evaluation ground-truth dataset).
- **Latency:** Average **1.0ms - 4.1ms** inference latency per document on deterministic fallback; **1.2s - 2.8s** on Ollama Gemma 2 2B.

---

## 3. How to Run All Tests Locally

1. **Backend Tests:**
   ```bash
   cd backend
   pytest
   ```

2. **Frontend Tests:**
   ```bash
   cd frontend
   npm test
   ```

3. **Evaluation Benchmark:**
   ```bash
   cd backend
   python evaluation/evaluate_model.py
   ```
