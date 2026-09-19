import { useEffect, useState } from 'react'
import { CheckCircle2, FileCheck2, LoaderCircle, RotateCcw, X } from 'lucide-react'
import apiClient from '../../api/client'
import type { Backup, BackupRestorePayload, BackupRestoreResponse } from '../../types/backup'

export default function RestoreBackupModal({ backup, profileName, onClose }: { backup: Backup | null; profileName: string; onClose: () => void }) {
  const [validateOnly, setValidateOnly] = useState(false)
  const [clearCache, setClearCache] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<BackupRestoreResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { if (backup) { setValidateOnly(false); setClearCache(true); setResult(null); setError('') } }, [backup])
  if (!backup) return null

  const runRestore = async () => {
    setIsRunning(true); setError('')
    const payload: BackupRestorePayload = { validate_only: validateOnly, clear_cache_flag: clearCache, restore_config_only: true }
    try { const { data } = await apiClient.post<BackupRestoreResponse>(`/backups/${backup.id}/restore`, payload); setResult(data) }
    catch (requestError: unknown) { const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail; setError(detail ?? 'The snapshot could not be validated or restored.') }
    finally { setIsRunning(false) }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="restore-backup-title"><div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50"><div className="flex items-center justify-between border-b border-border px-6 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><RotateCcw className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Profile rollback</p><h2 className="mt-1 text-lg font-semibold text-slate-50" id="restore-backup-title">Restore snapshot</h2></div></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close modal"><X className="h-5 w-5" /></button></div><div className="space-y-5 p-6"><div className="rounded-lg border border-border bg-bg p-4"><p className="font-semibold text-slate-100">{backup.file_name}</p><p className="mt-1 text-xs text-slate-500">{profileName} · {new Date(backup.created_at).toLocaleString()}</p><p className="mt-3 break-all font-mono text-xs text-slate-400">SHA-256: {backup.checksum_sha256.slice(0, 16)}...{backup.checksum_sha256.slice(-8)}</p></div><div className="space-y-3"><Toggle label="Dry-Run Only (Validate integrity without overwriting settings)" checked={validateOnly} onChange={setValidateOnly} /><Toggle label="Clear Runtime Cache" checked={clearCache} onChange={setClearCache} /></div>{result && <div className={`rounded-lg border px-4 py-3 ${result.success && result.checksum_verified ? 'border-accent/30 bg-accent/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}><p className="flex items-center gap-2 font-semibold">{result.success && result.checksum_verified ? <CheckCircle2 className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}Checksum {result.checksum_verified ? 'verified' : 'failed'}</p><p className="mt-1 text-sm">{result.message}</p></div>}{error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</div>}<div className="flex justify-end gap-3 border-t border-border pt-5"><button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-100" type="button" onClick={onClose}>Close</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60" type="button" onClick={() => void runRestore()} disabled={isRunning}>{isRunning && <LoaderCircle className="h-4 w-4 animate-spin" />}{validateOnly ? 'Validate snapshot' : 'Restore snapshot'}</button></div></div></div></div>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border bg-bg/50 px-4 py-3"><span className="text-sm text-slate-300">{label}</span><button className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-accent' : 'bg-slate-700'}`} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} /></button></label> }