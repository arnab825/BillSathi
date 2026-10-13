import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
EXPORT_DIR = DATA_DIR / "exports"
PREVIEW_DIR = DATA_DIR / "previews"

for d in [DATA_DIR, UPLOAD_DIR, EXPORT_DIR, PREVIEW_DIR]:
    d.mkdir(parents=True, exist_ok=True)


class Settings(BaseModel):
    PROJECT_NAME: str = "BillSathi"
    TAGLINE: str = "Financial documents you can verify, not just extract."
    VERSION: str = "1.0.0"
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    EXPORT_DIR: Path = EXPORT_DIR
    PREVIEW_DIR: Path = PREVIEW_DIR
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/billsathi.db")
    
    # Ollama AI Configuration
    # Inside Docker/Podman container, Windows host is host.containers.internal or host.docker.internal
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma2:2b")
    OLLAMA_TIMEOUT_SECONDS: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "45.0"))
    
    # Document limits
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".png", ".jpg", ".jpeg"}
    ALLOWED_MIME_TYPES: set[str] = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    }
    
    # Financial Rule Thresholds
    PRICE_DRIFT_THRESHOLD_PCT: float = 25.0  # Flag when price differs by >25% from historical average
    MIN_HISTORICAL_INVOICES_FOR_DRIFT: int = 2
    
    # Single-user local safety
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")


settings = Settings()
