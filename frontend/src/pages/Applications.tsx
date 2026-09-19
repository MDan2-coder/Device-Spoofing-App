import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppWindow, Boxes, CalendarDays, ChevronRight, MoreVertical, Package, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import apiClient from '../api/client'
import CreateGroupModal from '../components/applications/CreateGroupModal'
import GroupDetailDrawer from '../components/applications/GroupDetailDrawer'
import RegisterAppModal from '../components/applications/RegisterAppModal'
import type { AppGroup, Application } from '../types/application'

type Tab = 'inventory' | 'groups'

export default function Applications() {
  const [tab, setTab] = useState<Tab>('inventory')
  const [applications, setApplications] = useState<Application[]>([])
  const [groups, setGroups] = useState<AppGroup[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<AppGroup | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [applicationsResponse, groupsResponse] = await Promise.all([apiClient.get<Application[]>('/applications/apps'), apiClient.get<AppGroup[]>('/applications/groups')])
      setApplications(applicationsResponse.data)
      setGroups(groupsResponse.data)
      setSelectedGroup((current) => current ? groupsResponse.data.find((group) => group.id === current.id) ?? null : null)
    } catch {
      setError('Application inventory could not be loaded. Check the API connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const filteredApplications = useMemo(() => applications.filter((application) => `${application.app_name} ${application.package_name}`.toLowerCase().includes(search.toLowerCase().trim())), [applications, search])
  const filteredGroups = useMemo(() => groups.filter((group) => `${group.name} ${group.description ?? ''}`.toLowerCase().includes(search.toLowerCase().trim())), [groups, search])

  const registerApplication = (application: Application) => setApplications((current) => [...current.filter((item) => item.id !== application.id), application].sort((left, right) => left.package_name.localeCompare(right.package_name)))
  const createGroup = (group: AppGroup) => setGroups((current) => [group, ...current])
  const updateGroup = (group: AppGroup) => { setGroups((current) => current.map((item) => item.id === group.id ? group : item)); setSelectedGroup(group) }
  const deleteGroup = async (groupId: string) => { setGroups((current) => current.filter((group) => group.id !== groupId)); setSelectedGroup(null) }
  const deleteGroupFromCard = async (group: AppGroup) => { if (!window.confirm(`Delete group ${group.name}?`)) return; try { await apiClient.delete(`/applications/groups/${group.id}`); await deleteGroup(group.id) } catch { setError('The group could not be deleted.') } }

  return <section onClick={() => setMenuId(null)}><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Application control plane</p><h1 className="text-3xl font-semibold tracking-tight text-slate-50">Applications & Bundles</h1><p className="mt-3 text-slate-400">Register packages, compose logical bundles, and control runtime exclusions.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500" type="button" onClick={() => tab === 'inventory' ? setRegisterOpen(true) : setCreateGroupOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />{tab === 'inventory' ? 'Register App' : 'Create Group'}</button></div>
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-3 lg:flex-row lg:items-center"><div className="flex rounded-lg bg-bg p-1"><button className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === 'inventory' ? 'bg-card text-slate-100 shadow' : 'text-slate-500 hover:text-slate-200'}`} type="button" onClick={() => setTab('inventory')}><Package className="mr-2 inline h-4 w-4" aria-hidden="true" />Application Inventory</button><button className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === 'groups' ? 'bg-card text-slate-100 shadow' : 'text-slate-500 hover:text-slate-200'}`} type="button" onClick={() => setTab('groups')}><Boxes className="mr-2 inline h-4 w-4" aria-hidden="true" />Application Groups / Bundles</button></div><label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-600" aria-hidden="true" /><input className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-primary sm:w-72" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === 'inventory' ? 'Search apps or packages' : 'Search groups'} aria-label="Search applications" /></label></div>
    {error && <div className="mb-6 flex items-center justify-between rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}<button className="inline-flex items-center gap-2 font-semibold" type="button" onClick={() => void loadData()}>Retry <RefreshCw className="h-4 w-4" aria-hidden="true" /></button></div>}
    {isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" key={index} />)}</div> : tab === 'inventory' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredApplications.map((application) => <article className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/60" key={application.id}><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary"><AppWindow className="h-5 w-5" aria-hidden="true" /></span><span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Catalogued</span></div><h2 className="mt-5 truncate font-semibold text-slate-100" title={application.app_name}>{application.app_name}</h2><p className="mt-1 truncate font-mono text-xs text-slate-500" title={application.package_name}>{application.package_name}</p><div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-slate-500"><span>{application.version ? `v${application.version}` : 'Version unknown'}</span><span>{application.version_code ?? '—'}</span></div></article>)}{filteredApplications.length === 0 && <EmptyState label="No applications found" detail="Register an APK package to begin building application bundles." onClick={() => setRegisterOpen(true)} action="Register App" />}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredGroups.map((group) => <article className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/60" key={group.id}><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><Boxes className="h-5 w-5" aria-hidden="true" /></span><div className="relative"><button className="rounded-lg p-2 text-slate-500 hover:bg-card hover:text-slate-100" type="button" aria-label={`Actions for ${group.name}`} onClick={(event) => { event.stopPropagation(); setMenuId(menuId === group.id ? null : group.id) }}><MoreVertical className="h-4 w-4" aria-hidden="true" /></button>{menuId === group.id && <div className="absolute right-0 top-10 z-10 w-40 rounded-lg border border-border bg-card p-1 shadow-xl" onClick={(event) => event.stopPropagation()}><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-surface" type="button" onClick={() => void deleteGroupFromCard(group)}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete group</button></div>}</div></div><h2 className="mt-5 truncate font-semibold text-slate-100">{group.name}</h2><p className="mt-1 min-h-10 text-sm text-slate-500">{group.description || 'No description provided.'}</p><div className="mt-5 grid grid-cols-2 gap-2 border-y border-border/70 py-4 text-center"><div><p className="text-lg font-semibold text-slate-100">{group.applications.length}</p><p className="text-xs text-slate-600">Members</p></div><div><p className="text-lg font-semibold text-accent">{group.resolved_package_names.length}</p><p className="text-xs text-slate-600">Runtime apps</p></div></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-slate-300 hover:border-primary hover:text-white" type="button" onClick={() => setSelectedGroup(group)}>Manage Rules <ChevronRight className="h-4 w-4" aria-hidden="true" /></button></article>)}{filteredGroups.length === 0 && <EmptyState label="No application groups found" detail="Create a bundle to manage logical inclusion and exclusion rules." onClick={() => setCreateGroupOpen(true)} action="Create Group" />}</div>}
    <RegisterAppModal open={registerOpen} onClose={() => setRegisterOpen(false)} onRegistered={registerApplication} /><CreateGroupModal open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} onCreated={createGroup} /><GroupDetailDrawer group={selectedGroup} applications={applications} onClose={() => setSelectedGroup(null)} onChanged={updateGroup} onDeleted={deleteGroup} />
  </section>
}

function EmptyState({ label, detail, action, onClick }: { label: string; detail: string; action: string; onClick: () => void }) {
  return <div className="col-span-full rounded-xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" /><h2 className="mt-4 font-semibold text-slate-200">{label}</h2><p className="mt-2 text-sm text-slate-500">{detail}</p><button className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500" type="button" onClick={onClick}>{action}</button></div>
}
