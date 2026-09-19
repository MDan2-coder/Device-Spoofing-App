from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BackupCreateRequest(BaseModel):
    profile_id: UUID
    backup_name: str = Field(min_length=1, max_length=100)
    backup_type: str = "CONFIG_ONLY"


class BackupResponse(BaseModel):
    id: UUID
    user_id: UUID
    profile_id: UUID
    file_name: str
    file_size: int
    checksum_sha256: str
    backup_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BackupRestoreRequest(BaseModel):
    validate_only: bool = False
    clear_cache_flag: bool = True
    restore_config_only: bool = True


class BackupRestoreResponse(BaseModel):
    success: bool
    message: str
    checksum_verified: bool
    restored_profile_id: Optional[UUID] = None