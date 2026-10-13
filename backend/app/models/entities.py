import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, default=1)
    status = Column(
        String(50),
        default="Imported",
        index=True,
    )  # Imported, Processing, Needs review, Reviewed, Confirmed, Exported
    ocr_applied = Column(Boolean, default=False)
    raw_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships with cascade delete
    extracted_fields = relationship(
        "ExtractedField",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="ExtractedField.field_name",
    )
    financial_record = relationship(
        "FinancialRecord",
        back_populates="document",
        uselist=False,
        cascade="all, delete-orphan",
    )
    anomalies = relationship(
        "Anomaly",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="Anomaly.created_at.desc()",
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="AuditLog.created_at.desc()",
    )


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False, index=True)
    original_text = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    user_corrected_value = Column(Text, nullable=True)
    page_number = Column(Integer, default=1)
    bbox_json = Column(Text, nullable=True)  # JSON: [x0, y0, x1, y1] or list of boxes
    extraction_method = Column(String(50), default="ai_model")  # ai_model, regex_rule, ocr_coordinate, user_manual
    confidence = Column(Float, default=1.0)
    is_reviewed = Column(Boolean, default=False)
    is_corrected = Column(Boolean, default=False)
    validation_status = Column(String(50), default="unverified")  # valid, warning, error, unverified
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="extracted_fields")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    vendor_name = Column(String(255), nullable=False, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)
    invoice_date = Column(String(10), nullable=True, index=True)  # YYYY-MM-DD
    due_date = Column(String(10), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    subtotal_cents = Column(Integer, default=0, nullable=False)
    tax_cents = Column(Integer, default=0, nullable=False)
    total_cents = Column(Integer, default=0, nullable=False)
    category = Column(String(100), default="Other", nullable=False, index=True)
    description = Column(Text, nullable=True)
    payment_terms = Column(String(100), nullable=True)
    status = Column(
        String(50),
        default="Needs review",
        index=True,
    )  # Needs review, Reviewed, Confirmed, Exported
    confirmed_at = Column(DateTime, nullable=True)
    confirmed_by = Column(String(100), nullable=True)
    exported_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="financial_record")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_code = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), nullable=False)  # critical, warning, info
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    affected_fields = Column(Text, default="[]")  # JSON list of field names
    is_resolved = Column(Boolean, default=False, index=True)
    resolution_action = Column(String(100), nullable=True)
    resolution_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="anomalies")


class VendorProfile(Base):
    __tablename__ = "vendor_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), unique=True, nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    default_category = Column(String(100), default="Other")
    total_spend_cents = Column(Integer, default=0)
    invoice_count = Column(Integer, default=0)
    average_amount_cents = Column(Integer, default=0)
    min_amount_cents = Column(Integer, default=0)
    max_amount_cents = Column(Integer, default=0)
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(100), nullable=False)  # FIELD_EDITED, RECORD_CONFIRMED, ANOMALY_RESOLVED, RECORD_EXPORTED
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    user_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="audit_logs")


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), default="Alex Rivera", nullable=False)
    email = Column(String(150), default="alex@billsathi.local", nullable=False)
    role = Column(String(100), default="Principal Consultant", nullable=False)
    business_name = Column(String(200), default="Rivera Digital Labs LLC", nullable=False)
    tax_id = Column(String(100), default="EIN-84-2918471", nullable=False)
    home_currency = Column(String(10), default="USD", nullable=False)
    accountant_email = Column(String(150), default="tax-advisor@claritycpa.com", nullable=True)
    fiscal_year_start = Column(String(50), default="January", nullable=False)
    active_workspace_id = Column(String(50), default="ws_primary", nullable=False)
    avatar_url = Column(Text, nullable=True)
    workspaces_json = Column(
        Text,
        default='[{"id":"ws_primary","name":"Rivera Digital Labs","type":"LLC / Consulting","is_default":true},{"id":"ws_personal","name":"Personal & Micro Ventures","type":"Sole Proprietorship","is_default":false}]',
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

