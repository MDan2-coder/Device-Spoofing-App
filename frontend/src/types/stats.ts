export interface StatsForNerds {
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

export interface AuditLog {
  id: string
  action: string
  ip_address?: string | null
  details: Record<string, unknown>
  created_at: string
}
