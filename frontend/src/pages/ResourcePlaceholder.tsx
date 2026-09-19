import { ArrowUpRight, Construction } from 'lucide-react'

interface ResourcePlaceholderProps {
  title: string
  description: string
}

export default function ResourcePlaceholder({ title, description }: ResourcePlaceholderProps) {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface text-primary"><Construction className="h-6 w-6" aria-hidden="true" /></div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Workspace module</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{title}</h1>
        <p className="mt-4 leading-7 text-slate-400">{description}</p>
        <a className="mt-7 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-primary hover:text-white" href="/dashboard">Return to dashboard <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
      </div>
    </section>
  )
}
