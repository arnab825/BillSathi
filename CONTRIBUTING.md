# Contributing to BillSathi

Thank you for your interest in contributing to **BillSathi**!

BillSathi is an open-source financial document intelligence platform founded on the principle of **Proof Before Trust**. We welcome contributions from developers, accountants, designers, and testers.

---

## 1. Code of Conduct

Please treat all community members with respect, patience, and professional courtesy.

---

## 2. Development Setup

### Prerequisites
- Python 3.12+
- Node.js 22+ & npm 10+
- (Optional) Podman Desktop or Docker
- (Optional) Ollama with `gemma2:2b` or `gemma:2b`

### Local Setup
1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Running Tests**:
   - Backend: `pytest`
   - Frontend: `npm test`
   - Model Evaluation: `python evaluation/evaluate_model.py`

---

## 3. Guiding Architectural Principles

When contributing code, please adhere strictly to these engineering standards:

1. **Integer Minor Units**: Never use binary floating-point numbers (`float`) for monetary amounts. Always use integer minor units (cents) or Python `Decimal`.
2. **Proof Before Trust**: Extracted values must link to actual document bounding box coordinates or source text. Never fabricate coordinates or hallucinate evidence regions.
3. **Deterministic Authority**: AI suggests categories and interprets descriptions; deterministic Python rules validate math, taxes, dates, and duplicates.
4. **Graceful Fallbacks**: The application must run and pass tests even when Ollama is offline.
5. **Cascading Cleanup**: Deleting an invoice must remove its database records and physical preview files.

---

## 4. Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Run automated tests (`pytest` and `npm test`).
3. Ensure no linting or type errors (`npm run build`).
4. Submit your pull request with a descriptive title and summary of changes.
