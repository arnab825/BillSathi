# BillSathi — Complete Setup & Deployment Guide 🛠️

This guide walks you through setting up BillSathi from scratch using either **Containerized (Podman / Docker Compose)** or **Native Local Development**.

---

## 📋 System Prerequisites

| Dependency | Minimum Version | Required For |
| :--- | :--- | :--- |
| **Python** | 3.12+ | Backend FastAPI & Data Pipeline |
| **Node.js** | 20.x+ (npm 10+) | Frontend React 19 & Vite |
| **Podman Desktop** or **Docker** | Latest | Containerized Deployment (Recommended) |
| **Ollama** | Latest | Local Open-Weight Model Inference (`gemma2:2b`) |
| **Tesseract OCR** | 5.x+ | Image & Receipt OCR (included in Dockerfile) |

---

## 🐳 Option 1: Containerized Setup (Podman / Docker Compose)

The fastest and most consistent way to run BillSathi with all dependencies (including Tesseract OCR and local Ollama) is via compose.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/BillSathi.git
cd BillSathi
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` if customization is needed:
```bash
cp .env.example .env
```

Default settings in `compose.yaml`:
- **Backend API:** `http://localhost:8000`
- **Frontend UI:** `http://localhost:5173`
- **Ollama Engine:** `http://localhost:11434` (container `billsathi-ollama`)
- **Default AI Model:** `gemma2:2b`

### 3. Launch Services
Run with Podman:
```bash
podman compose up --build -d
```
Or with Docker:
```bash
docker compose up --build -d
```

### 4. Pull the Gemma 2 Model into the Ollama Container
Once the containers are running, download the lightweight open-weight model:
```bash
# With Podman:
podman exec -it billsathi-ollama ollama pull gemma2:2b

# With Docker:
docker exec -it billsathi-ollama ollama pull gemma2:2b
```

### 5. Access the Web Application
Open your browser at **`http://localhost:5173`**.
- The top header will display **`Gemma 2 (Local AI)`** with active latency (e.g. `28ms`).
- Click **`Seed Demo`** in the header to populate the database with sample audit invoices.

---

## 💻 Option 2: Native Local Development

For developers making real-time code modifications without containers.

### 1. Install System Dependencies

#### Windows:
1. Install **Python 3.12+** from [python.org](https://python.org) (ensure *"Add python.exe to PATH"* is checked).
2. Install **Node.js 20+** from [nodejs.org](https://nodejs.org).
3. Install **Tesseract OCR**:
   - Download the installer from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
   - Add `C:\Program Files\Tesseract-OCR` to your system `PATH`.
4. (Optional) Install **Ollama** from [ollama.com](https://ollama.com) and pull Gemma 2:
   ```bash
   ollama run gemma2:2b
   ```

#### Linux (Debian / Ubuntu):
```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip tesseract-ocr libtesseract-dev curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
curl -fsSL https://ollama.com/install.sh | sh
ollama pull gemma2:2b
```

#### macOS (Homebrew):
```bash
brew install python@3.12 node tesseract ollama
ollama pull gemma2:2b
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd BillSathi/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Windows (cmd.exe):
venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The backend API is now accessible at `http://127.0.0.1:8000` (Interactive Swagger docs: `http://127.0.0.1:8000/docs`).

---

### 3. Frontend Setup

In a new terminal window:
```bash
# Navigate to frontend directory
cd BillSathi/frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## ⚙️ Configuration & Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:////app/data/billsathi.db` | SQLAlchemy database connection URI |
| `OLLAMA_BASE_URL` | `http://billsathi-ollama:11434` | URL to Ollama HTTP inference endpoint |
| `OLLAMA_MODEL` | `gemma2:2b` | Open-weight model tag (`gemma2:2b`, `gemma:2b`) |
| `OLLAMA_TIMEOUT_SECONDS`| `45.0` | Maximum inference duration before fallback |
| `DATA_DIR` | `./data` | Base directory for uploads, previews, and exports |
| `ENVIRONMENT` | `development` | Runtime environment (`development` / `production`) |

---

## 🧪 Running Automated Tests

### Backend Tests (Pytest)
```bash
cd BillSathi/backend
# Inside activated venv:
pytest -v
```

### Frontend Tests (Vitest)
```bash
cd BillSathi/frontend
npm test
```

### Model Accuracy & Benchmark Suite
Run the automated ground-truth evaluation:
```bash
cd BillSathi/backend
python evaluation/evaluate_model.py
```

---

## 🩺 Troubleshooting & FAQs

### 1. "Ollama is showing Fallback Engine instead of Gemma 2"
- Verify Ollama is running: visit `http://localhost:11434/api/tags` in your browser.
- Verify the model is downloaded: run `ollama list` and ensure `gemma2:2b` is present.
- If using Podman/Docker, ensure `OLLAMA_BASE_URL=http://billsathi-ollama:11434` or use `http://host.containers.internal:11434` if running Ollama natively on the host.
- **Note:** BillSathi seamlessly engages its deterministic fallback engine if Ollama is offline—all features and demonstrations remain fully operational!

### 2. "Tesseract OCR not found"
- When running natively, ensure `tesseract` is added to your system `PATH`.
- Verify in terminal with `tesseract --version`.
- In Podman/Docker, Tesseract is pre-installed inside the `billsathi-backend` image.

### 3. "Port 8000 or 5173 already in use"
- Check running processes:
  - Windows: `netstat -ano | findstr :8000`
  - Linux/macOS: `lsof -i :8000`
- Terminate the conflicting process or modify the port mappings in `compose.yaml` or `vite.config.ts`.
