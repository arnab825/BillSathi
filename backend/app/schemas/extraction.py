from typing import Optional, List
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    # Coordinates in normalized 0..1000 scale [x0, y0, x1, y1] or standard PDF points
    x0: float
    y0: float
    x1: float
    y1: float
    page: int = 1


class ExtractedFieldSchema(BaseModel):
    field_name: str
    original_text: Optional[str] = None
    normalized_value: Optional[str] = None
    user_corrected_value: Optional[str] = None
    page_number: int = 1
    bbox: Optional[List[float]] = None  # [x0, y0, x1, y1]
    extraction_method: str = "ai_model"  # ai_model, regex_rule, ocr_coordinate, user_manual
    confidence: float = 1.0
    is_reviewed: bool = False
    is_corrected: bool = False
    validation_status: str = "unverified"  # valid, warning, error, unverified


class LLMExtractionOutput(BaseModel):
    """Resilient schema for Open-Weight models (Gemma 2 / 3 via Ollama) & fallback engine"""
    vendor_name: Optional[str] = Field(default="Unknown Vendor", description="Name of the company or person issuing the invoice/receipt")
    invoice_number: Optional[str] = Field(default=None, description="Invoice or receipt reference number")
    invoice_date: Optional[str] = Field(default=None, description="Date formatted as YYYY-MM-DD")
    due_date: Optional[str] = Field(default=None, description="Payment due date formatted as YYYY-MM-DD")
    currency: Optional[str] = Field(default="USD", description="Three-letter currency code, e.g. USD, EUR, GBP, INR")
    subtotal: Optional[str] = Field(default=None, description="Pre-tax amount as string e.g. '120.00'")
    tax_amount: Optional[str] = Field(default=None, description="Tax or VAT amount as string e.g. '12.00'")
    total_amount: Optional[str] = Field(default="0.00", description="Final total payable amount as string e.g. '132.00'")
    category_suggestion: Optional[str] = Field(
        default="Other",
        description="Suggested expense category: 'Software', 'Cloud Hosting', 'Travel & Lodging', 'Equipment', 'Office Supplies', 'Professional Services', 'Meals & Entertainment', 'Other'"
    )
    description: Optional[str] = Field(default=None, description="Concise description of purchased items or services")
    payment_terms: Optional[str] = Field(default=None, description="Payment terms, e.g., Net 30, Due on Receipt")
    
    # Ground truth source text snippets found directly in document text
    source_snippets: dict[str, Optional[str]] = Field(
        default_factory=dict,
        description="Map of field name to exact substring snippet verbatim from document"
    )
