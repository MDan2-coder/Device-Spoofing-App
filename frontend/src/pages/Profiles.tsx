import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArchiveRestore, Copy, Edit3, FolderOpen, MoreVertical, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import ProfileSettingsModal from '../components/profiles/ProfileSettingsModal'
import type { DeviceProfile, ProfileCategory } from '../types/profile'

function normalizeProfile(profile: DeviceProfile): DeviceProfile {
  const location = profile.settings?.location ?? {}
  const stealthRules = profile.settings?.stealth_rules ?? {}
  return {
    ...profile,
    settings: {
      identifiers: profile.settings?.identifiers ?? {},
      telephony: profile.settings?.telephony ?? {},
      network: profile.settings?.network ?? {},
      location: { ...location, mock_enabled: location.mock_enabled ?? false },
      stealth_rules: {
        ...stealthRules,
        hide_root: stealthRules.hide_root ?? false,
        hide_developer_options: stealthRules.hide_developer_options ?? false,
        hide_mock_locations: stealthRules.hide_mock_locations ?? false,
        cloak_vpn: stealthRules.cloak_vpn ?? false,
      },
    },
  }
}

export default function Profiles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const trashMode = searchParams.get('trash') === 'true'
  const [profiles, setProfiles] = useState<DeviceProfile[]>([])
  const [categories, setCategories] = useState<ProfileCategory[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<DeviceProfile | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [profilesResponse, categoriesResponse] = await Promise.all([apiClient.get<DeviceProfile[]>('/profiles/', { params: { trash: trashMode } }), apiClient.get<ProfileCategory[]>('/categories/')])
      setProfiles(profilesResponse.data.map(normalizeProfile))
      setCategories(categoriesResponse.data)
    } catch { setError('Profiles could not be loaded. Check the API connection and try again.') } finally { setIsLoading(false) }
  }, [trashMode])

  useEffect(() => { void loadData() }, [loadData])

  const visibleProfiles = useMemo(() => profiles.filter((profile) => {
    const matchesSearch = profile.name.toLowerCase().includes(search.toLowerCase().trim())
    const matchesCategory = categoryFilter === 'all' || profile.category_id === categoryFilter
    return matchesSearch && matchesCategory
  }), [categoryFilter, profiles, search])

  const openCreate = () => { setEditingProfile(null); setModalOpen(true) }
  const openEdit = (profile: DeviceProfile) => { setEditingProfile(profile); setModalOpen(true); setMenuId(null) }
  const onSaved = () => { setModalOpen(false); setEditingProfile(null); void loadData() }

  const runAction = async (profile: DeviceProfile, action: 'clone' | 'trash' | 'restore' | 'permanent') => {
    setMenuId(null)
    if (action === 'permanent' && !window.confirm(`Permanently delete ${profile.name}? This cannot be undone.`)) return
    try {
      if (action === 'clone') await apiClient.post(`/profiles/${profile.id}/clone`)
      if (action === 'trash') await apiClient.delete(`/profiles/${profile.id}`)
      if (action === 'restore') await apiClient.post(`/profiles/${profile.id}/restore`)
      if (action === 'permanent') await apiClient.delete(`/profiles/${profile.id}/permanent`)
      await loadData()
    } catch { setError('That profile action could not be completed. Please try again.') }
  }

  return <section onClick={() => setMenuId(null)}><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Configuration workspace</p><h1 className="text-3xl font-semibold tracking-tight text-slate-50">{trashMode ? 'Recycle Bin' : 'Device Profiles'}</h1><p className="mt-3 text-slate-400">Build and manage deep device configurations from one studio.</p></div>{!trashMode && <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500" type="button" onClick={openCreate}><Plus className="h-4 w-4" aria-hidden="true" />Create Profile</button>}</div>
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex rounded-lg bg-bg p-1"><button className={`rounded-md px-4 py-2 text-sm font-medium transition ${!trashMode ? 'bg-card text-slate-100 shadow' : 'text-slate-500 hover:text-slate-200'}`} type="button" onClick={() => setSearchParams({})}>Active Profiles</button><button className={`rounded-md px-4 py-2 text-sm font-medium transition ${trashMode ? 'bg-card text-slate-100 shadow' : 'text-slate-500 hover:text-slate-200'}`} type="button" onClick={() => setSearchParams({ trash: 'true' })}><Trash2 className="mr-2 inline h-4 w-4" aria-hidden="true" />Recycle Bin</button></div><div className="flex flex-col gap-3 sm:flex-row"><label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-600" aria-hidden="true" /><input className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary sm:w-56" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles" aria-label="Search profiles" /></label><select className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-slate-300 outline-none focus:border-primary" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></div></div>
    {error && <div className="mb-6 flex items-center justify-between rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}<button className="inline-flex items-center gap-2 font-semibold" type="button" onClick={() => void loadData()}>Retry <RefreshCw className="h-4 w-4" aria-hidden="true" /></button></div>}
    {isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-52 animate-pulse rounded-xl border border-border bg-surface" key={index} />)}</div> : visibleProfiles.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center"><FolderOpen className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" /><h2 className="mt-4 font-semibold text-slate-200">{search || categoryFilter !== 'all' ? 'No matching profiles' : trashMode ? 'Recycle bin is empty' : 'No profiles yet'}</h2><p className="mt-2 text-sm text-slate-500">{trashMode ? 'Deleted profiles will appear here until permanently removed.' : 'Create your first profile to start shaping a device configuration.'}</p>{!trashMode && !search && categoryFilter === 'all' && <button className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" type="button" onClick={openCreate}>Create Profile</button>}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProfiles.map((profile) => { const category = categories.find((item) => item.id === profile.category_id); return <article className="group relative rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/60" key={profile.id}><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary"><FolderOpen className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0"><h2 className="truncate font-semibold text-slate-100">{profile.name}</h2><p className="mt-1 truncate text-xs text-slate-500">Updated {new Date(profile.updated_at).toLocaleDateString()}</p></div></div><div className="relative"><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === profile.id ? null : profile.id) }} aria-label={`Actions for ${profile.name}`}><MoreVertical className="h-4 w-4" aria-hidden="true" /></button>{menuId === profile.id && <div className="absolute right-0 top-10 z-10 w-48 rounded-lg border border-border bg-card p-1 shadow-xl" onClick={(event) => event.stopPropagation()}>{!trashMode ? <><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-surface" type="button" onClick={() => openEdit(profile)}><Edit3 className="h-4 w-4" aria-hidden="true" />Edit Settings</button><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-surface" type="button" onClick={() => void runAction(profile, 'clone')}><Copy className="h-4 w-4" aria-hidden="true" />Clone Profile</button><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-surface" type="button" onClick={() => void runAction(profile, 'trash')}><Trash2 className="h-4 w-4" aria-hidden="true" />Move to Trash</button></> : <><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-accent hover:bg-surface" type="button" onClick={() => void runAction(profile, 'restore')}><ArchiveRestore className="h-4 w-4" aria-hidden="true" />Restore</button><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-surface" type="button" onClick={() => void runAction(profile, 'permanent')}><Trash2 className="h-4 w-4" aria-hidden="true" />Permanent Delete</button></>}</div>}</div></div><div className="mt-6 flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${trashMode ? 'bg-red-400/10 text-red-300' : 'bg-accent/10 text-accent'}`}><span className={`h-1.5 w-1.5 rounded-full ${trashMode ? 'bg-red-400' : 'bg-accent'}`} aria-hidden="true" />{trashMode ? 'In trash' : 'Active'}</span>{category && <span className="rounded-full border border-border px-2.5 py-1 text-xs text-slate-400" style={{ borderColor: `${category.color}80`, color: category.color }}>{category.name}</span>}</div><p className="mt-4 min-h-10 text-sm leading-5 text-slate-400">{profile.description || 'No description provided.'}</p><div className="mt-5 flex items-center gap-4 border-t border-border/70 pt-4 text-xs text-slate-500"><span>{Object.keys(profile.settings.identifiers).length} identifiers</span><span>{profile.settings.stealth_rules.hide_root ? 'Root cloaked' : 'Standard root'}</span></div></article> })}</div>}
    <ProfileSettingsModal open={modalOpen} profile={editingProfile} categories={categories} onClose={() => setModalOpen(false)} onSaved={onSaved} />
  </section>
}
