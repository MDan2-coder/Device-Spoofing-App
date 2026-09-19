export interface ProfileCategory {
  id: string
  name: string
  color: string
}

export interface ProfileIdentifiers {
  android_id?: string
  imei_1?: string
  imei_2?: string
  gsf_id?: string
  serial_number?: string
  build_fingerprint?: string
  [key: string]: string | undefined
}

export interface ProfileTelephony {
  sim_operator?: string
  sim_country_iso?: string
  line_1_number?: string
  network_operator_name?: string
  [key: string]: string | undefined
}

export interface ProfileNetwork {
  wifi_ssid?: string
  wifi_bssid?: string
  mac_address?: string
  dns1?: string
  dns2?: string
  [key: string]: string | undefined
}

export interface ProfileLocation {
  latitude?: number | null
  longitude?: number | null
  altitude?: number | null
  accuracy?: number | null
  mock_enabled: boolean
}

export interface ProfileStealthRules {
  hide_root: boolean
  hide_developer_options: boolean
  hide_mock_locations: boolean
  cloak_vpn: boolean
}

export interface ProfileSettings {
  identifiers: ProfileIdentifiers
  telephony: ProfileTelephony
  network: ProfileNetwork
  location: ProfileLocation
  stealth_rules: ProfileStealthRules
}

export interface DeviceProfile {
  id: string
  user_id: string
  category_id: string | null
  device_id: string | null
  name: string
  description: string | null
  notes: string | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  settings: ProfileSettings
}

export interface ProfilePayload {
  name: string
  description?: string | null
  category_id?: string | null
  settings: ProfileSettings
}
