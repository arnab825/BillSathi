import hashlib
import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.entities import Document
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.extraction.pipeline import process_document_pipeline

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentDetailResponse)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """
    Upload and process an invoice or receipt (PDF, PNG, JPEG).
    Validates file type, size, calculates SHA-256 hash, and runs extraction pipeline.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Read and validate file content & size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB.",
        )

    # Calculate cryptographic SHA-256
    file_hash = hashlib.sha256(content).hexdigest()

    # Generate safe non-traversal storage path
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}{ext}"
    stored_path = settings.UPLOAD_DIR / safe_filename

    with open(stored_path, "wb") as f:
        f.write(content)

    # Create document record
    document = Document(
        id=doc_id,
        filename=file.filename or safe_filename,
        file_hash=file_hash,
        file_path=str(stored_path),
        mime_type=file.content_type or ("application/pdf" if ext == ".pdf" else "image/png"),
        file_size=len(content),
        status="Processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Run processing pipeline immediately
    await process_document_pipeline(db, document)
    db.refresh(document)

    return document


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Document)
    if status and status != "all":
        query = query.filter(Document.status == status)
    if search:
        query = query.filter(Document.filename.ilike(f"%{search}%"))
    return query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_detail(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/preview/{page}")
def get_document_page_preview(document_id: str, page: int = 1, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    preview_file = settings.PREVIEW_DIR / f"{document_id}_page_{page}.png"
    if not preview_file.exists():
        # If preview not generated yet, try to regenerate
        if Path(doc.file_path).exists() and doc.mime_type == "application/pdf":
            import fitz
            pdf = fitz.open(doc.file_path)
            if page <= len(pdf):
                p = pdf[page - 1]
                pix = p.get_pixmap(dpi=150)
                pix.save(str(preview_file))

    if not preview_file.exists():
        raise HTTPException(status_code=404, detail="Page preview not available")

    return FileResponse(preview_file, media_type="image/png")


@router.get("/{document_id}/file")
def get_document_file(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not Path(doc.file_path).exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(doc.file_path, filename=doc.filename, media_type=doc.mime_type)


@router.post("/{document_id}/reprocess", response_model=DocumentDetailResponse)
async def reprocess_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await process_document_pipeline(db, doc)
    db.refresh(doc)
    return doc


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove physical files
    if Path(doc.file_path).exists():
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Remove previews
    for p in range(1, doc.page_count + 1):
        prev = settings.PREVIEW_DIR / f"{document_id}_page_{p}.png"
        if prev.exists():
            try:
                os.remove(prev)
            except Exception:
                pass

    db.delete(doc)
    db.commit()
    return {"message": f"Document {document_id} and associated records deleted"}
