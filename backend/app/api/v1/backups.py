from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.backup import (
    BackupCreateRequest,
    BackupResponse,
    BackupRestoreRequest,
    BackupRestoreResponse,
)
from app.services.backup_service import BackupService


router = APIRouter(prefix="/backups", tags=["Backups"])


@router.get("/", response_model=List[BackupResponse])
async def list_backups(
    profile_id: Optional[UUID] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BackupService(db)
    return await service.list_backups_for_user(current_user.id, profile_id)


@router.post("/", response_model=BackupResponse, status_code=status.HTTP_201_CREATED)
async def create_backup(
    payload: BackupCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BackupService(db)
    return await service.create_backup(current_user.id, payload)


@router.get("/{backup_id}", response_model=BackupResponse)
async def get_backup(
    backup_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BackupService(db)
    return await service.get_backup_for_user(backup_id, current_user.id)


@router.get("/{backup_id}/download")
async def download_backup(
    backup_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BackupService(db)
    backup = await service.get_backup_for_user(backup_id, current_user.id)
    file_path = Path(backup.file_path)
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found.")
    return FileResponse(
        path=file_path,
        media_type="application/json",
        filename=backup.file_name,
    )


@router.post("/{backup_id}/restore", response_model=BackupRestoreResponse)
async def restore_backup(
    backup_id: UUID,
    payload: BackupRestoreRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BackupService(db)
    return await service.restore_backup(backup_id, current_user.id, payload)


@router.delete("/{backup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_backup(
    backup_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BackupService(db)
    await service.delete_backup(backup_id, current_user.id)
    return None