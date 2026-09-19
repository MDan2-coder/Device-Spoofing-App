import { Navigate, Outlet } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg text-slate-300">
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span>Checking your session</span>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
