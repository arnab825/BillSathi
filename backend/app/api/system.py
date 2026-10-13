import hashlib
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db, engine, Base
from app.models.entities import Document, FinancialRecord, Anomaly, VendorProfile
from app.schemas.financial import DashboardStatsResponse
from app.models_ai.factory import check_ai_health, set_force_fallback
from app.demo_data.generator import generate_all_demo_invoices
from app.extraction.pipeline import process_document_pipeline

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes all Dashboard KPIs directly from the relational database.
    Zero hardcoded values.
    """
    total_docs = db.query(Document).count()
    imported_cnt = db.query(Document).filter(Document.status == "Imported").count()
    needs_review_cnt = db.query(Document).filter(Document.status == "Needs review").count()
    reviewed_cnt = db.query(Document).filter(Document.status == "Reviewed").count()
    confirmed_cnt = db.query(Document).filter(Document.status == "Confirmed").count()
    exported_cnt = db.query(Document).filter(Document.status == "Exported").count()

    total_anomalies = db.query(Anomaly).count()
    unresolved_anomalies = db.query(Anomaly).filter(Anomaly.is_resolved == False).count()
    duplicates_cnt = (
        db.query(Anomaly)
        .filter(Anomaly.rule_code.in_(["EXACT_DUPLICATE", "ATTRIBUTE_DUPLICATE"]), Anomaly.is_resolved == False)
        .count()
    )

    total_spend_cents = db.query(func.coalesce(func.sum(FinancialRecord.total_cents), 0)).scalar() or 0
    confirmed_spend_cents = (
        db.query(func.coalesce(func.sum(FinancialRecord.total_cents), 0))
        .filter(FinancialRecord.status == "Confirmed")
        .scalar()
        or 0
    )

    # Recent vendors breakdown
    recent_vendors = (
        db.query(VendorProfile)
        .order_by(VendorProfile.total_spend_cents.desc())
        .limit(5)
        .all()
    )
    vendors_list = [
        {
            "name": v.name,
            "category": v.default_category,
            "total_spend_cents": v.total_spend_cents,
            "invoice_count": v.invoice_count,
            "average_amount_cents": v.average_amount_cents,
        }
        for v in recent_vendors
    ]

    # Monthly breakdown (YYYY-MM)
    records = db.query(FinancialRecord).filter(FinancialRecord.invoice_date.isnot(None)).all()
    monthly_map: Dict[str, int] = {}
    for r in records:
        if r.invoice_date and len(r.invoice_date) >= 7:
            month_key = r.invoice_date[:7]
            monthly_map[month_key] = monthly_map.get(month_key, 0) + r.total_cents

    monthly_breakdown = [
        {"month": m, "total_spend_cents": total}
        for m, total in sorted(monthly_map.items())
    ]

    return DashboardStatsResponse(
        total_documents=total_docs,
        imported_count=imported_cnt,
        needs_review_count=needs_review_cnt,
        reviewed_count=reviewed_cnt,
        confirmed_count=confirmed_cnt,
        exported_count=exported_cnt,
        total_anomalies=total_anomalies,
        unresolved_anomalies=unresolved_anomalies,
        potential_duplicates=duplicates_cnt,
        total_spend_cents=total_spend_cents,
        confirmed_spend_cents=confirmed_spend_cents,
        recent_vendors=vendors_list,
        monthly_breakdown=monthly_breakdown,
    )


@router.get("/health")
async def get_system_health(db: Session = Depends(get_db)):
    """Health check endpoint reporting AI model connectivity, storage, and database."""
    ai_health = await check_ai_health()

    # Storage stats
    upload_count = len(list(settings.UPLOAD_DIR.glob("*")))
    preview_count = len(list(settings.PREVIEW_DIR.glob("*")))

    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite_connected",
        "ai": ai_health,
        "storage": {
            "upload_count": upload_count,
            "preview_count": preview_count,
            "upload_dir": str(settings.UPLOAD_DIR),
        },
    }


@router.post("/toggle-ai-engine")
def toggle_ai_engine(force_fallback: bool = Query(...)):
    """Toggles between Ollama and Deterministic Fallback Engine for demo flexibility."""
    set_force_fallback(force_fallback)
    return {"forced_fallback": force_fallback}


@router.post("/seed-demo")
async def seed_demo_documents(db: Session = Depends(get_db)):
    """
    Generates and processes the 3 synthetic demonstration documents:
    1. Normal invoice (Acme Cloud Hosting)
    2. Duplicate invoice (Acme Cloud duplicate invoice number & hash)
    3. Arithmetic inconsistency invoice (Apex Office Supplies: 800 + 100 != 950)
    """
    demo_files = generate_all_demo_invoices(settings.DATA_DIR / "demo_invoices")

    seeded_docs = []

    # Process in sequence
    for key, pdf_path in [
        ("normal", demo_files["normal"]),
        ("duplicate", demo_files["duplicate"]),
        ("arithmetic_error", demo_files["arithmetic_error"]),
    ]:
        with open(pdf_path, "rb") as f:
            content = f.read()

        file_hash = hashlib.sha256(content).hexdigest()
        doc_id = str(uuid.uuid4())
        dest_filename = f"{doc_id}_{pdf_path.name}"
        dest_path = settings.UPLOAD_DIR / dest_filename
        shutil.copyfile(pdf_path, dest_path)

        doc = Document(
            id=doc_id,
            filename=pdf_path.name,
            file_hash=file_hash,
            file_path=str(dest_path),
            mime_type="application/pdf",
            file_size=len(content),
            status="Processing",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        await process_document_pipeline(db, doc)
        db.refresh(doc)
        seeded_docs.append({
            "id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "anomalies_count": len(doc.anomalies),
        })

    return {
        "message": "Demo documents successfully seeded and processed through extraction pipeline",
        "documents": seeded_docs,
    }


@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    """Cleans all documents, previews, and database records for fresh demo runs."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Clean file directories
    for p in settings.UPLOAD_DIR.glob("*"):
        if p.is_file():
            try:
                p.unlink()
            except Exception:
                pass

    for p in settings.PREVIEW_DIR.glob("*"):
        if p.is_file():
            try:
                p.unlink()
            except Exception:
                pass

    return {"message": "Database and storage reset successfully."}
