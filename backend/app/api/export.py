import csv
import io
from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import FinancialRecord, Document

router = APIRouter(prefix="/api/export", tags=["export"])


def format_decimal(cents: int) -> str:
    return str(Decimal(cents) / Decimal(100))


@router.get("/csv")
def export_csv(
    status: Optional[str] = Query(None, description="Filter by status: e.g. 'Confirmed' or 'all'"),
    category: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Exports accountant-ready CSV with RFC 4180 compliance, correct escaping,
    and verified financial attributes.
    """
    query = db.query(FinancialRecord).join(Document)

    if status and status != "all":
        query = query.filter(FinancialRecord.status == status)
    if category and category != "all":
        query = query.filter(FinancialRecord.category == category)
    if date_from:
        query = query.filter(FinancialRecord.invoice_date >= date_from)
    if date_to:
        query = query.filter(FinancialRecord.invoice_date <= date_to)

    records = query.order_by(FinancialRecord.invoice_date.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")

    # Header
    headers = [
        "Document_ID",
        "Source_Filename",
        "Vendor_Name",
        "Invoice_Number",
        "Invoice_Date",
        "Due_Date",
        "Currency",
        "Subtotal",
        "Tax_Amount",
        "Total_Amount",
        "Category",
        "Description",
        "Payment_Terms",
        "Review_Status",
        "Confirmed_By",
        "Confirmed_At",
    ]
    writer.writerow(headers)

    for rec in records:
        writer.writerow([
            rec.document_id,
            rec.document.filename if rec.document else "N/A",
            rec.vendor_name,
            rec.invoice_number or "",
            rec.invoice_date or "",
            rec.due_date or "",
            rec.currency,
            format_decimal(rec.subtotal_cents),
            format_decimal(rec.tax_cents),
            format_decimal(rec.total_cents),
            rec.category,
            rec.description or "",
            rec.payment_terms or "",
            rec.status,
            rec.confirmed_by or "",
            rec.confirmed_at.strftime("%Y-%m-%d %H:%M:%S") if rec.confirmed_at else "",
        ])

    csv_data = output.getvalue()
    filename = f"billsathi_financial_register_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
