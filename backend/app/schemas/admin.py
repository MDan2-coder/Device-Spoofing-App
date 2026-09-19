from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    device_id: Optional[UUID]
    action: str
    ip_address: Optional[str]
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class UserAdminResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class StatsForNerdsResponse(BaseModel):
    total_profiles: int
    active_profiles: int
    trash_profiles: int
    total_devices: int
    online_devices: int
    offline_devices: int
    total_app_groups: int
    total_applications: int
    total_backups: int
    total_storage_bytes: int
