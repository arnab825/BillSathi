# Architecture & Pipeline Specification — BillSathi

## 1. High-Level Architecture Diagram

```
[ User Browser / Freelancer ]
             │
             ▼
[ React 19 + Tailwind v4 Frontend ] (Port 5173)
             │
      REST API / JSON
             │
             ▼
[ FastAPI Backend Application ] (Port 8000)
    │
    ├── 1. Document Intake: SHA-256 Cryptographic Hashing & Private Storage Isolation
    ├── 2. Spatial & OCR Parsing: PyMuPDF Vectors + Tesseract OCR (Pytesseract) & 150 DPI Previews
    ├── 3. Open-Weight AI & Fusion: Ollama (Gemma 2 2B) + Deterministic Regex Fusion & Auto-Fallback
    ├── 4. Evidence Linker: Spatial Bounding Box Coordinate Mapping (Zero Hallucination)
    ├── 5. Deterministic Rules: Integer Cents Arithmetic, Attribute Duplicates, & Vendor Drift
    ├── 6. User Account Subsystem: Profile avatars, reviewer identity, & multi-workspace switcher
    ├── 7. Persistence: SQLite + SQLAlchemy 2.0 (Foreign Keys & Cascading Deletions)
    └── 8. Export Engine: RFC 4180 Accountant-Ready CSV Generator
```

---

## 2. Document Processing Pipeline Steps

```
[Uploaded File (PDF/Image)] ──> Calculate SHA-256 Hash
                                      │
                                      ▼
                            Detect Exact Duplicates
                                      │
                                      ▼
                    Spatial & Text Extraction:
                    - PDFs: PyMuPDF Vector Text Blocks & Word Coordinates
                    - Images/Receipts: Tesseract OCR (pytesseract) Multiline & BBoxes
                                      │
                                      ▼
                         Render Page Previews (150 DPI PNG)
                                      │
                                      ▼
                    Hybrid AI Extraction & Deterministic Fusion:
                    - Primary: Gemma 2 2B via Ollama (Structured JSON)
                    - Fallback / Fusion: Deterministic Regex Heuristics
                    - Ensures subtotal, tax, and totals are never dropped
                                      │
                                      ▼
                         Pydantic Resilient Schema Validation
                                      │
                                      ▼
                      Evidence Linker (Spatial Mapping to Spans):
                      - Bounds verified against original physical text spans
                      - Inferred categories isolated from vendor names
                                      │
                                      ▼
                    Deterministic Financial & Integrity Checks:
                      - Subtotal + Tax == Total (64-bit Integer Cents)
                      - Duplicate Invoice Number for Vendor
                      - Missing Critical Financial Fields
                      - Historical Vendor Price Drift (>25% across >=2 invoices)
                                      │
                                      ▼
                    Store Record in State: "Needs review" / "Reviewed"
                                      │
                                      ▼
                    Human Verification Gate, Corrections & "Confirm Record"
                                      │
                                      ▼
                         Accountant CSV Export
```

---

## 3. Evidence Linking & Spatial Coordinate System

- **Vector PDFs:** PyMuPDF extracts text blocks and word-level bounding boxes: `[x0, y0, x1, y1]` in standard points (612x792 standard Letter).
- **Scanned Images & Receipts:** Processed through Tesseract OCR using `pytesseract.image_to_string` for natural multiline retention and `image_to_data` for word pixel bounding boxes normalized to the rendered canvas scale.
- **Evidence Association:** When the model extracts a field (e.g., `vendor_name: "Acme Cloud Infrastructure"` or `total_amount: "1,100.00"`), `evidence_linker.py` scans candidate spans on the page.
- **Strict Verification Policy:** If no spatial coordinate match exists in the document, `bbox_json` is set to `null` and marked `unverified`. BillSathi strictly never hallucinates or invents coordinates.
- **Canvas Presentation:** The interactive Document Canvas uses elevated paper framing (`bg-white` with contrast drop shadows) and dynamic tooltip positioning to prevent off-canvas clipping for top-margin invoice headers.

