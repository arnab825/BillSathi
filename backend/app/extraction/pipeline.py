import logging
from pathlib import Path
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.models.entities import Document, ExtractedField, FinancialRecord, Anomaly, VendorProfile, AuditLog
from app.extraction.pdf_parser import parse_pdf_document, parse_image_document
from app.extraction.evidence_linker import link_evidence_for_fields
from app.models_ai.factory import get_active_model
from app.validation.deterministic_rules import run_deterministic_checks, to_cents

logger = logging.getLogger(__name__)


async def process_document_pipeline(
    db: Session,
    document: Document,
) -> Document:
    """
    Executes the full BillSathi extraction and verification pipeline:
    1. Parse text & spatial coordinates
    2. Model extraction (Ollama or Fallback Engine)
    3. Strict Pydantic validation
    4. Coordinate & text evidence linking
    5. Deterministic financial & duplicate checks
    6. Relational persistence
    """
    try:
        document.status = "Processing"
        db.commit()

        file_path = Path(document.file_path)

        # 1. Spatial Parsing
        if document.mime_type == "application/pdf":
            parsed = parse_pdf_document(file_path, settings.PREVIEW_DIR, document.id)
        else:
            parsed = parse_image_document(file_path, settings.PREVIEW_DIR, document.id)

        document.page_count = parsed.page_count
        document.raw_text = parsed.raw_text

        # 2. Open-Weight AI Extraction
        active_model = await get_active_model()
        model_info = active_model.get_provider_info()
        extraction_method = "ai_model" if "Ollama" in model_info["provider"] else "regex_rule"

        extracted_data = await active_model.extract(parsed.raw_text)

        # 3. Currency and Minor Units Normalization
        subtotal_cents = to_cents(extracted_data.subtotal)
        tax_cents = to_cents(extracted_data.tax_amount)
        total_cents = to_cents(extracted_data.total_amount)

        # 4. Clear old relations if reprocessing
        db.query(ExtractedField).filter(ExtractedField.document_id == document.id).delete()
        db.query(FinancialRecord).filter(FinancialRecord.document_id == document.id).delete()
        db.query(Anomaly).filter(Anomaly.document_id == document.id).delete()

        # 5. Create Financial Record
        fin_record = FinancialRecord(
            document_id=document.id,
            vendor_name=extracted_data.vendor_name or "Unknown Vendor",
            invoice_number=extracted_data.invoice_number,
            invoice_date=extracted_data.invoice_date,
            due_date=extracted_data.due_date,
            currency=extracted_data.currency or "USD",
            subtotal_cents=subtotal_cents,
            tax_cents=tax_cents,
            total_cents=total_cents,
            category=extracted_data.category_suggestion or "Other",
            description=extracted_data.description,
            payment_terms=extracted_data.payment_terms,
            status="Needs review",
        )
        db.add(fin_record)
        db.flush()

        # 6. Evidence Linking
        field_dicts = link_evidence_for_fields(
            document.id, extracted_data, parsed.spans, extraction_method=extraction_method
        )
        for fd in field_dicts:
            db.add(ExtractedField(**fd))

        # 7. Deterministic Financial & Integrity Checks
        anomalies = run_deterministic_checks(db, document, fin_record, document.file_hash)
        for anom in anomalies:
            db.add(anom)

        # 8. Vendor Profile Update
        vendor_name_clean = fin_record.vendor_name.strip()
        vendor = db.query(VendorProfile).filter(VendorProfile.name.ilike(vendor_name_clean)).first()
        if not vendor:
            vendor = VendorProfile(
                name=vendor_name_clean,
                normalized_name=vendor_name_clean.lower(),
                default_category=fin_record.category,
                total_spend_cents=fin_record.total_cents,
                invoice_count=1,
                average_amount_cents=fin_record.total_cents,
                min_amount_cents=fin_record.total_cents,
                max_amount_cents=fin_record.total_cents,
            )
            db.add(vendor)
        else:
            # Recompute vendor metrics
            vendor.invoice_count += 1
            vendor.total_spend_cents += fin_record.total_cents
            vendor.average_amount_cents = vendor.total_spend_cents // vendor.invoice_count
            if fin_record.total_cents < vendor.min_amount_cents or vendor.min_amount_cents == 0:
                vendor.min_amount_cents = fin_record.total_cents
            if fin_record.total_cents > vendor.max_amount_cents:
                vendor.max_amount_cents = fin_record.total_cents
            vendor.last_seen_at = datetime.utcnow()

        # 9. Determine Final Document Status
        critical_anomalies = [a for a in anomalies if a.severity in ["critical", "warning"]]
        if critical_anomalies:
            document.status = "Needs review"
            fin_record.status = "Needs review"
        else:
            document.status = "Reviewed"
            fin_record.status = "Reviewed"

        # 10. Audit Log
        db.add(
            AuditLog(
                document_id=document.id,
                action_type="PIPELINE_PROCESSED",
                user_note=f"Processed via {model_info['provider']}. {len(anomalies)} validation findings.",
            )
        )

        db.commit()
        db.refresh(document)
        return document

    except Exception as e:
        logger.exception(f"Error processing document {document.id}: {e}")
        db.rollback()
        document.status = "Needs review"
        document.error_message = str(e)
        db.commit()
        return document
