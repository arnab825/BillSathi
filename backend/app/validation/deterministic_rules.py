import json
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Document, FinancialRecord, Anomaly, VendorProfile


def to_cents(val_str: Optional[str]) -> int:
    """Converts a currency string to integer minor units (cents) safely using Decimal."""
    if not val_str:
        return 0
    try:
        clean = val_str.replace("$", "").replace("€", "").replace("£", "").replace("₹", "").replace(",", "").strip()
        if not clean:
            return 0
        d = Decimal(clean)
        return int((d * Decimal(100)).quantize(Decimal("1")))
    except (InvalidOperation, ValueError):
        return 0


def format_cents(cents: int, currency: str = "USD") -> str:
    """Formats integer minor units to human-readable string without binary float drift."""
    d = Decimal(cents) / Decimal(100)
    symbol = "$"
    if currency == "EUR":
        symbol = "€"
    elif currency == "GBP":
        symbol = "£"
    elif currency == "INR":
        symbol = "₹"
    return f"{symbol}{d:.2f}"


def run_deterministic_checks(
    db: Session,
    document: Document,
    record: FinancialRecord,
    file_hash: str,
) -> List[Anomaly]:
    """
    Executes explainable financial validation checks on extracted financial data.
    AI is NEVER the authority on arithmetic or tax compliance.
    """
    anomalies: List[Anomaly] = []

    # 1. Exact Duplicate Check (SHA-256 file hash match)
    duplicate_doc = (
        db.query(Document)
        .filter(Document.file_hash == file_hash, Document.id != document.id)
        .first()
    )
    if duplicate_doc:
        anomalies.append(
            Anomaly(
                document_id=document.id,
                rule_code="EXACT_DUPLICATE",
                severity="critical",
                title="Exact Duplicate Document Detected",
                message=(
                    f"Identical SHA-256 cryptographic file hash detected matching document "
                    f"'{duplicate_doc.filename}' (ID: {duplicate_doc.id[:8]})."
                ),
                affected_fields=json.dumps(["file_hash"]),
            )
        )

    # 2. Attribute-Level Duplicate Check (Vendor + Invoice Number match)
    if record.invoice_number and record.vendor_name:
        existing_record = (
            db.query(FinancialRecord)
            .join(Document)
            .filter(
                FinancialRecord.vendor_name.ilike(record.vendor_name.strip()),
                FinancialRecord.invoice_number.ilike(record.invoice_number.strip()),
                FinancialRecord.document_id != document.id,
            )
            .first()
        )
        if existing_record:
            anomalies.append(
                Anomaly(
                    document_id=document.id,
                    rule_code="ATTRIBUTE_DUPLICATE",
                    severity="warning",
                    title="Duplicate Invoice Number for Vendor",
                    message=(
                        f"Invoice number '{record.invoice_number}' for vendor '{record.vendor_name}' "
                        f"already exists in recorded document '{existing_record.document.filename}'."
                    ),
                    affected_fields=json.dumps(["invoice_number", "vendor_name"]),
                )
            )

    # 3. Arithmetic Consistency Check (Subtotal + Tax == Total)
    # Using integer cents arithmetic: never floating-point
    if record.subtotal_cents > 0 and record.total_cents > 0:
        expected_total = record.subtotal_cents + record.tax_cents
        if expected_total != record.total_cents:
            diff_cents = abs(record.total_cents - expected_total)
            anomalies.append(
                Anomaly(
                    document_id=document.id,
                    rule_code="ARITHMETIC_MISMATCH",
                    severity="critical",
                    title="Calculation Inconsistency",
                    message=(
                        f"Subtotal ({format_cents(record.subtotal_cents, record.currency)}) + "
                        f"Tax ({format_cents(record.tax_cents, record.currency)}) = "
                        f"{format_cents(expected_total, record.currency)}, but printed Total is "
                        f"{format_cents(record.total_cents, record.currency)}. "
                        f"Discrepancy: {format_cents(diff_cents, record.currency)}. Please inspect source document."
                    ),
                    affected_fields=json.dumps(["subtotal", "tax", "total"]),
                )
            )

    # 4. Missing Invoice Identifier
    if not record.invoice_number or record.invoice_number.strip() == "":
        anomalies.append(
            Anomaly(
                document_id=document.id,
                rule_code="MISSING_INVOICE_ID",
                severity="warning",
                title="Missing Invoice / Receipt Number",
                message="No invoice reference number or receipt identifier was detected. Required for tax audits.",
                affected_fields=json.dumps(["invoice_number"]),
            )
        )

    # 5. Missing Document Date
    if not record.invoice_date or record.invoice_date.strip() == "":
        anomalies.append(
            Anomaly(
                document_id=document.id,
                rule_code="MISSING_DATE",
                severity="warning",
                title="Missing Invoice Date",
                message="No valid invoice date could be identified in the document. Required for accounting period attribution.",
                affected_fields=json.dumps(["invoice_date"]),
            )
        )

    # 6. Unitemized Tax / Difference Warning
    if record.subtotal_cents > 0 and record.tax_cents == 0 and record.total_cents > record.subtotal_cents:
        diff_cents = record.total_cents - record.subtotal_cents
        anomalies.append(
            Anomaly(
                document_id=document.id,
                rule_code="MISSING_TAX",
                severity="info",
                title="Unitemized Difference / Implicit Tax",
                message=(
                    f"Total ({format_cents(record.total_cents, record.currency)}) exceeds subtotal "
                    f"({format_cents(record.subtotal_cents, record.currency)}) by "
                    f"{format_cents(diff_cents, record.currency)}, but tax is recorded as zero. "
                    "Difference may represent unitemized tax, shipping, or fee."
                ),
                affected_fields=json.dumps(["tax", "subtotal", "total"]),
            )
        )

    # 7. Vendor Historical Price Drift (Only when >= 2 prior records exist)
    if record.vendor_name and record.total_cents > 0:
        vendor_records = (
            db.query(FinancialRecord)
            .filter(
                FinancialRecord.vendor_name.ilike(record.vendor_name.strip()),
                FinancialRecord.document_id != document.id,
                FinancialRecord.total_cents > 0,
            )
            .all()
        )
        if len(vendor_records) >= settings.MIN_HISTORICAL_INVOICES_FOR_DRIFT:
            total_sum = sum(r.total_cents for r in vendor_records)
            avg_cents = total_sum // len(vendor_records)
            if avg_cents > 0:
                diff_pct = abs(record.total_cents - avg_cents) / avg_cents * 100.0
                if diff_pct >= settings.PRICE_DRIFT_THRESHOLD_PCT:
                    sign = "+" if record.total_cents > avg_cents else "-"
                    anomalies.append(
                        Anomaly(
                            document_id=document.id,
                            rule_code="PRICE_DRIFT",
                            severity="info",
                            title="Vendor Expense Drift",
                            message=(
                                f"Current invoice total of {format_cents(record.total_cents, record.currency)} "
                                f"differs by {sign}{diff_pct:.1f}% from the historical average of "
                                f"{format_cents(avg_cents, record.currency)} across {len(vendor_records)} "
                                f"prior invoices from '{record.vendor_name}'. "
                                "This is a statistical note, not an accusation of fraud."
                            ),
                            affected_fields=json.dumps(["total", "vendor_name"]),
                        )
                    )

    return anomalies
