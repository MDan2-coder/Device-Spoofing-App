from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps_admin import get_current_admin_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AuditLogResponse,
    StatsForNerdsResponse,
    UserAdminResponse,
    UserStatusUpdateRequest,
)
from app.services.audit_service import AuditService
from app.services.stats_service import StatsService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


@router.put("/users/{user_id}/status", response_model=UserAdminResponse)
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdateRequest,
    request: Request,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    ip_address = request.client.host if request.client else None
    await AuditService(db).log_event(
        user_id=current_admin.id,
        action="USER_STATUS_UPDATED",
        ip_address=ip_address,
        details={"target_user_id": str(user.id), "is_active": payload.is_active},
    )
    return user


@router.get("/stats", response_model=StatsForNerdsResponse)
async def get_global_statistics(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await StatsService(db).get_global_stats_admin()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_global_audit_logs(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuditService(db).get_all_logs_admin()
