from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import VendorProfile, FinancialRecord, Document
from app.schemas.financial import VendorProfileResponse, VendorComparison

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


@router.get("", response_model=List[VendorProfileResponse])
def list_vendors(db: Session = Depends(get_db)):
    return db.query(VendorProfile).order_by(VendorProfile.total_spend_cents.desc()).all()


@router.get("/{vendor_name}/comparison", response_model=VendorComparison)
def get_vendor_comparison(
    vendor_name: str,
    current_invoice_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Vendor Intelligence: Compares historical documents from the same vendor.
    Shows the exact calculation and documents used. Never presents anomaly as fraud.
    """
    records_query = (
        db.query(FinancialRecord)
        .join(Document)
        .filter(FinancialRecord.vendor_name.ilike(vendor_name.strip()))
    )
    all_records = records_query.order_by(FinancialRecord.invoice_date.desc()).all()

    if not all_records:
        raise HTTPException(status_code=404, detail=f"No invoices found for vendor '{vendor_name}'")

    current_record = None
    if current_invoice_id:
        current_record = next((r for r in all_records if r.document_id == current_invoice_id), None)
    if not current_record:
        current_record = all_records[0]

    historical = [r for r in all_records if r.id != current_record.id]

    if not historical:
        # Single invoice, no historical drift possible
        return VendorComparison(
            vendor_name=current_record.vendor_name,
            current_invoice_number=current_record.invoice_number,
            current_amount_cents=current_record.total_cents,
            historical_count=1,
            historical_average_cents=current_record.total_cents,
            historical_min_cents=current_record.total_cents,
            historical_max_cents=current_record.total_cents,
            difference_pct=0.0,
            is_drift_detected=False,
            historical_invoices=[
                {
                    "id": current_record.id,
                    "document_id": current_record.document_id,
                    "invoice_number": current_record.invoice_number,
                    "invoice_date": current_record.invoice_date,
                    "total_cents": current_record.total_cents,
                    "category": current_record.category,
                    "status": f"{current_record.status} (Baseline)",
                }
            ],
        )

    hist_sum = sum(h.total_cents for h in historical)
    hist_avg = hist_sum // len(historical)
    hist_min = min(h.total_cents for h in historical)
    hist_max = max(h.total_cents for h in historical)

    diff_pct = 0.0
    if hist_avg > 0:
        diff_pct = round(((current_record.total_cents - hist_avg) / hist_avg) * 100.0, 1)

    is_drift = abs(diff_pct) > 25.0 and len(historical) >= 2

    hist_items = [
        {
            "id": h.id,
            "document_id": h.document_id,
            "invoice_number": h.invoice_number,
            "invoice_date": h.invoice_date,
            "total_cents": h.total_cents,
            "category": h.category,
            "status": h.status,
        }
        for h in historical
    ]

    return VendorComparison(
        vendor_name=current_record.vendor_name,
        current_invoice_number=current_record.invoice_number,
        current_amount_cents=current_record.total_cents,
        historical_count=len(historical),
        historical_average_cents=hist_avg,
        historical_min_cents=hist_min,
        historical_max_cents=hist_max,
        difference_pct=diff_pct,
        is_drift_detected=is_drift,
        historical_invoices=hist_items,
    )
