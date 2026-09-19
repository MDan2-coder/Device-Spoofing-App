from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.application import AppGroup
from app.models.user import User
from app.schemas.application import (
    AppCreate,
    AppResponse,
    GroupCreate,
    GroupDetailResponse,
    GroupMemberAdd,
    GroupMemberResponse,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Applications"])


def _group_response(group: AppGroup) -> GroupDetailResponse:
    applications = [
        GroupMemberResponse(
            application=association.application,
            is_excluded=association.is_excluded,
        )
        for association in group.applications
    ]
    resolved_package_names = sorted(
        {
            association.application.package_name
            for association in group.applications
            if not association.is_excluded
        }
    )
    return GroupDetailResponse(
        id=group.id,
        user_id=group.user_id,
        name=group.name,
        description=group.description,
        applications=applications,
        resolved_package_names=resolved_package_names,
    )


@router.get("/apps", response_model=List[AppResponse])
async def list_apps(
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    return await service.list_apps(search)


@router.post("/apps", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
async def register_app(
    payload: AppCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register an application or refresh metadata for an existing package."""
    service = ApplicationService(db)
    return await service.register_or_get_app(payload)


@router.get("/groups", response_model=List[GroupDetailResponse])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    groups = await service.list_groups_for_user(current_user.id)
    return [_group_response(group) for group in groups]


@router.post("/groups", response_model=GroupDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    group = await service.create_group(current_user.id, payload)
    return _group_response(group)


@router.get("/groups/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    group = await service.get_group_for_user(group_id, current_user.id)
    return _group_response(group)


@router.post("/groups/{group_id}/members", response_model=GroupDetailResponse)
async def add_group_member(
    group_id: UUID,
    payload: GroupMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    group = await service.add_or_update_group_member(group_id, current_user.id, payload)
    return _group_response(group)


@router.delete(
    "/groups/{group_id}/members/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_group_member(
    group_id: UUID,
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    await service.remove_group_member(group_id, current_user.id, application_id)
    return None


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ApplicationService(db)
    await service.delete_group(group_id, current_user.id)
    return None