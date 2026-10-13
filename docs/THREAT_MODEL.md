# Threat Model & Security Architecture — BillSathi

## 1. Overview & Trust Boundaries

BillSathi is designed as an on-premises / local-first financial document intelligence platform. In its primary release (MVP), it operates in a single-tenant deployment model.

### Key Trust Boundaries:
- **Untrusted Input:** Uploaded invoice files (PDF, PNG, JPEG) and client HTTP requests.
- **Trusted Processing Boundary:** FastAPI backend, PyMuPDF parsing engine, and local SQLite database.
- **AI Inference Boundary:** Local Ollama runtime executing Gemma on `localhost:11434` / container host network.
- **Storage Boundary:** Local non-public directories (`backend/data/uploads`, `backend/data/previews`).

---

## 2. Threat Analysis & Mitigations

| Threat | Risk Level | Mitigation in BillSathi |
| :--- | :--- | :--- |
| **Path Traversal Attacks** | Critical | Filenames are discarded upon disk persistence; stored files receive cryptographically random UUIDs (`{uuid}.pdf`). No arbitrary filesystem paths are accepted in API endpoints. |
| **Malicious File Uploads / RCE** | High | Whitelist enforcement on extensions (`.pdf`, `.png`, `.jpg`, `.jpeg`) and MIME types. Strict 15MB file size limit. Vector parsing handled via isolated PyMuPDF C bindings. |
| **Data Leakage via Logs** | High | Zero document text, invoice line items, or vendor banking details are printed to stdout or application logs. Only document IDs and error codes are logged. |
| **Prompt Injection via Invoices** | Medium | The local model is used exclusively for structured JSON extraction. The output is strictly validated against a Pydantic schema. AI output is never executed as code or treated as mathematical authority. |
| **Confidential Data Exfiltration** | Critical | Zero external cloud telemetry or third-party hosted LLM API dependencies. Open-weight inference runs natively on the user's hardware. |
| **Incomplete File Deletion (Residual Data)** | Medium | Deleting a document completely deletes its database row (with `ON DELETE CASCADE`), its original stored file, and all rendered page preview PNGs from disk. |

---

## 3. Limitations of Single-User Architecture

1. **Authentication:** The current MVP does not implement multi-tenant authentication or role-based access control (RBAC). It is intended for single-user local workstations or internal private Docker/Podman networks.
2. **Multi-User Warning:** If exposing BillSathi over a public network, an authenticating reverse proxy (e.g. Caddy/Nginx with OAuth2/OIDC) must be configured in front of the application.
