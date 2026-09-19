import { useCallback, useEffect, useState } from 'react'
import { Archive, AppWindow, Boxes, CheckCircle2, CircleAlert, Clock3, FilePlus2, HardDriveDownload, Plus, RefreshCw, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { AuditLog, StatsForNerds } from '../types/stats'

const emptyStats: StatsForNerds = { total_profiles: 0, active_profiles: 0, trash_profiles: 0, total_devices: 0, online_devices: 0, offline_devices: 0, total_app_groups: 0, total_applications: 0, total_backups: 0, total_storage_bytes: 0 }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = -1
  do { value /= 1024; unitIndex += 1 } while (value >= 1024 && unitIndex < units.length - 1)
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp))
}

function detailText(details: Record<string, unknown>): string {
  return Object.entries(details).map(([key, value]) => `${key}: ${String(value)}`).join(' | ') || 'No additional details'
}

function MetricSkeleton() { return <div className="h-36 animate-pulse rounded-xl border border-border bg-surface/70" aria-hidden="true" /> }

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<StatsForNerds>(emptyStats)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsResponse, auditResponse] = await Promise.all([apiClient.get<StatsForNerds>('/statistics'), apiClient.get<AuditLog[]>('/statistics/audit-logs')])
      setStats(statsResponse.data)
      setAuditLogs(auditResponse.data)
    } catch { setError('Dashboard data could not be loaded. Check the API connection and try again.') } finally { setIsLoading(false) }
  }, [])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const metrics = [
    { label: 'Profiles', icon: Boxes, value: stats.active_profiles, detail: `${stats.trash_profiles} in trash`, accent: 'text-primary' },
    { label: 'Devices', icon: Smartphone, value: stats.total_devices, detail: `${stats.online_devices} online`, accent: 'text-accent', beacon: true },
    { label: 'Application Bundles', icon: AppWindow, value: stats.total_app_groups, detail: `${stats.total_applications} packages registered`, accent: 'text-blue-300' },
    { label: 'Storage Engine', icon: HardDriveDownload, value: stats.total_backups, detail: formatBytes(stats.total_storage_bytes), accent: 'text-amber-300' },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Operations overview</p><h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">Good to see you, {user?.full_name || user?.email.split('@')[0]}.</h1><p className="mt-3 max-w-2xl text-slate-400">A live readout of your device fleet, configuration profiles, and backup footprint.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-primary hover:text-white disabled:opacity-50" type="button" onClick={() => void loadDashboard()} disabled={isLoading}><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh data</button></div>
      {error && <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between" role="alert"><span className="flex items-center gap-2"><CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />{error}</span><button className="inline-flex items-center gap-2 font-semibold text-red-100 hover:text-white" type="button" onClick={() => void loadDashboard()}>Retry <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /></button></div>}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Fleet metrics">{isLoading ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />) : metrics.map(({ label, icon: Icon, value, detail, accent, beacon }) => <article className="rounded-xl border border-border bg-surface p-5" key={label}><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-card ${accent}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>{beacon && <span className="flex items-center gap-1.5 text-xs font-medium text-accent"><span className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_9px_rgba(16,185,129,0.8)]" aria-hidden="true" />Live</span>}</div><p className="mt-7 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">{value}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></article>)}</section>
      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="min-w-0 rounded-xl border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-slate-100">Recent Audit Ledger</h2><p className="mt-1 text-xs text-slate-500">Latest activity across your workspace</p></div><Clock3 className="h-5 w-5 text-slate-500" aria-hidden="true" /></div>{isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 4 }, (_, index) => <div className="h-10 animate-pulse rounded bg-card" key={index} />)}</div> : auditLogs.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No audit events recorded yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-3 font-medium">Timestamp</th><th className="px-5 py-3 font-medium">Action</th><th className="px-5 py-3 font-medium">IP address</th><th className="px-5 py-3 font-medium">Details</th></tr></thead><tbody className="divide-y divide-border/70">{auditLogs.map((log) => <tr className="text-slate-400" key={log.id}><td className="whitespace-nowrap px-5 py-4">{formatTimestamp(log.created_at)}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 font-medium text-slate-200"><CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />{log.action}</span></td><td className="px-5 py-4 font-mono text-xs">{log.ip_address || 'Internal'}</td><td className="max-w-xs truncate px-5 py-4" title={detailText(log.details)}>{detailText(log.details)}</td></tr>)}</tbody></table></div>}</div><aside className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold text-slate-100">Quick actions</h2><p className="mt-1 text-sm text-slate-500">Jump into a common operation.</p><div className="mt-5 space-y-2"><Link className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-sm font-medium text-slate-300 transition hover:border-primary hover:text-white" to="/profiles"><FilePlus2 className="h-4 w-4 text-primary" aria-hidden="true" />New Profile</Link><Link className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-sm font-medium text-slate-300 transition hover:border-primary hover:text-white" to="/devices"><Plus className="h-4 w-4 text-accent" aria-hidden="true" />Add Device</Link><Link className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-sm font-medium text-slate-300 transition hover:border-primary hover:text-white" to="/backups"><Archive className="h-4 w-4 text-amber-300" aria-hidden="true" />Run Snapshot</Link></div></aside></section>
    </div>
  )
}
