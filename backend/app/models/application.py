import uuid
from typing import List, Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    package_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    app_name: Mapped[str] = mapped_column(String(150), nullable=False)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    version_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    group_associations: Mapped[List["GroupApplication"]] = relationship(back_populates="application", cascade="all, delete-orphan")


class AppGroup(Base, TimestampMixin):
    __tablename__ = "app_groups"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="app_groups")
    applications: Mapped[List["GroupApplication"]] = relationship(back_populates="group", cascade="all, delete-orphan")
    profile_associations: Mapped[List["ProfileAppGroup"]] = relationship(back_populates="group", cascade="all, delete-orphan")


class GroupApplication(Base):
    __tablename__ = "group_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app_groups.id", ondelete="CASCADE"), index=True, nullable=False)
    application_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), index=True, nullable=False)
    is_excluded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    group: Mapped["AppGroup"] = relationship(back_populates="applications")
    application: Mapped["Application"] = relationship(back_populates="group_associations")

    __table_args__ = (
        UniqueConstraint("group_id", "application_id", name="uq_group_application"),
    )


class ProfileAppGroup(Base):
    __tablename__ = "profile_app_groups"

    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app_groups.id", ondelete="CASCADE"), primary_key=True)

    profile: Mapped["Profile"] = relationship(back_populates="app_group_associations")
    group: Mapped["AppGroup"] = relationship(back_populates="profile_associations")