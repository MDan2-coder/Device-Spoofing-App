import { useEffect, useState } from 'react'
import { Check, CircleAlert, LoaderCircle, Minus, Plus, Trash2, X } from 'lucide-react'
import apiClient from '../../api/client'
import type { AppGroup, Application } from '../../types/application'

interface GroupDetailDrawerProps {
  group: AppGroup | null
  applications: Application[]
  onClose: () => void
  onChanged: (group: AppGroup) => void
  onDeleted: (groupId: string) => void
}

export default function GroupDetailDrawer({ group, applications, onClose, onChanged, onDeleted }: GroupDetailDrawerProps) {
  const [selectedApplication, setSelectedApplication] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedApplication('')
    setError('')
  }, [group?.id])

  if (!group) return null

  const memberIds = new Set(group.applications.map((member) => member.application.id))
  const availableApplications = applications.filter((application) => !memberIds.has(application.id))
  const changeMember = async (applicationId: string, isExcluded: boolean) => {
    setIsBusy(true)
    setError('')
    try {
      const response = await apiClient.post<AppGroup>(`/applications/groups/${group.id}/members`, { application_id: applicationId, is_excluded: isExcluded })
      onChanged(response.data)
    } catch { setError('The group rule could not be updated.') } finally { setIsBusy(false) }
  }
  const addApplication = async () => {
    if (!selectedApplication) return
    await changeMember(selectedApplication, false)
    setSelectedApplication('')
  }
  const removeApplication = async (applicationId: string) => {
    setIsBusy(true)
    setError('')
    try {
      await apiClient.delete(`/applications/groups/${group.id}/members/${applicationId}`)
      const response = await apiClient.get<AppGroup>(`/applications/groups/${group.id}`)
      onChanged(response.data)
    } catch { setError('The application could not be removed from this group.') } finally { setIsBusy(false) }
  }

  return <><div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" onClick={onClose} /><aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-border bg-surface shadow-2xl shadow-black/50" aria-label={`Manage ${group.name}`}><div className="flex items-start justify-between border-b border-border px-6 py-5"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bundle rules</p><h2 className="mt-1 truncate text-xl font-semibold text-slate-50">{group.name}</h2><p className="mt-2 text-sm text-slate-400">{group.description || 'No description provided.'}</p></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close group details"><X className="h-5 w-5" aria-hidden="true" /></button></div><div className="border-b border-border p-5"><label className="block text-sm font-medium text-slate-300">Add application to group<div className="mt-2 flex gap-2"><select className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-primary" value={selectedApplication} onChange={(event) => setSelectedApplication(event.target.value)}><option value="">Select from catalog...</option>{availableApplications.map((application) => <option value={application.id} key={application.id}>{application.app_name} · {application.package_name}</option>)}</select><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50" type="button" onClick={() => void addApplication()} disabled={!selectedApplication || isBusy}><Plus className="h-4 w-4" aria-hidden="true" />Add</button></div></label></div>{error && <p className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert"><CircleAlert className="h-4 w-4" aria-hidden="true" />{error}</p>}<div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Member applications</h3><span className="text-xs text-slate-600">{group.applications.length} total</span></div>{group.applications.length === 0 ? <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center text-sm text-slate-500">This group has no applications yet.</div> : <div className="space-y-2">{group.applications.map((member) => <div className="rounded-xl border border-border bg-bg/50 p-4" key={member.application.id}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className={`truncate font-medium ${member.is_excluded ? 'text-red-300 line-through' : 'text-slate-100'}`}>{member.application.app_name}</p><p className={`mt-1 truncate font-mono text-xs ${member.is_excluded ? 'text-red-400/70 line-through' : 'text-slate-500'}`}>{member.application.package_name}</p></div><button className="rounded-md p-1.5 text-slate-500 hover:bg-card hover:text-red-300" type="button" onClick={() => void removeApplication(member.application.id)} aria-label={`Remove ${member.application.app_name}`} disabled={isBusy}><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div><div className="mt-3 flex items-center justify-between gap-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${member.is_excluded ? 'bg-red-400/10 text-red-300' : 'bg-accent/10 text-accent'}`}><span className={`h-1.5 w-1.5 rounded-full ${member.is_excluded ? 'bg-red-400' : 'bg-accent'}`} aria-hidden="true" />{member.is_excluded ? 'Excluded / Blocked' : 'Active / Monitored'}</span><button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-100" type="button" onClick={() => void changeMember(member.application.id, !member.is_excluded)} disabled={isBusy}>{member.is_excluded ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Minus className="h-3.5 w-3.5" aria-hidden="true" />}{member.is_excluded ? 'Include' : 'Exclude'}</button></div></div>)}</div>}</div><footer className="border-t border-border bg-bg/70 p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Effective Runtime Output</p><p className="mt-1 text-xs text-slate-500">Target - Excluded</p></div>{isBusy && <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />}</div><div className="mt-3 flex flex-wrap gap-2">{group.resolved_package_names.length === 0 ? <span className="text-sm text-slate-600">No packages will be sent to the agent.</span> : group.resolved_package_names.map((packageName) => <code className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-xs text-accent" key={packageName}>{packageName}</code>)}</div><button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-400/10" type="button" onClick={() => { if (window.confirm(`Delete group ${group.name}?`)) { void apiClient.delete(`/applications/groups/${group.id}`).then(() => onDeleted(group.id)).catch(() => setError('The group could not be deleted.')) } }}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete group</button></footer></aside></>
}
