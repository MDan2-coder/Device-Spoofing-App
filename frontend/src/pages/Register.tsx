import { useState, type FormEvent } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../api/client'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || password.length < 8) {
      setError('Use a valid email and a password with at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({ email: email.trim(), password, full_name: fullName.trim() || undefined })
      navigate('/dashboard', { replace: true })
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'We could not create that account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <section className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><ShieldCheck aria-hidden="true" /></div>
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">DeviceOps</p><p className="text-sm text-slate-500">A calmer control plane</p></div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20">
          <div className="mb-8"><p className="mb-2 text-sm font-medium text-accent">Get started</p><h1 className="text-3xl font-semibold tracking-tight text-slate-50">Create your workspace</h1><p className="mt-3 text-sm leading-6 text-slate-400">Bring your device fleet and configuration profiles into focus.</p></div>
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium text-slate-300">Full name<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" /></label>
            <label className="block text-sm font-medium text-slate-300">Email address<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required /></label>
            <label className="block text-sm font-medium text-slate-300">Password<input className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} /></label>
            {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating workspace...' : 'Create account'}{!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}</button>
          </form>
          <p className="mt-8 text-center text-sm text-slate-400">Already have access? <Link className="font-semibold text-primary hover:text-blue-300" to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}
