import json
import re
from typing import List, Optional, Tuple
from app.extraction.pdf_parser import TextSpan
from app.schemas.extraction import LLMExtractionOutput


def find_best_span_match(
    search_terms: List[str], spans: List[TextSpan]
) -> Tuple[Optional[str], Optional[int], Optional[List[float]]]:
    """
    Searches for candidate terms in document text spans.
    Returns (matched_original_text, page_number, bbox) or (None, None, None) if not found.
    NEVER invents a bounding box if no text match is found.
    """
    clean_terms = [t.strip() for t in search_terms if t and len(t.strip()) > 1]
    if not clean_terms:
        return None, None, None

    # 1. Exact match pass
    for term in clean_terms:
        for span in spans:
            if term.lower() in span.text.lower():
                return span.text, span.page, span.bbox

    # 2. Tokenized numeric/code pass (e.g. matching 1250 in "$1,250.00")
    for term in clean_terms:
        # Strip currency symbols and commas
        stripped = re.sub(r"[^\w.]", "", term)
        if len(stripped) > 2:
            for span in spans:
                span_stripped = re.sub(r"[^\w.]", "", span.text)
                if stripped.lower() in span_stripped.lower():
                    return span.text, span.page, span.bbox

    return None, None, None


def link_evidence_for_fields(
    doc_id: str,
    llm_output: LLMExtractionOutput,
    spans: List[TextSpan],
    extraction_method: str = "ai_model",
) -> List[dict]:
    """
    Maps each extracted field in LLMExtractionOutput to supporting text evidence
    and physical page coordinates. Never invents coordinates.
    """
    field_mappings = [
        ("vendor_name", [llm_output.vendor_name, llm_output.source_snippets.get("vendor_name", "")]),
        ("invoice_number", [llm_output.invoice_number or "", llm_output.source_snippets.get("invoice_number", "")]),
        ("invoice_date", [llm_output.invoice_date or "", llm_output.source_snippets.get("invoice_date", "")]),
        ("due_date", [llm_output.due_date or "", llm_output.source_snippets.get("due_date", "")]),
        ("currency", [llm_output.currency or "", "$", "€", "£", "USD", "EUR", "GBP"]),
        ("subtotal", [llm_output.subtotal or "", llm_output.source_snippets.get("subtotal", "")]),
        ("tax", [llm_output.tax_amount or "", llm_output.source_snippets.get("tax_amount", "")]),
        ("total", [llm_output.total_amount or "", llm_output.source_snippets.get("total_amount", "")]),
        ("category", [f"category: {llm_output.category_suggestion}" if llm_output.category_suggestion else ""]),
        ("description", [llm_output.description or "", llm_output.source_snippets.get("description", "")]),
        ("payment_terms", [llm_output.payment_terms or "", llm_output.source_snippets.get("payment_terms", "")]),
    ]

    results = []

    for field_name, candidates in field_mappings:
        orig_text, page, bbox = find_best_span_match(candidates, spans)

        # Value to display
        val = getattr(llm_output, field_name, None)
        if field_name == "tax":
            val = llm_output.tax_amount
        elif field_name == "total":
            val = llm_output.total_amount
        elif field_name == "category":
            val = llm_output.category_suggestion

        bbox_json = json.dumps(bbox) if bbox else None
        
        # Determine validation status
        validation_status = "valid"
        if not val and field_name in ["vendor_name", "total", "invoice_date"]:
            validation_status = "warning"
        elif not bbox and field_name not in ["category", "currency"]:
            validation_status = "unverified"

        results.append({
            "document_id": doc_id,
            "field_name": field_name,
            "original_text": orig_text or (candidates[0] if candidates and candidates[0] else None),
            "normalized_value": str(val) if val is not None else None,
            "page_number": page or 1,
            "bbox_json": bbox_json,
            "extraction_method": extraction_method,
            "confidence": 0.95 if bbox else 0.70,
            "is_reviewed": False,
            "is_corrected": False,
            "validation_status": validation_status,
        })

    return results
