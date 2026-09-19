import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, BatteryCharging, CheckCircle2, Cpu, Plus, RefreshCw, Search, ShieldAlert, Trash2, Wifi } from 'lucide-react'
import apiClient from '../api/client'
import DeviceSyncModal from '../components/devices/DeviceSyncModal'
import EnrollDeviceModal from '../components/devices/EnrollDeviceModal'
import SimulateHeartbeatModal from '../components/devices/SimulateHeartbeatModal'
import type { Device, DeviceTelemetry } from '../types/device'
import type { DeviceProfile } from '../types/profile'

type StatusFilter = 'all' | 'online' | 'offline'
const emptyTelemetry: DeviceTelemetry = { battery_level: null, is_charging: null, network_type: null, ip_address: null, vpn_active: null, developer_options: null, usb_debugging: null, root_detected: null, extra_metrics: null }
const normalize = (device: Device): Device => ({ ...device, telemetry: { ...emptyTelemetry, ...device.telemetry } })

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [profiles, setProfiles] = useState<DeviceProfile[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [syncDevice, setSyncDevice] = useState<Device | null>(null)
  const [heartbeatDevice, setHeartbeatDevice] = useState<Device | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true); setError('')
    try { const [devicesResponse, profilesResponse] = await Promise.all([apiClient.get<Device[]>('/devices/'), apiClient.get<DeviceProfile[]>('/profiles/')]); setDevices(devicesResponse.data.map(normalize)); setProfiles(profilesResponse.data) }
    catch { setError('The device fleet could not be loaded. Check the API connection and try again.') }
    finally { setIsLoading(false) }
  }, [])
  useEffect(() => { void loadData() }, [loadData])

  const visibleDevices = useMemo(() => devices.filter((device) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${device.device_name} ${device.device_identifier} ${device.manufacturer ?? ''}`.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || device.status.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  }), [devices, search, statusFilter])

  const assignProfile = async (device: Device, profileId: string) => {
    try { const { data } = await apiClient.post<Device>(`/devices/${device.id}/assign-profile`, { profile_id: profileId || null }); setDevices((current) => current.map((item) => item.id === device.id ? normalize(data) : item)) }
    catch { setError('The device profile assignment could not be updated.') }
  }
  const deleteDevice = async (device: Device) => {
    if (!window.confirm(`Delete ${device.device_name}? This cannot be undone.`)) return
    try { await apiClient.delete(`/devices/${device.id}`); setDevices((current) => current.filter((item) => item.id !== device.id)) }
    catch { setError('The device could not be deleted.') }
  }
  const updateDevice = (device: Device) => setDevices((current) => current.map((item) => item.id === device.id ? normalize(device) : item))

  return <section><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Fleet control plane</p><h1 className="text-3xl font-semibold tracking-tight text-slate-50">Device Fleet Manager</h1><p className="mt-3 text-slate-400">Monitor hardware telemetry, runtime health, and active profile assignments.</p></div><div className="flex gap-3"><button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-card hover:text-slate-100 disabled:opacity-60" type="button" onClick={() => void loadData()} disabled={isLoading}><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500" type="button" onClick={() => setEnrollOpen(true)}><Plus className="h-4 w-4" />Enroll Device</button></div></div>
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 lg:flex-row lg:items-center lg:justify-between"><label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-600" /><input className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary sm:w-80" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, identifier, manufacturer" aria-label="Search devices" /></label><div className="flex rounded-lg bg-bg p-1">{(['all', 'online', 'offline'] as StatusFilter[]).map((filter) => <button className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition ${statusFilter === filter ? 'bg-card text-slate-100 shadow' : 'text-slate-500 hover:text-slate-200'}`} type="button" key={filter} onClick={() => setStatusFilter(filter)}>{filter}</button>)}</div></div>
    {error && <div className="mb-6 flex items-center justify-between rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}<button className="inline-flex items-center gap-2 font-semibold" type="button" onClick={() => void loadData()}>Retry <RefreshCw className="h-4 w-4" /></button></div>}
    {isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" key={index} />)}</div> : visibleDevices.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center"><Cpu className="mx-auto h-8 w-8 text-slate-600" /><h2 className="mt-4 font-semibold text-slate-200">{devices.length ? 'No matching devices' : 'No devices enrolled'}</h2><p className="mt-2 text-sm text-slate-500">{devices.length ? 'Try a different search or status filter.' : 'Enroll an Android device to start collecting telemetry.'}</p>{!devices.length && <button className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => setEnrollOpen(true)}>Enroll Device</button>}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleDevices.map((device) => <DeviceCard device={device} profiles={profiles} key={device.id} onAssign={assignProfile} onDelete={deleteDevice} onInspect={setSyncDevice} onHeartbeat={setHeartbeatDevice} />)}</div>}
    <EnrollDeviceModal open={enrollOpen} onClose={() => setEnrollOpen(false)} onEnrolled={(device) => setDevices((current) => [normalize(device), ...current.filter((item) => item.id !== device.id)])} /><DeviceSyncModal device={syncDevice} onClose={() => setSyncDevice(null)} /><SimulateHeartbeatModal device={heartbeatDevice} onClose={() => setHeartbeatDevice(null)} onUpdated={(device) => { updateDevice(device); void loadData() }} />
  </section>
}

