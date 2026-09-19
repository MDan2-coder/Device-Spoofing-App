from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.device import Device
from app.models.user import User
from app.schemas.device import (
    DeviceAssignProfileRequest,
    DeviceHeartbeatRequest,
    DevicePresetResponse,
    DeviceRegisterRequest,
    DeviceResponse,
    DeviceSyncConfigResponse,
)
from app.services.device_service import DeviceService


router = APIRouter(prefix="/devices", tags=["Devices"])


def _device_response(device: Device) -> DeviceResponse:
    assigned_profile_id = device.profiles[0].id if device.profiles else None
    return DeviceResponse(
        id=device.id,
        user_id=device.user_id,
        device_identifier=device.device_identifier,
        device_name=device.device_name,
        manufacturer=device.manufacturer,
        model=device.model,
        android_version=device.android_version,
        sdk_version=device.sdk_version,
        agent_version=device.agent_version,
        status=device.status,
        last_seen=device.last_seen,
        telemetry=device.telemetry or {},
        assigned_profile_id=assigned_profile_id,
        created_at=device.created_at,
    )


@router.get("/presets", response_model=List[DevicePresetResponse])
async def list_presets(
    manufacturer: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    return await service.list_presets(manufacturer=manufacturer, search=search)


@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    return _device_response(await service.register_device(current_user.id, payload))


@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    devices = await service.list_devices_for_user(current_user.id)
    return [_device_response(device) for device in devices]


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    return _device_response(await service.get_device_for_user(device_id, current_user.id))


@router.post("/{device_id}/heartbeat", response_model=DeviceResponse)
async def record_heartbeat(
    device_id: UUID,
    payload: DeviceHeartbeatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    return _device_response(
        await service.record_heartbeat(device_id, current_user.id, payload)
    )


@router.post("/{device_id}/assign-profile", response_model=DeviceResponse)
async def assign_profile(
    device_id: UUID,
    payload: DeviceAssignProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    return _device_response(
        await service.assign_profile(device_id, current_user.id, payload.profile_id)
    )


@router.get("/{device_id}/sync", response_model=DeviceSyncConfigResponse)
async def sync_device(
    device_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    return await service.get_sync_config(device_id, current_user.id)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    await service.delete_device(device_id, current_user.id)
    return None