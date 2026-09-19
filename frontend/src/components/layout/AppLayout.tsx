import { useState } from 'react'
import { X } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg text-slate-100">
      <Sidebar />
      {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" aria-hidden="true" onClick={() => setMobileMenuOpen(false)} />}
      {mobileMenuOpen && <div className="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] flex-col overflow-hidden border-r border-border/80 bg-surface shadow-2xl shadow-black/50 lg:hidden"><Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} /><button className="absolute right-3 top-4 rounded-md bg-card p-2 text-slate-300 shadow-lg" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X className="h-4 w-4" aria-hidden="true" /></button></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
