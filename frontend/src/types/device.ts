export interface DeviceTelemetry {
  battery_level: number | null
  is_charging: boolean | null
  network_type: string | null
  ip_address: string | null
  vpn_active: boolean | null
  developer_options: boolean | null
  usb_debugging: boolean | null
  root_detected: boolean | null
  extra_metrics: Record<string, any> | null
}

export interface Device {
  id: string
  user_id: string
  device_identifier: string
  device_name: string
  manufacturer: string | null
  model: string | null
  android_version: string | null
  sdk_version: number | null
  agent_version: string | null
  status: string
  last_seen: string | null
  telemetry: DeviceTelemetry
  assigned_profile_id: string | null
  created_at: string
}

export interface DeviceSyncConfig {
  device_id: string
  status: string
  assigned_profile: Record<string, any> | null
  effective_applications: string[]
}