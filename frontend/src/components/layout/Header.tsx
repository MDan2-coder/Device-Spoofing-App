import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, LogOut, Menu, Server, UserRound } from 'lucide-react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  profiles: 'Device Profiles',
  devices: 'Connected Devices',
  applications: 'App Inventory',
  backups: 'Backups & Snapshots',
  admin: 'Admin Panel',
  stats: 'Statistics',
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get('http://localhost:8000/health', { timeout: 3000 })
        setIsOnline(true)
      } catch {
        setIsOnline(false)
      }
    }
    void checkHealth()
  }, [])

  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', closeProfileMenu)
    return () => document.removeEventListener('mousedown', closeProfileMenu)
  }, [])

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.length > 0 ? segments : ['dashboard']

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-border/80 bg-bg/90 px-3 backdrop-blur sm:min-h-20 sm:gap-4 sm:px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button className="rounded-lg border border-border p-2 text-slate-400 hover:bg-card hover:text-slate-100 lg:hidden" type="button" onClick={onMenuClick} aria-label="Open navigation"><Menu className="h-5 w-5" aria-hidden="true" /></button>
        <nav className="flex min-w-0 max-w-[58vw] items-center gap-1 overflow-hidden text-sm sm:max-w-none" aria-label="Breadcrumb">
          <Link className="hidden text-slate-500 hover:text-slate-200 sm:block" to="/dashboard">Workspace</Link>
          {crumbs.map((segment, index) => (
            <span className="flex min-w-0 items-center gap-1" key={`${segment}-${index}`}>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-700" aria-hidden="true" />
              <span className={`${index === crumbs.length - 1 ? 'truncate font-medium text-slate-100' : 'hidden text-slate-500 md:block'}`}>{breadcrumbLabels[segment] ?? segment}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-slate-400 sm:flex" title={isOnline ? 'Backend API is reachable' : 'Backend API is unreachable'}>
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-accent shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-400'}`} aria-hidden="true" />
          <Server className="h-3.5 w-3.5" aria-hidden="true" />
          {isOnline ? 'API online' : 'API offline'}
        </div>
        <div className="relative" ref={profileRef}>
          <button className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-card" type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
            <span className="hidden max-w-40 sm:block"><span className="block truncate text-sm font-medium text-slate-200">{user?.full_name || user?.email}</span><span className="block text-xs uppercase tracking-wider text-slate-500">{user?.role}</span></span>
            <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition sm:block ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {profileOpen && <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-surface p-2 shadow-2xl shadow-black/30" role="menu"><div className="border-b border-border px-3 py-3"><p className="truncate text-sm font-medium text-slate-100">{user?.full_name || 'Workspace user'}</p><p className="mt-1 truncate text-xs text-slate-500">{user?.email}</p><span className="mt-2 inline-flex rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">{user?.role}</span></div><button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-card hover:text-slate-100" type="button" role="menuitem" onClick={logout}><LogOut className="h-4 w-4" aria-hidden="true" />Log out</button></div>}
        </div>
      </div>
    </header>
  )
}
