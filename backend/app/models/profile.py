import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    preset_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("device_presets.id", ondelete="SET NULL"), nullable=True)
    
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)  # Soft-delete trigger

    # Relationships
    user: Mapped["User"] = relationship(back_populates="profiles")
    category: Mapped[Optional["Category"]] = relationship(back_populates="profiles")
    device: Mapped[Optional["Device"]] = relationship(back_populates="profiles")
    preset: Mapped[Optional["DevicePreset"]] = relationship(back_populates="profiles")
    settings: Mapped["ProfileSettings"] = relationship(back_populates="profile", cascade="all, delete-orphan", uselist=False)
    app_group_associations: Mapped[List["ProfileAppGroup"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    backups: Mapped[List["Backup"]] = relationship(back_populates="profile", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_profiles_user_active", "user_id", "deleted_at"),
    )


class ProfileSettings(Base):
    __tablename__ = "profile_settings"

    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    identifiers: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    telephony: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    network: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    location: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    stealth_rules: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile: Mapped["Profile"] = relationship(back_populates="settings")