export interface Backup {
  id: string
  user_id: string
  profile_id: string
  file_name: string
  file_size: number
  checksum_sha256: string
  backup_type: string
  status: string
  created_at: string
}

export interface BackupCreatePayload {
  profile_id: string
  backup_name: string
  backup_type: string
}

export interface BackupRestorePayload {
  validate_only: boolean
  clear_cache_flag: boolean
  restore_config_only: boolean
}

export interface BackupRestoreResponse {
  success: boolean
  message: string
  checksum_verified: boolean
  restored_profile_id?: string
}