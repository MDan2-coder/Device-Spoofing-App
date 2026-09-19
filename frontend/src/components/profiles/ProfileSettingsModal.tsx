import { useEffect, useState, type FormEvent } from 'react'
import { Check, LoaderCircle, Save, X } from 'lucide-react'
import apiClient from '../../api/client'
import type {
  DeviceProfile,
  ProfileCategory,
  ProfileLocation,
  ProfilePayload,
  ProfileSettings,
} from '../../types/profile'

interface ProfileSettingsModalProps {
  open: boolean
  profile?: DeviceProfile | null
  categories: ProfileCategory[]
  onClose: () => void
  onSaved: (profile: DeviceProfile) => void
}

type TabKey = 'general' | 'hardware' | 'telephony' | 'network' | 'location' | 'stealth'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'general', label: 'General' },
  { key: 'hardware', label: 'Hardware Identifiers' },
  { key: 'telephony', label: 'Telephony' },
  { key: 'network', label: 'Network' },
  { key: 'location', label: 'Geolocation' },
  { key: 'stealth', label: 'Cloaking & Stealth' },
]

const blankSettings: ProfileSettings = {
  identifiers: {},
  telephony: {},
  network: {},
  location: { mock_enabled: false },
  stealth_rules: {
    hide_root: false,
    hide_developer_options: false,
    hide_mock_locations: false,
    cloak_vpn: false,
  },
}

function buildSettings(profile?: DeviceProfile | null): ProfileSettings {
  return {
    identifiers: { ...blankSettings.identifiers, ...(profile?.settings?.identifiers ?? {}) },
    telephony: { ...blankSettings.telephony, ...(profile?.settings?.telephony ?? {}) },
    network: { ...blankSettings.network, ...(profile?.settings?.network ?? {}) },
    location: { ...blankSettings.location, ...(profile?.settings?.location ?? {}) },
    stealth_rules: { ...blankSettings.stealth_rules, ...(profile?.settings?.stealth_rules ?? {}) },
  }
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string | number | undefined | null; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="block text-sm font-medium text-slate-300">{label}<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-bg/50 px-4 py-3"><span className="text-sm text-slate-300">{label}</span><button className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-accent' : 'bg-slate-700'}`} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} /></button></label>
}

