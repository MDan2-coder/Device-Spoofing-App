import { useEffect, useState, type FormEvent } from 'react'
import { Archive, LoaderCircle, X } from 'lucide-react'
import apiClient from '../../api/client'
import type { DeviceProfile } from '../../types/profile'
import type { Backup, BackupCreatePayload } from '../../types/backup'

interface CreateBackupModalProps {
  open: boolean
  onClose: () => void
  onCreated: (backup: Backup) => void
}

export default function CreateBackupModal({ open, onClose, onCreated }: CreateBackupModalProps) {
  const [profiles, setProfiles] = useState<DeviceProfile[]>([])
  const [profileId, setProfileId] = useState('')
  const [backupName, setBackupName] = useState('')
  const [backupType, setBackupType] = useState('CONFIG_ONLY')
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setIsLoadingProfiles(true)
    void apiClient.get<DeviceProfile[]>('/profiles/').then(({ data }) => {
      const activeProfiles = data.filter((profile) => profile.is_active && !profile.deleted_at)
      setProfiles(activeProfiles)
      setProfileId((current) => current || activeProfiles[0]?.id || '')
    }).catch(() => setError('Active profiles could not be loaded.')).finally(() => setIsLoadingProfiles(false))
  }, [open])

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!backupName.trim() || !profileId) { setError('Snapshot name and target profile are required.'); return }
    setIsSaving(true)
    setError('')
    const payload: BackupCreatePayload = { profile_id: profileId, backup_name: backupName.trim(), backup_type: backupType }
    try {
      const { data } = await apiClient.post<Backup>('/backups/', payload)
      onCreated(data)
      setBackupName('')
      setBackupType('CONFIG_ONLY')
      onClose()
    } catch { setError('The snapshot could not be created. Check the selected profile and try again.') } finally { setIsSaving(false) }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-backup-title">
    <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-border px-6 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Archive className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Configuration archive</p><h2 className="mt-1 text-lg font-semibold text-slate-50" id="create-backup-title">Create snapshot</h2></div></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close modal"><X className="h-5 w-5" /></button></div>
      <form className="space-y-5 p-6" onSubmit={submit}><label className="block text-sm font-medium text-slate-300">Snapshot name<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary" value={backupName} onChange={(event) => setBackupName(event.target.value)} placeholder="Pixel QA baseline - September" required /></label><label className="block text-sm font-medium text-slate-300">Target profile<select className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none focus:border-primary" value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={isLoadingProfiles} required><option value="">{isLoadingProfiles ? 'Loading profiles...' : 'Select a profile'}</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-300">Backup type<select className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none focus:border-primary" value={backupType} onChange={(event) => setBackupType(event.target.value)}><option value="CONFIG_ONLY">Config Only</option><option value="FULL_SNAPSHOT">Full Snapshot</option></select></label>{error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}<div className="flex justify-end gap-3 border-t border-border pt-5"><button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-100" type="button" onClick={onClose}>Cancel</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60" type="submit" disabled={isSaving || isLoadingProfiles}>{isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}Create snapshot</button></div></form>
    </div>
  </div>
}