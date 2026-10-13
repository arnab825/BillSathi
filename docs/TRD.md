# Technical Requirements Document (TRD) — BillSathi

## 1. System Technology Stack

### Backend Stack
- **Runtime:** Python 3.12
- **Framework:** FastAPI
- **Validation:** Pydantic v2 (Strict typing, resilient null handling, structured schema parsing)
- **Database & ORM:** SQLite 3 with SQLAlchemy 2.0 (Relational schema, foreign keys, cascading deletes)
- **PDF & Spatial Parsing:** PyMuPDF (`fitz` / `pymupdf`)
- **OCR Engine:** Tesseract OCR 5.x + `pytesseract` (multiline text & word bounding boxes for image/receipt documents)
- **Document Generation:** ReportLab 4.x (Synthetic invoice generator)
- **AI Inference Engine:** Ollama API (Gemma 2 2B / Gemma 3) with hybrid deterministic regex fusion & auto-fallback
- **Testing:** Pytest, HTTPX TestClient

### Frontend Stack
- **Framework:** React 19, TypeScript
- **Tooling:** Vite 8, Tailwind CSS v4
- **State & Server Cache:** TanStack Query v5
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Testing:** Vitest, React Testing Library, jsdom

### Development Infrastructure
- **Containerization:** Podman Desktop / Docker Compose (`compose.yaml` with dedicated Ollama, backend, and frontend services)
- **Networking:** Explicit host networking (`host.containers.internal` / `host.docker.internal`)
- **Persistence:** Volume-mounted `./backend/data:/app/data`

---

## 2. Data Contracts & Relational Schemas

### Monetary Precision Contract
- **Rule:** Floating-point arithmetic (`float`) is strictly prohibited for monetary calculations.
- **Implementation:** All currencies are converted to integer minor units (cents) via Python `Decimal`:
  $$\text{cents} = \text{int}((\text{Decimal}(\text{str}) \times 100).\text{quantize}(\text{Decimal}("1")))$$
- All additions, tax comparisons, and totals are computed using 64-bit integer arithmetic.

### Document State Machine
$$\text{Imported} \longrightarrow \text{Processing} \longrightarrow \begin{cases} \text{Needs review} & \text{if anomalies exist} \\ \text{Reviewed} & \text{if clean} \end{cases} \longrightarrow \text{Confirmed} \longrightarrow \text{Exported}$$

---

## 3. Open-Weight Model Integration & Schema Enforcement

The AI provider abstraction is defined in `app/models_ai/base.py`:
- System prompt instructs Gemma to emit pure JSON conforming to `LLMExtractionOutput`.
- Responses are sanitized of potential Markdown code blocks (`re.sub`) and numeric fields are cleaned of currency symbols and commas.
- Validated via resilient `LLMExtractionOutput.model_validate(sanitized_dict)` with safe defaults (`USD`, `Other`, `0.00`) preventing runtime schema crashes on partial outputs.
- **Hybrid Fusion Engine:** AI semantics are combined with deterministic regex rules to ensure critical figures (subtotal, tax, dates) are never omitted.
- If Ollama is unavailable or times out (default 45s), `FallbackExtractionProvider` executes deterministic regex extraction, ensuring 100% test, demo, and evaluation continuity.

