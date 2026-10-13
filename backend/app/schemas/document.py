from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.financial import FinancialRecordResponse, AnomalyResponse


class ExtractedFieldDetail(BaseModel):
    id: str
    field_name: str
    original_text: Optional[str] = None
    normalized_value: Optional[str] = None
    user_corrected_value: Optional[str] = None
    page_number: int = 1
    bbox_json: Optional[str] = None
    extraction_method: str
    confidence: float
    is_reviewed: bool
    is_corrected: bool
    validation_status: str

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: str
    action_type: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user_note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_hash: str
    mime_type: str
    file_size: int
    page_count: int
    status: str
    ocr_applied: bool
    raw_text: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    extracted_fields: List[ExtractedFieldDetail] = []
    financial_record: Optional[FinancialRecordResponse] = None
    anomalies: List[AnomalyResponse] = []
    audit_logs: List[AuditLogResponse] = []
