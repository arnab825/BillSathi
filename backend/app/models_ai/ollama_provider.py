import json
import logging
import re
import time
from typing import Dict, Any
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
  "vendor_name": "String - Seller or service provider name",
  "invoice_number": "String or null - Unique invoice or bill number",
  "invoice_date": "String or null - Format YYYY-MM-DD",
  "due_date": "String or null - Format YYYY-MM-DD",
  "currency": "String - 3 letter code e.g. USD, EUR, GBP, INR",
  "subtotal": "String or null - Pre-tax amount e.g. '100.00'",
  "tax_amount": "String or null - Total tax e.g. '10.00'",
  "total_amount": "String - Final payable total amount e.g. '110.00'",
  "category_suggestion": "One of: Software, Cloud Hosting, Travel & Lodging, Equipment, Office Supplies, Professional Services, Meals & Entertainment, Other",
  "description": "String or null - Concise summary of items or services",
  "payment_terms": "String or null - e.g. Net 30, Due upon receipt",
  "source_snippets": {
    "vendor_name": "Exact text substring where vendor was found",
    "invoice_number": "Exact text substring where invoice number was found",
    "total_amount": "Exact text substring where total amount was found"
  }
}
Do NOT include markdown formatting, code block fences, or explanatory conversational text. Output pure JSON only.
"""


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
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
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

            try:
                output = LLMExtractionOutput.model_validate(parsed_dict)
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
