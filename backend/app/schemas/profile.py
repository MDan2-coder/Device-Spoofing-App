from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileSettingsSchema(BaseModel):
    identifiers: dict = Field(default_factory=dict)
    telephony: dict = Field(default_factory=dict)
    network: dict = Field(default_factory=dict)
    location: dict = Field(default_factory=dict)
    stealth_rules: dict = Field(default_factory=dict)


class ProfileCreate(BaseModel):
    name: str
    description: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[UUID] = None
    preset_id: Optional[UUID] = None
    settings: Optional[ProfileSettingsSchema] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    settings: Optional[ProfileSettingsSchema] = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    category_id: Optional[UUID]
    device_id: Optional[UUID]
    preset_id: Optional[UUID]
    name: str
    description: Optional[str]
    notes: Optional[str]
    is_active: bool
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    settings: Optional[ProfileSettingsSchema]

    class Config:
        from_attributes = True
