from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AppCreate(BaseModel):
    package_name: str
    app_name: str
    version: Optional[str] = None
    version_code: Optional[int] = None


class AppResponse(BaseModel):
    id: UUID
    package_name: str
    app_name: str
    version: Optional[str]
    version_code: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None


class GroupMemberAdd(BaseModel):
    application_id: UUID
    is_excluded: bool = False


class GroupMemberResponse(BaseModel):
    application: AppResponse
    is_excluded: bool


class GroupDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    applications: List[GroupMemberResponse]
    resolved_package_names: List[str]

    class Config:
        from_attributes = True