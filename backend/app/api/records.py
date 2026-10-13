from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import FinancialRecord, Document, ExtractedField, AuditLog, Anomaly
from app.schemas.financial import FinancialRecordResponse, FinancialRecordUpdate

router = APIRouter(prefix="/api/records", tags=["financial_records"])


class FieldUpdateRequest(BaseModel):
    user_corrected_value: str
    is_reviewed: bool = True
    user_note: Optional[str] = None


@router.get("", response_model=List[FinancialRecordResponse])
def list_financial_records(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(FinancialRecord).join(Document)

    if status and status != "all":
        query = query.filter(FinancialRecord.status == status)
    if vendor and vendor != "all":
        query = query.filter(FinancialRecord.vendor_name.ilike(f"%{vendor}%"))
    if category and category != "all":
        query = query.filter(FinancialRecord.category == category)
    if date_from:
        query = query.filter(FinancialRecord.invoice_date >= date_from)
    if date_to:
        query = query.filter(FinancialRecord.invoice_date <= date_to)
    if search:
        query = query.filter(
            (FinancialRecord.vendor_name.ilike(f"%{search}%"))
            | (FinancialRecord.invoice_number.ilike(f"%{search}%"))
            | (FinancialRecord.description.ilike(f"%{search}%"))
        )

    return query.order_by(FinancialRecord.invoice_date.desc(), FinancialRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{record_id}", response_model=FinancialRecordResponse)
def get_financial_record(record_id: str, db: Session = Depends(get_db)):
    rec = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Financial record not found")
    return rec


@router.put("/{record_id}", response_model=FinancialRecordResponse)
def update_financial_record(
    record_id: str,
    update_data: FinancialRecordUpdate,
    db: Session = Depends(get_db),
):
    """
    Human-in-the-loop: Updates financial record fields, marks record Reviewed,
    and logs an audit trail entry.
    """
    rec = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Financial record not found")

    changes = []
    for field, val in update_data.model_dump(exclude_unset=True).items():
        if field == "user_note":
            continue
        old_val = getattr(rec, field)
        if old_val != val:
            setattr(rec, field, val)
            changes.append(f"{field}: '{old_val}' -> '{val}'")

    if changes:
        rec.status = "Reviewed"
        doc = db.query(Document).filter(Document.id == rec.document_id).first()
        if doc and doc.status != "Confirmed":
            doc.status = "Reviewed"

        db.add(
            AuditLog(
                document_id=rec.document_id,
                action_type="RECORD_EDITED",
                user_note=update_data.user_note or f"Updated fields: {', '.join(changes)}",
            )
        )
        db.commit()
        db.refresh(rec)

    return rec


@router.post("/{record_id}/confirm", response_model=FinancialRecordResponse)
def confirm_financial_record(
    record_id: str,
    reviewer_name: str = Query("Human Reviewer"),
    db: Session = Depends(get_db),
):
    """
    Final Human Confirmation: Promotes record to 'Confirmed' state.
    Records confirmed timestamp and reviewer.
    """
    rec = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Financial record not found")

    rec.status = "Confirmed"
    rec.confirmed_at = datetime.utcnow()
    rec.confirmed_by = reviewer_name

    doc = db.query(Document).filter(Document.id == rec.document_id).first()
    if doc:
        doc.status = "Confirmed"

    db.add(
        AuditLog(
            document_id=rec.document_id,
            action_type="RECORD_CONFIRMED",
            user_note=f"Confirmed as accurate by {reviewer_name}. Ready for accountant export.",
        )
    )

    db.commit()
    db.refresh(rec)
    return rec


@router.put("/fields/{field_id}")
def update_extracted_field(
    field_id: str,
    req: FieldUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Updates an individual extracted field with human correction.
    """
    field = db.query(ExtractedField).filter(ExtractedField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Extracted field not found")

    old_val = field.user_corrected_value or field.normalized_value
    field.user_corrected_value = req.user_corrected_value
    field.is_reviewed = True
    field.is_corrected = True
    field.validation_status = "valid"

    db.add(
        AuditLog(
            document_id=field.document_id,
            action_type="FIELD_CORRECTED",
            field_name=field.field_name,
            old_value=str(old_val),
            new_value=req.user_corrected_value,
            user_note=req.user_note or f"Human corrected {field.field_name}",
        )
    )

    db.commit()
    db.refresh(field)
    return field
