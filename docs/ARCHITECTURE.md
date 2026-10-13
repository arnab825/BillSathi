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
    ├── 1. Document Intake: SHA-256 Hashing & Storage Isolation
    ├── 2. Spatial Parsing: PyMuPDF Word Coordinates & PNG Previews
    ├── 3. Open-Weight AI: Ollama (Gemma 3) / Fallback Regex Engine
    ├── 4. Evidence Linker: Bounding Box Mapping (Zero Hallucination)
    ├── 5. Deterministic Rules: Integer Cents Arithmetic & Duplicate Engine
    ├── 6. Persistence: SQLite + SQLAlchemy 2.0 (Cascading Deletions)
    └── 7. Export Engine: RFC 4180 Accountant-Ready CSV Generator
```

---

## 2. Document Processing Pipeline Steps

```
[Uploaded File] ──> Calculate SHA-256 Hash
                          │
                          ▼
                    Detect Exact Duplicates
                          │
                          ▼
            PyMuPDF Vector Text & Coordinate Extraction
                          │
                          ▼
             Render Page Previews (150 DPI PNG)
                          │
                          ▼
     Open-Weight Model Extraction (Gemma 3 / Fallback)
                          │
                          ▼
                Pydantic Strict Validation
                          │
                          ▼
             Evidence Linker (Spatial Mapping)
                          │
                          ▼
           Deterministic Rules Validation:
             - Subtotal + Tax == Total (Integer Cents)
             - Duplicate Invoice Check
             - Missing Required Fields
             - Vendor Price Drift (>25% across >=2 invoices)
                          │
                          ▼
            Store Record in State: "Needs review" / "Reviewed"
                          │
                          ▼
            Human Review, Corrections & "Confirm Record"
                          │
                          ▼
                 Accountant CSV Export
```

---

## 3. Evidence Linking & Spatial Coordinate System

- PyMuPDF extracts text blocks and word-level bounding boxes: `[x0, y0, x1, y1]` in points (typically 612x792 standard Letter).
- When model extracts a field (e.g., `vendor_name: "Acme Cloud Infrastructure"` or `total_amount: "1,100.00"`), `evidence_linker.py` scans the physical spans on each page.
- If an exact or normalized substring match is found, the physical bounding box `[x0, y0, x1, y1]` is attached to the `ExtractedField` record.
- **Critical Policy:** If no spatial coordinate match exists in the document, `bbox_json` is set to `null` and marked `unverified`. BillSathi strictly never hallucinates or invents coordinates.
