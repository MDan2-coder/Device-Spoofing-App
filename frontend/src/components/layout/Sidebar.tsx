import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  HardDriveDownload,
  LayoutDashboard,
  Package,
  ShieldAlert,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface NavigationItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const navigation: NavigationItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Device Profiles', to: '/profiles', icon: Smartphone },
  { label: 'Connected Devices', to: '/devices', icon: Cpu },
  { label: 'App Inventory', to: '/applications', icon: Package },
  { label: 'Backups & Snapshots', to: '/backups', icon: HardDriveDownload },
  { label: 'Recycle Bin', to: '/profiles?trash=true', icon: Trash2 },
]

export default function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const items = user?.role === 'ADMIN'
    ? [...navigation, { label: 'Admin Panel', to: '/admin', icon: ShieldAlert }]
    : navigation

  return (
    <aside
      className={`${mobile ? 'flex' : 'hidden lg:flex'} min-h-full shrink-0 flex-col border-r border-border/80 bg-surface transition-[width] duration-200 ${mobile ? 'w-full' : collapsed ? 'w-20' : 'w-72'}`}
    >
      <div className={`flex h-20 items-center border-b border-border/70 px-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <NavLink className="flex min-w-0 items-center gap-3" to="/dashboard" aria-label="DeviceOps dashboard" onClick={onNavigate}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Cpu className="h-5 w-5" aria-hidden="true" />
          </span>
          {!collapsed && <span className="truncate"><span className="block font-semibold tracking-tight text-slate-100">DeviceOps</span><span className="block text-xs text-slate-500">Fleet control plane</span></span>}
        </NavLink>
        {!collapsed && !mobile && <button className="rounded-md p-2 text-slate-500 hover:bg-card hover:text-slate-200" type="button" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" title="Collapse sidebar"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>}
      </div>

      {collapsed && <button className="mx-auto mt-4 rounded-md p-2 text-slate-500 hover:bg-card hover:text-slate-200" type="button" onClick={() => setCollapsed(false)} aria-label="Expand sidebar" title="Expand sidebar"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>}
      <nav className={`min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6 ${collapsed ? 'mt-2' : ''}`} aria-label="Primary navigation">
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-primary/15 text-blue-300' : 'text-slate-400 hover:bg-card hover:text-slate-100'} ${collapsed ? 'justify-center' : ''}`}
            end={end}
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && <div className="border-t border-border/70 px-6 py-5"><p className="text-xs uppercase tracking-[0.18em] text-slate-600">Environment</p><div className="mt-2 flex items-center gap-2 text-sm text-slate-400"><span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />Production plane</div></div>}
    </aside>
  )
}
