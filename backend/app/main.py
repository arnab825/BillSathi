import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api import documents, records, anomalies, vendors, export, system, account

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("billsathi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    logger.info("Initializing BillSathi database tables...")
    Base.metadata.create_all(bind=engine)
    # Safe SQLite migration for new columns
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE user_accounts ADD COLUMN avatar_url TEXT"))
    except Exception:
        pass  # Column already exists or table freshly created
    logger.info("BillSathi backend initialized successfully.")
    yield
    logger.info("Shutting down BillSathi backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Evidence-Driven Financial Document Intelligence Platform. Proof Before Trust.",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Enable CORS for frontend Vite dev server and container networking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(documents.router)
app.include_router(records.router)
app.include_router(anomalies.router)
app.include_router(vendors.router)
app.include_router(export.router)
app.include_router(system.router)
app.include_router(account.router)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "concept": "Proof Before Trust",
    }
