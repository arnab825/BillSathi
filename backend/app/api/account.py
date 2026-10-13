import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import UserAccount
from app.schemas.account import (
    UserAccountResponse,
    UserAccountUpdate,
    SwitchWorkspaceRequest,
    CreateWorkspaceRequest,
    WorkspaceItem,
)

router = APIRouter(prefix="/api/account", tags=["account"])


def get_or_create_primary_account(db: Session) -> UserAccount:
    """Ensures a realistic account profile exists in the database."""
    account = db.query(UserAccount).first()
    if not account:
        default_workspaces = [
            {"id": "ws_primary", "name": "Rivera Digital Labs", "type": "LLC / Consulting", "is_default": True},
            {"id": "ws_personal", "name": "Personal & Micro Ventures", "type": "Sole Proprietorship", "is_default": False},
        ]
        account = UserAccount(
            full_name="Alex Rivera",
            email="alex@billsathi.local",
            role="Principal Consultant",
            business_name="Rivera Digital Labs LLC",
            tax_id="EIN-84-2918471",
            home_currency="USD",
            accountant_email="tax-advisor@claritycpa.com",
            fiscal_year_start="January",
            active_workspace_id="ws_primary",
            workspaces_json=json.dumps(default_workspaces),
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    return account


def serialize_account(account: UserAccount) -> UserAccountResponse:
    workspaces_raw = json.loads(account.workspaces_json or "[]")
    workspaces = [WorkspaceItem(**w) for w in workspaces_raw]

    return UserAccountResponse(
        id=account.id,
        full_name=account.full_name,
        email=account.email,
        role=account.role,
        business_name=account.business_name,
        tax_id=account.tax_id,
        home_currency=account.home_currency,
        accountant_email=account.accountant_email,
        fiscal_year_start=account.fiscal_year_start,
        active_workspace_id=account.active_workspace_id,
        avatar_url=account.avatar_url,
        workspaces=workspaces,
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


@router.get("/me", response_model=UserAccountResponse)
def get_current_user_profile(db: Session = Depends(get_db)):
    account = get_or_create_primary_account(db)
    return serialize_account(account)


@router.put("/me", response_model=UserAccountResponse)
def update_user_profile(req: UserAccountUpdate, db: Session = Depends(get_db)):
    account = get_or_create_primary_account(db)

    for field, val in req.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(account, field, val)

    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.post("/switch-workspace", response_model=UserAccountResponse)
def switch_active_workspace(req: SwitchWorkspaceRequest, db: Session = Depends(get_db)):
    account = get_or_create_primary_account(db)
    workspaces = json.loads(account.workspaces_json or "[]")

    if not any(w["id"] == req.workspace_id for w in workspaces):
        raise HTTPException(status_code=404, detail="Workspace ID not found")

    account.active_workspace_id = req.workspace_id
    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.post("/workspaces", response_model=UserAccountResponse)
def create_new_workspace(req: CreateWorkspaceRequest, db: Session = Depends(get_db)):
    account = get_or_create_primary_account(db)
    workspaces = json.loads(account.workspaces_json or "[]")

    new_id = f"ws_{uuid.uuid4().hex[:8]}"
    workspaces.append({
        "id": new_id,
        "name": req.name.strip(),
        "type": req.type.strip(),
        "is_default": False,
    })

    account.workspaces_json = json.dumps(workspaces)
    account.active_workspace_id = new_id  # Automatically switch to new workspace
    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    return serialize_account(account)
