import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    device_identifier: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    device_name: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    android_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sdk_version: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    agent_version: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)  # ONLINE, OFFLINE, PENDING, BLOCKED
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    telemetry: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)

    user: Mapped["User"] = relationship(back_populates="devices")
    profiles: Mapped[List["Profile"]] = relationship(back_populates="device")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="device")


class DevicePreset(Base, TimestampMixin):
    __tablename__ = "device_presets"

    manufacturer: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    model: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    market_name: Mapped[str] = mapped_column(String(100), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    product_board: Mapped[str] = mapped_column(String(100), nullable=False)
    hardware: Mapped[str] = mapped_column(String(100), nullable=False)
    fingerprint: Mapped[str] = mapped_column(String(255), nullable=False)
    android_versions: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    supported_abis: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    screen_specs: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)

    profiles: Mapped[List["Profile"]] = relationship(back_populates="preset")