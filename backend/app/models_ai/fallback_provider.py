import re
import time
from typing import Dict, Any, Optional
from datetime import datetime
from app.models_ai.base import BaseExtractionModel
from app.schemas.extraction import LLMExtractionOutput


class FallbackExtractionProvider(BaseExtractionModel):
    """
    Deterministic rule-based extraction engine for when Ollama is offline or uninstalled.
    Uses regex patterns, amount extraction heuristics, and category keyword matching.
    """
    def __init__(self):
        self.last_latency_ms: float = 0.0

    async def is_available(self) -> bool:
        return True

    def _normalize_date(self, text: str) -> Optional[str]:
        # Formats: 2026-10-15, 10/15/2026, 15-Oct-2026, October 15, 2026
        patterns = [
            (r"\b(\d{4})-(\d{1,2})-(\d{1,2})\b", "%Y-%m-%d"),
            (r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", "%m/%d/%Y"),
            (r"\b(\d{1,2})-(\d{1,2})-(\d{4})\b", "%d-%m-%Y"),
            (r"\b([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\b", "%B %d %Y"),
        ]
        for pat, fmt in patterns:
            match = re.search(pat, text)
            if match:
                raw_str = match.group(0).replace(",", "")
                try:
                    dt = datetime.strptime(raw_str, fmt)
                    return dt.strftime("%Y-%m-%d")
                except Exception:
                    continue
        return None

    def _extract_amount(self, text: str, label_pattern: str) -> Optional[str]:
        # Looks for lines like "Total: $1,250.00" or "Subtotal 1200.00"
        pattern = rf"{label_pattern}\s*[:\-]?\s*[\$€£₹]?\s*([0-9,]+\.[0-9]{{2}}|[0-9,]+)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_amt = match.group(1).replace(",", "")
            return raw_amt
        return None

    async def extract(self, raw_text: str) -> LLMExtractionOutput:
        start_time = time.time()
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        # 1. Vendor Name
        vendor = "Unknown Vendor"
        source_snippets: Dict[str, str] = {}
        for line in lines[:8]:
            if not re.search(r"invoice|bill|receipt|date|total|tax|#", line, re.IGNORECASE):
                if len(line) > 2 and len(line) < 50:
                    vendor = line
                    source_snippets["vendor_name"] = line
                    break

        # 2. Invoice Number
        inv_match = re.search(r"(?:invoice\s*(?:#|no\.?|number)?|inv\s*#?)\s*[:#\-]\s*([A-Za-z0-9\-_]+)", raw_text, re.IGNORECASE)
        if not inv_match:
            inv_match = re.search(r"\b([A-Z]{3,}-[0-9]{4}-[0-9]+|[A-Z]{2,}-[0-9]+)\b", raw_text)
        invoice_number = None
        if inv_match:
            invoice_number = inv_match.group(1).strip()
            source_snippets["invoice_number"] = inv_match.group(0)

        # 3. Dates
        invoice_date = self._normalize_date(raw_text)
        if invoice_date:
            source_snippets["invoice_date"] = invoice_date

        # 4. Currency
        currency = "USD"
        if "€" in raw_text or "EUR" in raw_text:
            currency = "EUR"
        elif "£" in raw_text or "GBP" in raw_text:
            currency = "GBP"
        elif "₹" in raw_text or "INR" in raw_text:
            currency = "INR"

        # 5. Financial Amounts
        subtotal = self._extract_amount(raw_text, r"\b(?:subtotal|sub-total|net\s*amount)\b")
        tax = self._extract_amount(raw_text, r"\b(?:tax(?:\s*\([^)]*\))?|vat|gst|sales\s*tax)")
        total = self._extract_amount(raw_text, r"\b(?:total\s*due|final\s*total|balance\s*due|total\s*amount|total)\b")

        if subtotal:
            source_snippets["subtotal"] = subtotal
        if tax:
            source_snippets["tax_amount"] = tax
        if total:
            source_snippets["total_amount"] = total
        else:
            # Fallback to any prominent currency figure
            any_amt = re.findall(r"\$\s*([0-9,]+\.[0-9]{2})", raw_text)
            total = any_amt[-1].replace(",", "") if any_amt else "0.00"

        # 6. Category Suggestion
        category = "Other"
        text_lower = raw_text.lower()
        if any(w in text_lower for w in ["aws", "cloud", "hosting", "server", "domain", "digitalocean", "vultr"]):
            category = "Cloud Hosting"
        elif any(w in text_lower for w in ["software", "saas", "subscription", "github", "figma", "slack", "notion"]):
            category = "Software"
        elif any(w in text_lower for w in ["airline", "flight", "hotel", "uber", "taxi", "lodging", "travel"]):
            category = "Travel & Lodging"
        elif any(w in text_lower for w in ["laptop", "monitor", "hardware", "macbook", "electronics", "keyboard"]):
            category = "Equipment"
        elif any(w in text_lower for w in ["paper", "pen", "office", "desk", "stationery", "stapler"]):
            category = "Office Supplies"
        elif any(w in text_lower for w in ["consulting", "legal", "accounting", "advisory", "freelance", "design"]):
            category = "Professional Services"

        # 7. Description
        description = f"Invoice from {vendor}"
        for line in lines[3:12]:
            if any(w in line.lower() for w in ["plan", "tier", "subscription", "service", "license", "hours", "item"]):
                description = line
                source_snippets["description"] = line
                break

        self.last_latency_ms = (time.time() - start_time) * 1000

        return LLMExtractionOutput(
            vendor_name=vendor,
            invoice_number=invoice_number,
            invoice_date=invoice_date,
            due_date=None,
            currency=currency,
            subtotal=subtotal,
            tax_amount=tax,
            total_amount=total,
            category_suggestion=category,
            description=description,
            payment_terms="Net 30",
            source_snippets=source_snippets,
        )

    def get_provider_info(self) -> Dict[str, Any]:
        return {
            "provider": "Deterministic Fallback Engine (Rule-Based Regex)",
            "model": "regex-heuristics-v1",
            "base_url": "in-process",
            "last_latency_ms": round(self.last_latency_ms, 2),
            "status": "ready (fallback active)",
        }