function DeviceCard({ device, profiles, onAssign, onDelete, onInspect, onHeartbeat }: { device: Device; profiles: DeviceProfile[]; onAssign: (device: Device, profileId: string) => Promise<void>; onDelete: (device: Device) => Promise<void>; onInspect: (device: Device) => void; onHeartbeat: (device: Device) => void }) {
  const telemetry = device.telemetry
  const isOnline = device.status.toLowerCase() === 'online'
  const battery = telemetry.battery_level
  return <article className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/60"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isOnline ? 'bg-accent/10 text-accent' : 'bg-card text-slate-500'}`}><Cpu className="h-5 w-5" />{isOnline && <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-accent" />}</span><div className="min-w-0"><h2 className="truncate font-semibold text-slate-100" title={device.device_name}>{device.device_name}</h2><p className="mt-1 truncate font-mono text-[11px] text-slate-500">{device.device_identifier}</p></div></div><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${isOnline ? 'border-accent/30 text-accent' : 'border-border text-slate-500'}`}>{device.status}</span></div><div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400"><span className="rounded-md bg-card px-2 py-1">{device.manufacturer ?? 'Unknown maker'}</span><span className="rounded-md bg-card px-2 py-1">{device.model ?? 'Unknown model'}</span><span className="rounded-md bg-card px-2 py-1">Android {device.android_version ?? '—'}</span></div><div className="mt-5 space-y-4 border-t border-border/70 pt-4"><div><div className="mb-1 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-400">{telemetry.is_charging ? <BatteryCharging className="h-4 w-4 text-accent" /> : <Activity className="h-4 w-4 text-slate-500" />}Battery</span><span className="font-mono text-slate-300">{battery == null ? '—' : `${battery}%`}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-bg"><div className={`h-full rounded-full ${battery != null && battery < 20 ? 'bg-red-400' : 'bg-accent'}`} style={{ width: `${Math.max(0, Math.min(100, battery ?? 0))}%` }} /></div></div><div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-500"><Wifi className="h-4 w-4" />{telemetry.network_type ?? 'Network unknown'}</span><span className="font-mono text-slate-400">{telemetry.ip_address ?? 'No IP address'}</span></div><div className={`flex items-center gap-2 text-xs ${telemetry.root_detected ? 'text-red-300' : 'text-slate-500'}`}>{telemetry.root_detected ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-accent" />}{telemetry.root_detected ? 'Root detected' : 'Root not detected'}</div></div><select className="mt-5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-300 outline-none focus:border-primary" value={device.assigned_profile_id ?? ''} onChange={(event) => void onAssign(device, event.target.value)} aria-label={`Profile for ${device.device_name}`}><option value="">No profile assigned</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select><div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2"><button className="rounded-lg border border-border px-2 py-2 text-xs font-semibold text-slate-300 hover:bg-card hover:text-slate-100" type="button" onClick={() => onInspect(device)}>Inspect Sync</button><button className="rounded-lg border border-border px-2 py-2 text-xs font-semibold text-slate-300 hover:bg-card hover:text-slate-100" type="button" onClick={() => onHeartbeat(device)}>Heartbeat</button><button className="rounded-lg p-2 text-slate-500 hover:bg-red-400/10 hover:text-red-300" type="button" onClick={() => void onDelete(device)} aria-label={`Delete ${device.device_name}`} title="Delete device"><Trash2 className="h-4 w-4" /></button></div></article>
}
