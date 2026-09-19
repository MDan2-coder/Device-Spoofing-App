from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile, ProfileSettings
from app.schemas.profile import ProfileCreate, ProfileUpdate


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_for_user(self, user_id: UUID, in_trash: bool = False):
        stmt = (
            select(Profile)
            .options(selectinload(Profile.settings))
            .where(Profile.user_id == user_id)
        )

        if in_trash:
            stmt = stmt.where(Profile.deleted_at.is_not(None))
        else:
            stmt = stmt.where(Profile.deleted_at.is_(None))

        stmt = stmt.order_by(Profile.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_for_user(self, profile_id: UUID, user_id: UUID, allow_trash: bool = False) -> Profile:
        stmt = select(Profile).options(selectinload(Profile.settings)).where(
            Profile.id == profile_id,
            Profile.user_id == user_id,
        )

        if not allow_trash:
            stmt = stmt.where(Profile.deleted_at.is_(None))

        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
        return profile

    async def create(self, user_id: UUID, payload: ProfileCreate) -> Profile:
        profile = Profile(
            user_id=user_id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            notes=payload.notes.strip() if payload.notes else None,
            category_id=payload.category_id,
            device_id=None,
            preset_id=payload.preset_id,
            is_active=True,
        )

        if payload.settings:
            profile.settings = ProfileSettings(
                identifiers=payload.settings.identifiers or {},
                telephony=payload.settings.telephony or {},
                network=payload.settings.network or {},
                location=payload.settings.location or {},
                stealth_rules=payload.settings.stealth_rules or {},
            )

        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        await self.db.refresh(profile, attribute_names=["settings"])
        return profile

    async def update(self, profile_id: UUID, user_id: UUID, payload: ProfileUpdate) -> Profile:
        profile = await self.get_by_id_for_user(profile_id, user_id)

        if payload.name is not None:
            profile.name = payload.name.strip()
        if payload.description is not None:
            profile.description = payload.description.strip()
        if payload.notes is not None:
            profile.notes = payload.notes.strip()
        if payload.category_id is not None:
            profile.category_id = payload.category_id
        if payload.is_active is not None:
            profile.is_active = payload.is_active

        if payload.settings is not None:
            if profile.settings is None:
                profile.settings = ProfileSettings(
                    identifiers=payload.settings.identifiers or {},
                    telephony=payload.settings.telephony or {},
                    network=payload.settings.network or {},
                    location=payload.settings.location or {},
                    stealth_rules=payload.settings.stealth_rules or {},
                )
            else:
                profile.settings.identifiers = payload.settings.identifiers or {}
                profile.settings.telephony = payload.settings.telephony or {}
                profile.settings.network = payload.settings.network or {}
                profile.settings.location = payload.settings.location or {}
                profile.settings.stealth_rules = payload.settings.stealth_rules or {}

        await self.db.commit()
        await self.db.refresh(profile)
        await self.db.refresh(profile, attribute_names=["settings"])
        return profile

    async def soft_delete(self, profile_id: UUID, user_id: UUID) -> Profile:
        profile = await self.get_by_id_for_user(profile_id, user_id)
        if profile.deleted_at is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile is already in trash.")
        profile.deleted_at = datetime.now(timezone.utc)
        profile.is_active = False
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def restore_from_trash(self, profile_id: UUID, user_id: UUID) -> Profile:
        profile = await self.get_by_id_for_user(profile_id, user_id, allow_trash=True)
        if profile.deleted_at is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile is not in trash.")
        profile.deleted_at = None
        profile.is_active = True
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def permanent_delete(self, profile_id: UUID, user_id: UUID) -> None:
        profile = await self.get_by_id_for_user(profile_id, user_id, allow_trash=True)
        await self.db.delete(profile)
        await self.db.commit()

    async def clone(self, profile_id: UUID, user_id: UUID) -> Profile:
        source = await self.get_by_id_for_user(profile_id, user_id, allow_trash=True)

        clone = Profile(
            user_id=user_id,
            category_id=source.category_id,
            device_id=source.device_id,
            preset_id=source.preset_id,
            name=f"{source.name} (Copy)",
            description=source.description,
            notes=source.notes,
            is_active=True,
            deleted_at=None,
        )

        if source.settings is not None:
            clone.settings = ProfileSettings(
                identifiers=dict(source.settings.identifiers or {}),
                telephony=dict(source.settings.telephony or {}),
                network=dict(source.settings.network or {}),
                location=dict(source.settings.location or {}),
                stealth_rules=dict(source.settings.stealth_rules or {}),
            )

        self.db.add(clone)
        await self.db.commit()
        await self.db.refresh(clone)
        await self.db.refresh(clone, attribute_names=["settings"])
        return clone
