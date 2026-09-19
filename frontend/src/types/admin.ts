export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface GlobalStats {
  total_profiles: number
  active_profiles: number
  trash_profiles: number
  total_devices: number
  online_devices: number
  offline_devices: number
  total_app_groups: number
  total_applications: number
  total_backups: number
  total_storage_bytes: number
}

export interface AdminAuditLog {
  id: string
  user_id: string | null
  device_id: string | null
  action: string
  ip_address: string | null
  details: Record<string, any>
  created_at: string
}