export default function ProfileSettingsModal({ open, profile, categories, onClose, onSaved }: ProfileSettingsModalProps) {
  const [tab, setTab] = useState<TabKey>('general')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [settings, setSettings] = useState<ProfileSettings>(blankSettings)
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTab('general')
    setName(profile?.name ?? '')
    setDescription(profile?.description ?? '')
    setCategoryId(profile?.category_id ?? '')
    setSettings(buildSettings(profile))
    setNotice(null)
  }, [open, profile])

  if (!open) return null

  const updateSection = <Section extends keyof ProfileSettings>(section: Section, key: keyof ProfileSettings[Section], value: string | number | boolean | null) => {
    setSettings((current) => ({ ...current, [section]: { ...current[section], [key]: value } }))
  }

  const handleNumberChange = (section: 'location', key: keyof ProfileLocation, value: string) => {
    updateSection(section, key, value === '' ? null : Number(value))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setTab('general')
      setNotice({ kind: 'error', message: 'Profile name is required.' })
      return
    }

    const payload: ProfilePayload = {
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      settings,
    }
    setIsSaving(true)
    setNotice(null)
    try {
      const response = profile
        ? await apiClient.put<DeviceProfile>(`/profiles/${profile.id}`, payload)
        : await apiClient.post<DeviceProfile>('/profiles/', payload)
      setNotice({ kind: 'success', message: profile ? 'Profile settings saved.' : 'Profile created.' })
      onSaved(response.data)
    } catch {
      setNotice({ kind: 'error', message: 'The profile could not be saved. Check the fields and try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateText = (section: keyof ProfileSettings, key: string) => (value: string) => updateSection(section, key as never, value)
  const identifiers = settings.identifiers
  const telephony = settings.telephony
  const network = settings.network
  const location = settings.location
  const stealth = settings.stealth_rules

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-studio-title"><div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50"><div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Profile studio</p><h2 className="mt-1 text-xl font-semibold text-slate-50" id="profile-studio-title">{profile ? 'Edit profile settings' : 'Create device profile'}</h2></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close profile editor"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="overflow-x-auto border-b border-border"><div className="flex min-w-max gap-1 px-5 md:px-7">{tabs.map((item) => <button className={`border-b-2 px-3 py-3 text-sm font-medium transition ${tab === item.key ? 'border-primary text-blue-300' : 'border-transparent text-slate-500 hover:text-slate-200'}`} type="button" key={item.key} onClick={() => setTab(item.key)}>{item.label}</button>)}</div></div><form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}><div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-7">{tab === 'general' && <div className="grid gap-5 md:grid-cols-2"><Field label="Profile name" value={name} onChange={setName} placeholder="Pixel QA baseline" /><label className="block text-sm font-medium text-slate-300">Category<select className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Uncategorized</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-300 md:col-span-2">Description<textarea className="mt-2 min-h-28 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this configuration profile" /></label></div>}{tab === 'hardware' && <div className="grid gap-5 md:grid-cols-2"><Field label="Android ID" value={identifiers.android_id} onChange={updateText('identifiers', 'android_id')} /><Field label="IMEI 1" value={identifiers.imei_1} onChange={updateText('identifiers', 'imei_1')} /><Field label="IMEI 2" value={identifiers.imei_2} onChange={updateText('identifiers', 'imei_2')} /><Field label="Serial number" value={identifiers.serial_number} onChange={updateText('identifiers', 'serial_number')} /><Field label="GSF ID" value={identifiers.gsf_id} onChange={updateText('identifiers', 'gsf_id')} /><Field label="Build fingerprint" value={identifiers.build_fingerprint} onChange={updateText('identifiers', 'build_fingerprint')} /></div>}{tab === 'telephony' && <div className="grid gap-5 md:grid-cols-2"><Field label="SIM operator" value={telephony.sim_operator} onChange={updateText('telephony', 'sim_operator')} /><Field label="SIM country ISO" value={telephony.sim_country_iso} onChange={updateText('telephony', 'sim_country_iso')} placeholder="us" /><Field label="Carrier name" value={telephony.network_operator_name} onChange={updateText('telephony', 'network_operator_name')} /><Field label="Phone number" value={telephony.line_1_number} onChange={updateText('telephony', 'line_1_number')} /></div>}{tab === 'network' && <div className="grid gap-5 md:grid-cols-2"><Field label="Wi-Fi SSID" value={network.wifi_ssid} onChange={updateText('network', 'wifi_ssid')} /><Field label="Wi-Fi BSSID" value={network.wifi_bssid} onChange={updateText('network', 'wifi_bssid')} /><Field label="MAC address" value={network.mac_address} onChange={updateText('network', 'mac_address')} /><Field label="Primary DNS" value={network.dns1} onChange={updateText('network', 'dns1')} /><Field label="Secondary DNS" value={network.dns2} onChange={updateText('network', 'dns2')} /></div>}{tab === 'location' && <div className="grid gap-5 md:grid-cols-2"><Field label="Latitude" type="number" value={location.latitude} onChange={(value) => handleNumberChange('location', 'latitude', value)} /><Field label="Longitude" type="number" value={location.longitude} onChange={(value) => handleNumberChange('location', 'longitude', value)} /><Field label="Altitude" type="number" value={location.altitude} onChange={(value) => handleNumberChange('location', 'altitude', value)} /><Field label="Accuracy" type="number" value={location.accuracy} onChange={(value) => handleNumberChange('location', 'accuracy', value)} /><div className="md:col-span-2"><Toggle label="Enable mock location" checked={location.mock_enabled} onChange={(value) => updateSection('location', 'mock_enabled', value)} /></div></div>}{tab === 'stealth' && <div className="space-y-3"><Toggle label="Hide root access" checked={stealth.hide_root} onChange={(value) => updateSection('stealth_rules', 'hide_root', value)} /><Toggle label="Hide developer options" checked={stealth.hide_developer_options} onChange={(value) => updateSection('stealth_rules', 'hide_developer_options', value)} /><Toggle label="Hide mock locations" checked={stealth.hide_mock_locations} onChange={(value) => updateSection('stealth_rules', 'hide_mock_locations', value)} /><Toggle label="Cloak VPN presence" checked={stealth.cloak_vpn} onChange={(value) => updateSection('stealth_rules', 'cloak_vpn', value)} /></div>}</div><div className="border-t border-border px-5 py-4 md:px-7">{notice && <p className={`mb-3 flex items-center gap-2 text-sm ${notice.kind === 'error' ? 'text-red-300' : 'text-accent'}`} role="status">{notice.kind === 'success' && <Check className="h-4 w-4" aria-hidden="true" />}{notice.message}</p>}<div className="flex justify-end gap-3"><button className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-card" type="button" onClick={onClose}>Cancel</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{isSaving ? 'Saving...' : 'Save profile'}</button></div></div></form></div></div>
}
