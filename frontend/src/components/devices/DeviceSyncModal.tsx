import { useEffect, useState } from 'react'
import { AppWindow, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import apiClient from '../../api/client'
import type { Device, DeviceSyncConfig } from '../../types/device'

export default function DeviceSyncModal({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const [config, setConfig] = useState<DeviceSyncConfig | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { if (!device) return; setConfig(null); setError(''); void apiClient.get<DeviceSyncConfig>(`/devices/${device.id}/sync`).then(({ data }) => setConfig(data)).catch(() => setError('Synchronization details could not be loaded.')) }, [device])
  if (!device) return null
  const settings = config?.assigned_profile?.settings as Record<string, Record<string, unknown>> | undefined
  const carrierCloaks = settings?.telephony ?? {}
  const stealthRules = settings?.stealth_rules ?? {}
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="sync-device-title">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-border px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Runtime inspection</p><h2 className="mt-1 text-lg font-semibold text-slate-50" id="sync-device-title">{device.device_name} sync config</h2></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close modal"><X className="h-5 w-5" /></button></div>
      {error ? <p className="m-6 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p> : !config ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-400"><LoaderCircle className="h-5 w-5 animate-spin" />Loading synchronization state</div> : <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2"><Info label="Runtime status" value={config.status} /><Info label="Assigned profile" value={config.assigned_profile?.name as string | undefined ?? 'None'} /></div>
        <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><ShieldCheck className="h-4 w-4 text-primary" />Carrier cloaks & stealth rules</h3><div className="grid gap-2 rounded-lg border border-border bg-bg p-4 sm:grid-cols-2">{Object.entries({ ...carrierCloaks, ...stealthRules }).length ? Object.entries({ ...carrierCloaks, ...stealthRules }).map(([key, value]) => <Info key={key} label={key.replaceAll('_', ' ')} value={String(value)} />) : <p className="text-sm text-slate-500">No carrier or stealth overrides assigned.</p>}</div></section>
        <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><AppWindow className="h-4 w-4 text-primary" />Effective applications <span className="text-xs font-normal text-slate-500">({config.effective_applications.length})</span></h3><div className="flex flex-wrap gap-2">{config.effective_applications.length ? config.effective_applications.map((application) => <span className="rounded-md border border-border bg-bg px-2.5 py-1.5 font-mono text-xs text-slate-300" key={application}>{application}</span>) : <p className="text-sm text-slate-500">No applications are currently resolved.</p>}</div></section>
      </div>}
    </div>
  </div>
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-sm capitalize text-slate-300">{value}</p></div> }