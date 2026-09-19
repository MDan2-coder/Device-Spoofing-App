from typing import Any, Dict
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import AppGroup, Application, GroupApplication
from app.models.backup import Backup
from app.models.device import Device
from app.models.profile import Profile


class StatsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _count(self, statement) -> int:
        result = await self.db.execute(statement)
        return int(result.scalar_one() or 0)

    async def get_stats_for_user(self, user_id: UUID) -> Dict[str, Any]:
        total_profiles = await self._count(
            select(func.count(Profile.id)).where(Profile.user_id == user_id)
        )
        active_profiles = await self._count(
            select(func.count(Profile.id)).where(
                Profile.user_id == user_id, Profile.deleted_at.is_(None)
            )
        )
        trash_profiles = await self._count(
            select(func.count(Profile.id)).where(
                Profile.user_id == user_id, Profile.deleted_at.is_not(None)
            )
        )
        total_devices = await self._count(
            select(func.count(Device.id)).where(Device.user_id == user_id)
        )
        online_devices = await self._count(
            select(func.count(Device.id)).where(
                Device.user_id == user_id, Device.status == "ONLINE"
            )
        )
        total_app_groups = await self._count(
            select(func.count(AppGroup.id)).where(AppGroup.user_id == user_id)
        )
        total_applications = await self._count(
            select(func.count(func.distinct(GroupApplication.application_id)))
            .join(AppGroup, AppGroup.id == GroupApplication.group_id)
            .where(AppGroup.user_id == user_id)
        )
        total_backups = await self._count(
            select(func.count(Backup.id)).where(Backup.user_id == user_id)
        )
        total_storage_bytes = await self._count(
            select(func.coalesce(func.sum(Backup.file_size), 0)).where(
                Backup.user_id == user_id
            )
        )

        return {
            "total_profiles": total_profiles,
            "active_profiles": active_profiles,
            "trash_profiles": trash_profiles,
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": total_devices - online_devices,
            "total_app_groups": total_app_groups,
            "total_applications": total_applications,
            "total_backups": total_backups,
            "total_storage_bytes": total_storage_bytes,
        }

    async def get_global_stats_admin(self) -> Dict[str, Any]:
        total_profiles = await self._count(select(func.count(Profile.id)))
        active_profiles = await self._count(
            select(func.count(Profile.id)).where(Profile.deleted_at.is_(None))
        )
        trash_profiles = await self._count(
            select(func.count(Profile.id)).where(Profile.deleted_at.is_not(None))
        )
        total_devices = await self._count(select(func.count(Device.id)))
        online_devices = await self._count(
            select(func.count(Device.id)).where(Device.status == "ONLINE")
        )
        total_app_groups = await self._count(select(func.count(AppGroup.id)))
        total_applications = await self._count(select(func.count(Application.id)))
        total_backups = await self._count(select(func.count(Backup.id)))
        total_storage_bytes = await self._count(
            select(func.coalesce(func.sum(Backup.file_size), 0))
        )

        return {
            "total_profiles": total_profiles,
            "active_profiles": active_profiles,
            "trash_profiles": trash_profiles,
            "total_devices": total_devices,
            "online_devices": online_devices,
            "offline_devices": total_devices - online_devices,
            "total_app_groups": total_app_groups,
            "total_applications": total_applications,
            "total_backups": total_backups,
            "total_storage_bytes": total_storage_bytes,
        }
