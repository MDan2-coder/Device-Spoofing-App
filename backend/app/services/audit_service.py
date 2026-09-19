from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        user_id: Optional[UUID],
        action: str,
        ip_address: Optional[str] = None,
        device_id: Optional[UUID] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        event = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            device_id=device_id,
            details=details or {},
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_logs_for_user(self, user_id: UUID, limit: int = 50) -> List[AuditLog]:
        statement = (
            select(AuditLog)
            .options(selectinload(AuditLog.user), selectinload(AuditLog.device))
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def get_all_logs_admin(self, limit: int = 100) -> List[AuditLog]:
        statement = (
            select(AuditLog)
            .options(selectinload(AuditLog.user), selectinload(AuditLog.device))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(statement)
        return list(result.scalars().all())
