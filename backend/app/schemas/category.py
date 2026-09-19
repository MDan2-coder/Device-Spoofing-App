from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100, examples=["QA Testing"])
    color: str = Field(default="#3B82F6", pattern=r"^#[0-9a-fA-F]{6}$", examples=["#3B82F6"])


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default="#3B82F6", pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    color: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True