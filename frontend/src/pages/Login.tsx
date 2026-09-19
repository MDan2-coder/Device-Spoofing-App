import { useState, type FormEvent } from 'react'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(destination || '/dashboard', { replace: true })
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Those credentials could not be verified.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <section className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">DeviceOps</p>
            <p className="text-sm text-slate-500">Control plane access</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20">
          <div className="mb-8">
            <p className="mb-2 text-sm font-medium text-primary">Welcome back</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Sign in to your workspace</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Manage profiles, devices, and operational backups from one place.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium text-slate-300">
              Email address
              <input
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Password
              <input
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>

            {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            New to DeviceOps? <Link className="font-semibold text-primary hover:text-blue-300" to="/register">Create an account</Link>
          </p>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-600"><KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Your session is protected with rotating tokens.</p>
      </section>
    </main>
  )
}
