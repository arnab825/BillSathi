import json
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class WorkspaceItem(BaseModel):
    id: str
    name: str
    type: str = "LLC / Consulting"
    is_default: bool = False


class UserAccountResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    business_name: str
    tax_id: str
    home_currency: str
    accountant_email: Optional[str] = None
    fiscal_year_start: str
    active_workspace_id: str
    avatar_url: Optional[str] = None
    workspaces: List[WorkspaceItem]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserAccountUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    home_currency: Optional[str] = None
    accountant_email: Optional[str] = None
    fiscal_year_start: Optional[str] = None
    avatar_url: Optional[str] = None


class SwitchWorkspaceRequest(BaseModel):
    workspace_id: str


class CreateWorkspaceRequest(BaseModel):
    name: str
    type: str = "LLC / Consulting"
