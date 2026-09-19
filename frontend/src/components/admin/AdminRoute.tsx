import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute() {
  const { user } = useAuth()
  const hasAlerted = useRef(false)

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && !hasAlerted.current) {
      hasAlerted.current = true
      window.alert('Access denied: administrator privileges are required.')
    }
  }, [user])

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}