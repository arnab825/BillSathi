from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class FinancialRecordBase(BaseModel):
    vendor_name: str
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: str = "USD"
    subtotal_cents: int = 0
    tax_cents: int = 0
    total_cents: int = 0
    category: str = "Other"
    description: Optional[str] = None
    payment_terms: Optional[str] = None


class FinancialRecordUpdate(BaseModel):
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: Optional[str] = None
    subtotal_cents: Optional[int] = None
    tax_cents: Optional[int] = None
    total_cents: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    payment_terms: Optional[str] = None
    user_note: Optional[str] = None


class FinancialRecordResponse(FinancialRecordBase):
    id: str
    document_id: str
    status: str
    confirmed_at: Optional[datetime] = None
    confirmed_by: Optional[str] = None
    exported_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnomalyResponse(BaseModel):
    id: str
    document_id: str
    rule_code: str
    severity: str
    title: str
    message: str
    affected_fields: str
    is_resolved: bool
    resolution_action: Optional[str] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolveAnomalyRequest(BaseModel):
    resolution_action: str = Field(description="ACCEPTED_OVERRIDE, CORRECTED_FIELD, or DISMISSED")
    resolution_note: Optional[str] = None


class AnomalyExplanationResponse(BaseModel):
    anomaly_id: str
    rule_code: str
    explanation: str
    suggested_action: str
    suggested_note: str
    risk_level: str
    confidence: float


class VendorProfileResponse(BaseModel):
    id: str
    name: str
    default_category: str
    total_spend_cents: int
    invoice_count: int
    average_amount_cents: int
    min_amount_cents: int
    max_amount_cents: int
    first_seen_at: datetime
    last_seen_at: datetime

    model_config = {"from_attributes": True}


class VendorComparison(BaseModel):
    vendor_name: str
    current_invoice_number: Optional[str]
    current_amount_cents: int
    historical_count: int
    historical_average_cents: int
    historical_min_cents: int
    historical_max_cents: int
    difference_pct: float
    is_drift_detected: bool
    historical_invoices: List[dict]


class DashboardStatsResponse(BaseModel):
    total_documents: int
    imported_count: int
    needs_review_count: int
    reviewed_count: int
    confirmed_count: int
    exported_count: int
    total_anomalies: int
    unresolved_anomalies: int
    potential_duplicates: int
    total_spend_cents: int
    confirmed_spend_cents: int
    recent_vendors: List[dict]
    monthly_breakdown: List[dict]
