from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AuditLogResponse, StatsForNerdsResponse
from app.services.audit_service import AuditService
from app.services.stats_service import StatsService

router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("/", response_model=StatsForNerdsResponse)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await StatsService(db).get_stats_for_user(current_user.id)


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuditService(db).get_logs_for_user(current_user.id)
