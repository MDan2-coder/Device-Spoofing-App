from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.application import AppGroup, GroupApplication, ProfileAppGroup
from app.models.device import Device, DevicePreset
from app.models.profile import Profile
from app.schemas.device import DeviceHeartbeatRequest, DeviceRegisterRequest


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _device_options():
        return selectinload(Device.profiles)

    @staticmethod
    def _sync_profile_options():
        return (
            selectinload(Device.profiles)
            .selectinload(Profile.settings),
            selectinload(Device.profiles)
            .selectinload(Profile.app_group_associations)
            .selectinload(ProfileAppGroup.group)
            .selectinload(AppGroup.applications)
            .selectinload(GroupApplication.application),
        )

    async def list_presets(
        self,
        manufacturer: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[DevicePreset]:
        stmt = select(DevicePreset).order_by(DevicePreset.manufacturer, DevicePreset.model)
        if manufacturer:
            stmt = stmt.where(DevicePreset.manufacturer.ilike(manufacturer))
        if search:
            search_value = f"%{search}%"
            stmt = stmt.where(
                DevicePreset.manufacturer.ilike(search_value)
                | DevicePreset.model.ilike(search_value)
                | DevicePreset.market_name.ilike(search_value)
                | DevicePreset.brand.ilike(search_value)
            )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def register_device(self, user_id: UUID, payload: DeviceRegisterRequest) -> Device:
        result = await self.db.execute(
            select(Device).where(
                Device.user_id == user_id,
                Device.device_identifier == payload.device_identifier,
            )
        )
        device = result.scalar_one_or_none()

        if device is None:
            conflict = await self.db.execute(
                select(Device.id).where(Device.device_identifier == payload.device_identifier)
            )
            if conflict.scalar_one_or_none() is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Device identifier is already registered to another user.",
                )
            device = Device(
                user_id=user_id,
                device_identifier=payload.device_identifier,
                device_name=payload.device_name,
                status="ONLINE",
                telemetry={},
            )
            self.db.add(device)

        device.device_name = payload.device_name
        device.manufacturer = payload.manufacturer
        device.model = payload.model
        device.android_version = payload.android_version
        device.sdk_version = payload.sdk_version
        device.agent_version = payload.agent_version
        device.status = "ONLINE"
        device.last_seen = datetime.now(timezone.utc)
        if payload.initial_telemetry:
            device.telemetry = {**(device.telemetry or {}), **payload.initial_telemetry}

        await self.db.commit()
        return await self.get_device_for_user(device.id, user_id)

    async def list_devices_for_user(self, user_id: UUID) -> List[Device]:
        stmt = (
            select(Device)
            .options(self._device_options())
            .where(Device.user_id == user_id)
            .order_by(Device.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_device_for_user(self, device_id: UUID, user_id: UUID) -> Device:
        stmt = (
            select(Device)
            .options(self._device_options())
            .where(Device.id == device_id, Device.user_id == user_id)
            .execution_options(populate_existing=True)
        )
        result = await self.db.execute(stmt)
        device = result.scalar_one_or_none()
        if device is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")
        return device

    async def record_heartbeat(
        self,
        device_id: UUID,
        user_id: UUID,
        payload: DeviceHeartbeatRequest,
    ) -> Device:
        device = await self.get_device_for_user(device_id, user_id)
        telemetry = {
            key: value
            for key, value in payload.model_dump(exclude_none=True).items()
            if key != "extra_metrics"
        }
        telemetry.update(payload.extra_metrics or {})
        device.telemetry = {**(device.telemetry or {}), **telemetry}
        device.last_seen = datetime.now(timezone.utc)
        device.status = "ONLINE"
        await self.db.commit()
        return await self.get_device_for_user(device_id, user_id)

    async def assign_profile(
        self,
        device_id: UUID,
        user_id: UUID,
        profile_id: Optional[UUID],
    ) -> Device:
        device = await self.get_device_for_user(device_id, user_id)
        if profile_id is not None:
            result = await self.db.execute(
                select(Profile).where(
                    Profile.id == profile_id,
                    Profile.user_id == user_id,
                    Profile.deleted_at.is_(None),
                )
            )
            profile = result.scalar_one_or_none()
            if profile is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

        profiles_result = await self.db.execute(
            select(Profile).where(Profile.device_id == device.id)
        )
        for assigned_profile in profiles_result.scalars().all():
            assigned_profile.device_id = None

        if profile_id is not None:
            profile.device_id = device.id

        await self.db.commit()
        return await self.get_device_for_user(device_id, user_id)

    async def get_sync_config(self, device_id: UUID, user_id: UUID) -> Dict[str, Any]:
        stmt = (
            select(Device)
            .options(*self._sync_profile_options())
            .where(Device.id == device_id, Device.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        device = result.scalar_one_or_none()
        if device is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found.")

        profile = device.profiles[0] if device.profiles else None
        effective_applications: set[str] = set()
        excluded_applications: set[str] = set()
        assigned_profile: Optional[Dict[str, Any]] = None

        if profile is not None:
            assigned_profile = {
                "id": str(profile.id),
                "name": profile.name,
                "description": profile.description,
                "settings": {
                    "identifiers": profile.settings.identifiers if profile.settings else {},
                    "telephony": profile.settings.telephony if profile.settings else {},
                    "network": profile.settings.network if profile.settings else {},
                    "location": profile.settings.location if profile.settings else {},
                    "stealth_rules": profile.settings.stealth_rules if profile.settings else {},
                },
            }
            for association in profile.app_group_associations:
                for member in association.group.applications:
                    package_name = member.application.package_name
                    if member.is_excluded:
                        excluded_applications.add(package_name)
                    else:
                        effective_applications.add(package_name)

        return {
            "device_id": device.id,
            "status": device.status,
            "assigned_profile": assigned_profile,
            "effective_applications": sorted(effective_applications - excluded_applications),
        }

    async def delete_device(self, device_id: UUID, user_id: UUID) -> None:
        device = await self.get_device_for_user(device_id, user_id)
        await self.db.delete(device)
        await self.db.commit()