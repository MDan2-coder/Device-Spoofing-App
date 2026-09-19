import uuid
from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Backup(Base, TimestampMixin):
    __tablename__ = "backups"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    backup_type: Mapped[str] = mapped_column(String(20), default="CONFIG_ONLY", nullable=False)  # CONFIG_ONLY, FULL_TAR
    status: Mapped[str] = mapped_column(String(20), default="READY", nullable=False)

    user: Mapped["User"] = relationship(back_populates="backups")
    profile: Mapped["Profile"] = relationship(back_populates="backups")