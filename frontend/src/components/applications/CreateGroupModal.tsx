import { useState, type FormEvent } from 'react'
import { Boxes, LoaderCircle, X } from 'lucide-react'
import apiClient from '../../api/client'
import type { AppGroup } from '../../types/application'

interface CreateGroupModalProps {
  open: boolean
  onClose: () => void
  onCreated: (group: AppGroup) => void
}

export default function CreateGroupModal({ open, onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Group name is required.')
      return
    }
    setError('')
    setIsSaving(true)
    try {
      const response = await apiClient.post<AppGroup>('/applications/groups', { name: name.trim(), description: description.trim() || null })
      onCreated(response.data)
      setName('')
      setDescription('')
      onClose()
    } catch {
      setError('The group could not be created. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-group-title"><div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50"><div className="flex items-center justify-between border-b border-border px-6 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><Boxes className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Bundle builder</p><h2 className="mt-1 text-lg font-semibold text-slate-50" id="create-group-title">Create application group</h2></div></div><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={onClose} aria-label="Close modal"><X className="h-5 w-5" aria-hidden="true" /></button></div><form className="space-y-5 p-6" onSubmit={submit}><label className="block text-sm font-medium text-slate-300">Group name<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" value={name} onChange={(event) => setName(event.target.value)} placeholder="QA essentials" required /></label><label className="block text-sm font-medium text-slate-300">Description<textarea className="mt-2 min-h-28 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Applications assigned to the QA device fleet" /></label>{error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}<div className="flex justify-end gap-3 border-t border-border pt-5"><button className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-card" type="button" onClick={onClose}>Cancel</button><button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{isSaving ? 'Creating...' : 'Create group'}</button></div></form></div></div>
}
