import { useState, type FormEvent } from 'react'
import { LoaderCircle, PackagePlus, X } from 'lucide-react'
import apiClient from '../../api/client'
import type { Application } from '../../types/application'

interface RegisterAppModalProps {
  open: boolean
  onClose: () => void
  onRegistered: (application: Application) => void
}

const packagePattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/

export default function RegisterAppModal({ open, onClose, onRegistered }: RegisterAppModalProps) {
  const [packageName, setPackageName] = useState('')
  const [appName, setAppName] = useState('')
  const [version, setVersion] = useState('')
  const [versionCode, setVersionCode] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedPackage = packageName.trim()
    if (!packagePattern.test(normalizedPackage)) {
      setError('Use a valid Android package name, for example com.google.android.youtube.')
      return
    }
    if (!appName.trim()) {
      setError('App name is required.')
      return
    }
    if (versionCode && !/^\d+$/.test(versionCode)) {
      setError('Version code must be a whole number.')
      return
    }

    setError('')
    setIsSaving(true)
    try {
      const response = await apiClient.post<Application>('/applications/apps', {
        package_name: normalizedPackage,
        app_name: appName.trim(),
        version: version.trim() || null,
        version_code: versionCode ? Number(versionCode) : null,
      })
      onRegistered(response.data)
      setPackageName('')
      setAppName('')
      setVersion('')
      setVersionCode('')
      onClose()
    } catch {
      setError('The application could not be registered. It may already exist.')
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="register-app-title"><div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50"><div className="flex items-center justify-between border-b border-border px-6 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><PackagePlus className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Application inventory</p><h2 className="mt-1 text-lg font-semibold text-slate-50" id="register-app-title">Register application</h2></div></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close modal"><X className="h-5 w-5" aria-hidden="true" /></button></div><form className="space-y-5 p-6" onSubmit={submit}><label className="block text-sm font-medium text-slate-300">Package name<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" value={packageName} onChange={(event) => setPackageName(event.target.value)} placeholder="com.google.android.youtube" required /></label><label className="block text-sm font-medium text-slate-300">App name<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" value={appName} onChange={(event) => setAppName(event.target.value)} placeholder="YouTube" required /></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-300">Version<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" value={version} onChange={(event) => setVersion(event.target.value)} placeholder="19.05.34" /></label><label className="block text-sm font-medium text-slate-300">Version code<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" inputMode="numeric" value={versionCode} onChange={(event) => setVersionCode(event.target.value)} placeholder="1905340" /></label></div>{error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}<div className="flex justify-end gap-3 border-t border-border pt-5"><button className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-card" type="button" onClick={onClose}>Cancel</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{isSaving ? 'Registering...' : 'Register app'}</button></div></form></div></div>
}
