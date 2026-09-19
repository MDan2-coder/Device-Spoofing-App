from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.application import Application, AppGroup, GroupApplication
from app.schemas.application import AppCreate, GroupCreate, GroupMemberAdd


class ApplicationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_or_get_app(self, payload: AppCreate) -> Application:
        result = await self.db.execute(
            select(Application).where(Application.package_name == payload.package_name)
        )
        application = result.scalar_one_or_none()
        if application is not None:
            application.app_name = payload.app_name
            application.version = payload.version
            application.version_code = payload.version_code
            await self.db.commit()
            await self.db.refresh(application)
            return application

        application = Application(
            package_name=payload.package_name,
            app_name=payload.app_name,
            version=payload.version,
            version_code=payload.version_code,
        )
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def list_apps(self, search: Optional[str] = None) -> List[Application]:
        stmt = select(Application).order_by(Application.package_name)
        if search:
            search_value = f"%{search}%"
            stmt = stmt.where(
                Application.package_name.ilike(search_value)
                | Application.app_name.ilike(search_value)
            )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_group(self, user_id: UUID, payload: GroupCreate) -> AppGroup:
        group = AppGroup(
            user_id=user_id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
        )
        self.db.add(group)
        await self.db.commit()
        return await self.get_group_for_user(group.id, user_id)

    async def list_groups_for_user(self, user_id: UUID) -> List[AppGroup]:
        stmt = (
            select(AppGroup)
            .options(selectinload(AppGroup.applications).selectinload(GroupApplication.application))
            .where(AppGroup.user_id == user_id)
            .order_by(AppGroup.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_group_for_user(self, group_id: UUID, user_id: UUID) -> AppGroup:
        stmt = (
            select(AppGroup)
            .options(selectinload(AppGroup.applications).selectinload(GroupApplication.application))
            .where(AppGroup.id == group_id, AppGroup.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        group = result.scalar_one_or_none()
        if group is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
        return group

    async def add_or_update_group_member(
        self,
        group_id: UUID,
        user_id: UUID,
        payload: GroupMemberAdd,
    ) -> AppGroup:
        await self.get_group_for_user(group_id, user_id)
        application_result = await self.db.execute(
            select(Application).where(Application.id == payload.application_id)
        )
        if application_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

        member_result = await self.db.execute(
            select(GroupApplication).where(
                GroupApplication.group_id == group_id,
                GroupApplication.application_id == payload.application_id,
            )
        )
        member = member_result.scalar_one_or_none()
        if member is None:
            self.db.add(
                GroupApplication(
                    group_id=group_id,
                    application_id=payload.application_id,
                    is_excluded=payload.is_excluded,
                )
            )
        else:
            member.is_excluded = payload.is_excluded

        await self.db.commit()
        return await self.get_group_for_user(group_id, user_id)

    async def remove_group_member(self, group_id: UUID, user_id: UUID, application_id: UUID) -> None:
        await self.get_group_for_user(group_id, user_id)
        result = await self.db.execute(
            select(GroupApplication).where(
                GroupApplication.group_id == group_id,
                GroupApplication.application_id == application_id,
            )
        )
        member = result.scalar_one_or_none()
        if member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group member not found.")

        await self.db.delete(member)
        await self.db.commit()

    async def delete_group(self, group_id: UUID, user_id: UUID) -> None:
        group = await self.get_group_for_user(group_id, user_id)
        await self.db.delete(group)
        await self.db.commit()

    async def resolve_effective_apps(self, group_ids: List[UUID], user_id: UUID) -> List[str]:
        if not group_ids:
            return []

        stmt = (
            select(distinct(Application.package_name), GroupApplication.is_excluded)
            .join(GroupApplication, GroupApplication.application_id == Application.id)
            .join(AppGroup, AppGroup.id == GroupApplication.group_id)
            .where(
                AppGroup.user_id == user_id,
                AppGroup.id.in_(group_ids),
            )
        )
        result = await self.db.execute(stmt)
        included: set[str] = set()
        excluded: set[str] = set()
        for package_name, is_excluded in result.all():
            (excluded if is_excluded else included).add(package_name)

        return sorted(included - excluded)