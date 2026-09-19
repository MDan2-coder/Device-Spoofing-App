export interface Application {
  id: string
  package_name: string
  app_name: string
  version: string | null
  version_code: number | null
  created_at: string
}

export interface GroupMember {
  application: Application
  is_excluded: boolean
}

export interface AppGroup {
  id: string
  user_id: string
  name: string
  description: string | null
  applications: GroupMember[]
  resolved_package_names: string[]
}
