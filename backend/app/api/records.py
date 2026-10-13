from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import FinancialRecord, Document, ExtractedField, AuditLog, Anomaly
from app.schemas.financial import FinancialRecordResponse, FinancialRecordUpdate
from app.validation.deterministic_rules import run_deterministic_checks, to_cents

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

    # Automatically resolve remaining anomalies when human reviewer confirms financial fact
    unresolved_anoms = (
        db.query(Anomaly)
        .filter(Anomaly.document_id == rec.document_id, Anomaly.is_resolved == False)
        .all()
    )
    for anom in unresolved_anoms:
        anom.is_resolved = True
        anom.resolution_action = "ACCEPTED_OVERRIDE"
        anom.resolution_note = f"Confirmed as valid financial fact by {reviewer_name}"
        anom.resolved_at = datetime.utcnow()

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
    Updates an individual extracted field with human correction, synchronizes
    with the underlying financial record, and re-evaluates deterministic checks.
    Preserves human anomaly resolutions.
    """
    field = db.query(ExtractedField).filter(ExtractedField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Extracted field not found")

    old_val = field.user_corrected_value or field.normalized_value
    field.user_corrected_value = req.user_corrected_value
    field.is_reviewed = True
    field.is_corrected = True
    field.validation_status = "valid"

    # Synchronize with FinancialRecord
    rec = db.query(FinancialRecord).filter(FinancialRecord.document_id == field.document_id).first()
    doc = db.query(Document).filter(Document.id == field.document_id).first()

    if rec:
        fn = field.field_name.lower().strip()
        if fn in ["total", "total_amount"]:
            rec.total_cents = to_cents(req.user_corrected_value)
        elif fn in ["subtotal", "sub_total"]:
            rec.subtotal_cents = to_cents(req.user_corrected_value)
        elif fn in ["tax", "tax_amount"]:
            rec.tax_cents = to_cents(req.user_corrected_value)
        elif fn == "vendor_name":
            rec.vendor_name = req.user_corrected_value
        elif fn == "invoice_number":
            rec.invoice_number = req.user_corrected_value
        elif fn == "invoice_date":
            rec.invoice_date = req.user_corrected_value
        elif fn == "due_date":
            rec.due_date = req.user_corrected_value
        elif fn == "currency":
            rec.currency = req.user_corrected_value
        elif fn == "category":
            rec.category = req.user_corrected_value
        elif fn == "payment_terms":
            rec.payment_terms = req.user_corrected_value

        # Re-evaluate deterministic integrity & math checks
        # Save any previously resolved anomalies so human resolution rationale is not lost!
        resolved_anomalies_map = {
            a.rule_code: (a.resolution_action, a.resolution_note, a.resolved_at)
            for a in db.query(Anomaly)
            .filter(Anomaly.document_id == field.document_id, Anomaly.is_resolved == True)
            .all()
        }
        db.query(Anomaly).filter(Anomaly.document_id == field.document_id).delete()
        if doc:
            new_anomalies = run_deterministic_checks(db, doc, rec, doc.file_hash)
            for anom in new_anomalies:
                if anom.rule_code in resolved_anomalies_map:
                    action, note, res_at = resolved_anomalies_map[anom.rule_code]
                    anom.is_resolved = True
                    anom.resolution_action = action
                    anom.resolution_note = note
                    anom.resolved_at = res_at
                db.add(anom)

            critical_unresolved = [
                a for a in new_anomalies
                if a.severity in ["critical", "warning"] and not a.is_resolved
            ]
            if not critical_unresolved:
                doc.status = "Reviewed"
                rec.status = "Reviewed"
            else:
                doc.status = "Needs review"
                rec.status = "Needs review"

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

