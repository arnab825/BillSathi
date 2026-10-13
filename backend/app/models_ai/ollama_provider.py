import json
import logging
import re
import time
from typing import Dict, Any, Optional
import httpx
from pydantic import ValidationError
from app.core.config import settings
from app.models_ai.base import BaseExtractionModel
from app.schemas.extraction import LLMExtractionOutput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert financial document extractor for BillSathi.
Your task is to extract structured financial data from the document text.
You MUST output ONLY a valid JSON object matching the following structure exactly:
{
  "vendor_name": "String - Seller or service provider name (e.g. 'Acme Cloud Infrastructure')",
  "invoice_number": "String or null - Unique invoice or bill number (e.g. 'INV-2026-001')",
  "invoice_date": "String or null - Format YYYY-MM-DD",
  "due_date": "String or null - Format YYYY-MM-DD",
  "currency": "String - 3 letter code e.g. USD, EUR, GBP, INR",
  "subtotal": "String or null - Clean decimal number without currency symbols or commas, e.g. '1000.00'",
  "tax_amount": "String or null - Clean decimal number without currency symbols or commas, e.g. '100.00'",
  "total_amount": "String - Clean decimal number without currency symbols or commas, e.g. '1100.00'",
  "category_suggestion": "One of: Software, Cloud Hosting, Travel & Lodging, Equipment, Office Supplies, Professional Services, Meals & Entertainment, Other",
  "description": "String or null - Concise summary of items or services",
  "payment_terms": "String or null - e.g. Net 30, Due upon receipt",
  "source_snippets": {
    "vendor_name": "Exact text substring where vendor was found",
    "invoice_number": "Exact text substring where invoice number was found",
    "total_amount": "Exact text substring where total amount was found"
  }
}
CRITICAL RULES:
1. All monetary amounts must be clean numbers with period decimals only (e.g. '1000.00', NEVER '$1,000.00').
2. If a field is not found in the document, use null instead of making up values.
3. Output pure JSON only. Do NOT include markdown blocks or conversational text.
"""


def _sanitize_amount(val: Any) -> Optional[str]:
    """Cleans currency signs and commas from an amount string."""
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ["null", "none", "n/a"]:
        return None
    # Strip currency symbols and commas
    cleaned = re.sub(r"[^\d.]", "", val_str)
    try:
        # Validate it can be parsed as a float
        float(cleaned)
        return cleaned
    except ValueError:
        return None


def _sanitize_extraction_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures raw dict from AI adheres to LLMExtractionOutput schema without raising ValidationError."""
    res = dict(data)
    
    # Vendor
    if not res.get("vendor_name") or str(res.get("vendor_name")).strip().lower() in ["null", "none", "n/a"]:
        res["vendor_name"] = "Unknown Vendor"
    else:
        res["vendor_name"] = str(res["vendor_name"]).strip()

    # Currency
    if not res.get("currency") or str(res.get("currency")).strip().lower() in ["null", "none"]:
        res["currency"] = "USD"
    else:
        res["currency"] = str(res["currency"]).strip().upper()[:3]

    # Category
    valid_categories = {
        "Software", "Cloud Hosting", "Travel & Lodging", "Equipment",
        "Office Supplies", "Professional Services", "Meals & Entertainment", "Other"
    }
    cat = res.get("category_suggestion")
    if not cat or cat not in valid_categories:
        res["category_suggestion"] = "Other"

    # Monetary amounts
    res["subtotal"] = _sanitize_amount(res.get("subtotal"))
    res["tax_amount"] = _sanitize_amount(res.get("tax_amount"))
    total_cleaned = _sanitize_amount(res.get("total_amount"))
    res["total_amount"] = total_cleaned if total_cleaned is not None else "0.00"

    # Source snippets
    snippets = res.get("source_snippets")
    if isinstance(snippets, dict):
        clean_snips: Dict[str, Optional[str]] = {}
        for k, v in snippets.items():
            if v is not None:
                clean_snips[str(k)] = str(v)
            else:
                clean_snips[str(k)] = None
        res["source_snippets"] = clean_snips
    else:
        res["source_snippets"] = {}

    return res


class OllamaProvider(BaseExtractionModel):
    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model_name: str = settings.OLLAMA_MODEL,
        timeout: float = settings.OLLAMA_TIMEOUT_SECONDS,
    ):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout
        self.last_latency_ms: float = 0.0

    async def is_available(self) -> bool:
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                is_up = (res.status_code == 200)
                if is_up and self.last_latency_ms == 0.0:
                    self.last_latency_ms = (time.time() - start) * 1000
                return is_up
        except Exception:
            return False

    async def extract(self, raw_text: str) -> LLMExtractionOutput:
        start_time = time.time()
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": f"{SYSTEM_PROMPT}\n\nDOCUMENT TEXT:\n{raw_text[:4000]}\n\nJSON OUTPUT:",
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.0,
                "top_p": 0.1,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            self.last_latency_ms = (time.time() - start_time) * 1000

            if response.status_code != 200:
                raise RuntimeError(
                    f"Ollama returned status code {response.status_code}: {response.text}"
                )

            data = response.json()
            raw_response_text = data.get("response", "").strip()

            # Clean any possible markdown code block wrapper
            clean_json_str = re.sub(r"^```(?:json)?\s*", "", raw_response_text, flags=re.MULTILINE)
            clean_json_str = re.sub(r"\s*```$", "", clean_json_str, flags=re.MULTILINE).strip()

            try:
                parsed_dict = json.loads(clean_json_str)
            except json.JSONDecodeError as err:
                logger.error(f"Failed to parse Ollama JSON response: {raw_response_text}")
                raise ValueError(f"Ollama returned malformed JSON: {err}")

            # Sanitize and guard dictionary before Pydantic validation
            sanitized_dict = _sanitize_extraction_dict(parsed_dict)

            try:
                output = LLMExtractionOutput.model_validate(sanitized_dict)
                return output
            except ValidationError as val_err:
                logger.error(f"Pydantic schema validation failed: {val_err}")
                raise ValueError(f"Ollama output did not match expected schema: {val_err}")

    def get_provider_info(self) -> Dict[str, Any]:
        return {
            "provider": "Ollama (Open-Weight Local AI)",
            "model": self.model_name,
            "base_url": self.base_url,
            "last_latency_ms": round(self.last_latency_ms, 2),
            "status": "ready",
        }
