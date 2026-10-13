from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Anomaly, AuditLog, Document
from app.schemas.financial import AnomalyResponse, ResolveAnomalyRequest

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.get("", response_model=List[AnomalyResponse])
def list_anomalies(
    document_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    unresolved_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(Anomaly)
    if document_id:
        query = query.filter(Anomaly.document_id == document_id)
    if severity and severity != "all":
        query = query.filter(Anomaly.severity == severity)
    if unresolved_only:
        query = query.filter(Anomaly.is_resolved == False)
    return query.order_by(Anomaly.created_at.desc()).all()


@router.post("/{anomaly_id}/resolve", response_model=AnomalyResponse)
def resolve_anomaly(
    anomaly_id: str,
    req: ResolveAnomalyRequest,
    db: Session = Depends(get_db),
):
    """
    Resolves an anomaly with human rationale and creates an audit record.
    """
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    anomaly.is_resolved = True
    anomaly.resolution_action = req.resolution_action
    anomaly.resolution_note = req.resolution_note or f"Action taken: {req.resolution_action}"
    anomaly.resolved_at = datetime.utcnow()

    db.add(
        AuditLog(
            document_id=anomaly.document_id,
            action_type="ANOMALY_RESOLVED",
            field_name=anomaly.rule_code,
            user_note=f"Resolved '{anomaly.title}' with action {req.resolution_action}: {req.resolution_note}",
        )
    )

    db.commit()
    db.refresh(anomaly)
    return anomaly
