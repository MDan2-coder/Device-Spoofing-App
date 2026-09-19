from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DevicePresetResponse(BaseModel):
    id: UUID
    manufacturer: str
    model: str
    market_name: str
    brand: str
    product_board: str
    hardware: str
    fingerprint: str
    android_versions: List[str]
    supported_abis: List[str]
    screen_specs: Dict[str, Any]

    class Config:
        from_attributes = True


class DeviceRegisterRequest(BaseModel):
    device_identifier: str = Field(min_length=16, max_length=64)
    device_name: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    android_version: Optional[str] = None
    sdk_version: Optional[int] = None
    agent_version: Optional[str] = None
    initial_telemetry: Optional[Dict[str, Any]] = None


class DeviceHeartbeatRequest(BaseModel):
    battery_level: Optional[int] = None
    is_charging: Optional[bool] = None
    network_type: Optional[str] = None
    ip_address: Optional[str] = None
    vpn_active: Optional[bool] = None
    developer_options: Optional[bool] = None
    usb_debugging: Optional[bool] = None
    root_detected: Optional[bool] = None
    extra_metrics: Optional[Dict[str, Any]] = None


class DeviceAssignProfileRequest(BaseModel):
    profile_id: Optional[UUID] = None


class DeviceResponse(BaseModel):
    id: UUID
    user_id: UUID
    device_identifier: str
    device_name: str
    manufacturer: Optional[str]
    model: Optional[str]
    android_version: Optional[str]
    sdk_version: Optional[int]
    agent_version: Optional[str]
    status: str
    last_seen: Optional[datetime]
    telemetry: Dict[str, Any]
    assigned_profile_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class DeviceSyncConfigResponse(BaseModel):
    device_id: UUID
    status: str
    assigned_profile: Optional[Dict[str, Any]]
    effective_applications: List[str]