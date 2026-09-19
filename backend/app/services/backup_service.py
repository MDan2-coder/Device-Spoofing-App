import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.application import AppGroup, GroupApplication, ProfileAppGroup
from app.models.backup import Backup
from app.models.profile import Profile, ProfileSettings
from app.schemas.backup import (
    BackupCreateRequest,
    BackupRestoreRequest,
    BackupRestoreResponse,
)


class BackupService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.backup_dir = Path(settings.BACKUP_DIR)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _profile_options():
        return (
            selectinload(Profile.settings),
            selectinload(Profile.app_group_associations)
            .selectinload(ProfileAppGroup.group)
            .selectinload(AppGroup.applications)
            .selectinload(GroupApplication.application),
        )

    @staticmethod
    def _backup_options():
        return (
            selectinload(Backup.profile).selectinload(Profile.settings),
            selectinload(Backup.profile)
            .selectinload(Profile.app_group_associations)
            .selectinload(ProfileAppGroup.group)
            .selectinload(AppGroup.applications)
            .selectinload(GroupApplication.application),
        )

    async def _get_profile_for_user(self, profile_id: UUID, user_id: UUID) -> Profile:
        stmt = (
            select(Profile)
            .options(*self._profile_options())
            .where(
                Profile.id == profile_id,
                Profile.user_id == user_id,
                Profile.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
        return profile

    @staticmethod
    def _snapshot(profile: Profile, backup_type: str) -> Dict[str, Any]:
        groups = []
        for association in profile.app_group_associations:
            group = association.group
            groups.append(
                {
                    "id": str(group.id),
                    "name": group.name,
                    "description": group.description,
                    "applications": [
                        {
                            "package_name": member.application.package_name,
                            "app_name": member.application.app_name,
                            "is_excluded": member.is_excluded,
                        }
                        for member in group.applications
                    ],
                }
            )

        settings_snapshot = profile.settings
        return {
            "schema_version": 1,
            "backup_type": backup_type,
            "profile": {
                "id": str(profile.id),
                "name": profile.name,
                "description": profile.description,
                "notes": profile.notes,
                "is_active": profile.is_active,
                "settings": {
                    "identifiers": settings_snapshot.identifiers if settings_snapshot else {},
                    "telephony": settings_snapshot.telephony if settings_snapshot else {},
                    "network": settings_snapshot.network if settings_snapshot else {},
                    "location": settings_snapshot.location if settings_snapshot else {},
                    "stealth_rules": settings_snapshot.stealth_rules if settings_snapshot else {},
                },
                "app_groups": groups,
            },
        }

    async def create_backup(self, user_id: UUID, payload: BackupCreateRequest) -> Backup:
        profile = await self._get_profile_for_user(payload.profile_id, user_id)
        snapshot = self._snapshot(profile, payload.backup_type)
        content = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        checksum = hashlib.sha256(content).hexdigest()

        backup = Backup(
            user_id=user_id,
            profile_id=profile.id,
            file_name=f"{payload.backup_name.strip()}.json",
            file_path="",
            file_size=len(content),
            checksum_sha256=checksum,
            backup_type=payload.backup_type,
            status="READY",
        )
        self.db.add(backup)
        try:
            await self.db.flush()
            file_path = self.backup_dir / f"{backup.id}.json"
            file_path.write_bytes(content)
            backup.file_path = str(file_path)
            await self.db.commit()
        except Exception:
            await self.db.rollback()
            if "file_path" in locals() and file_path.exists():
                file_path.unlink()
            raise

        return await self.get_backup_for_user(backup.id, user_id)

    async def list_backups_for_user(
        self,
        user_id: UUID,
        profile_id: Optional[UUID] = None,
    ) -> List[Backup]:
        stmt = (
            select(Backup)
            .options(*self._backup_options())
            .where(Backup.user_id == user_id)
            .order_by(Backup.created_at.desc())
        )
        if profile_id is not None:
            stmt = stmt.where(Backup.profile_id == profile_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_backup_for_user(self, backup_id: UUID, user_id: UUID) -> Backup:
        stmt = (
            select(Backup)
            .options(*self._backup_options())
            .where(Backup.id == backup_id, Backup.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        backup = result.scalar_one_or_none()
        if backup is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup not found.")
        return backup

    async def restore_backup(
        self,
        backup_id: UUID,
        user_id: UUID,
        payload: BackupRestoreRequest,
    ) -> BackupRestoreResponse:
        backup = await self.get_backup_for_user(backup_id, user_id)
        file_path = Path(backup.file_path)
        if not file_path.is_file():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found.")

        content = file_path.read_bytes()
        checksum = hashlib.sha256(content).hexdigest()
        if checksum != backup.checksum_sha256:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Checksum verification failed / file corrupted.",
            )

        try:
            snapshot = json.loads(content.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid backup JSON.") from exc

        if payload.validate_only:
            return BackupRestoreResponse(
                success=True,
                message="Backup validated successfully.",
                checksum_verified=True,
            )

        profile = backup.profile
        profile_snapshot = snapshot.get("profile", {})
        profile.name = profile_snapshot.get("name", profile.name)
        profile.description = profile_snapshot.get("description")
        profile.notes = profile_snapshot.get("notes")
        profile.is_active = profile_snapshot.get("is_active", profile.is_active)
        settings_snapshot = profile_snapshot.get("settings", {})
        if profile.settings is None:
            profile.settings = ProfileSettings(
                identifiers=settings_snapshot.get("identifiers", {}),
                telephony=settings_snapshot.get("telephony", {}),
                network=settings_snapshot.get("network", {}),
                location=settings_snapshot.get("location", {}),
                stealth_rules=settings_snapshot.get("stealth_rules", {}),
            )
        else:
            profile.settings.identifiers = settings_snapshot.get("identifiers", {})
            profile.settings.telephony = settings_snapshot.get("telephony", {})
            profile.settings.network = settings_snapshot.get("network", {})
            profile.settings.location = settings_snapshot.get("location", {})
            profile.settings.stealth_rules = settings_snapshot.get("stealth_rules", {})

        await self.db.commit()
        return BackupRestoreResponse(
            success=True,
            message="Backup restored successfully.",
            checksum_verified=True,
            restored_profile_id=profile.id,
        )

    async def delete_backup(self, backup_id: UUID, user_id: UUID) -> None:
        backup = await self.get_backup_for_user(backup_id, user_id)
        file_path = Path(backup.file_path)
        if file_path.is_file():
            file_path.unlink()
        await self.db.delete(backup)
        await self.db.commit()