import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawPropertyLead {
  id: string
  agent_id?: string
  user_id?: string
  name: string
  email: string | null
  phone: string | null
  status: string
  buyer_type: string | null
  source: string | null
  message: string | null
  created_at: string
  property_id: string | null
  properties?: { title: string; community: string | null } | null
}

interface RawDevelopmentLead {
  id: string
  agent_id?: string
  user_id?: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  stage: string
  form_type: string | null
  unit_type: string | null
  purpose: string | null
  budget_min: number | null
  budget_max: number | null
  created_at: string
  development_id: string | null
  developments?: { name: string; developer: string | null; handover: string | null } | null
}

interface UnifiedLead {
  id: string
  name: string
  email: string | null
  phone: string | null
  stage: string
  created_at: string
  leadType: 'listing' | 'development' | 'live_link'
  formType: 'teaser' | 'full_info'
  sourceName: string | null
  sourceDeveloper: string | null
  sourceHandover: string | null
  unitType: string | null
  purpose: string | null
  budgetMin: number | null
  budgetMax: number | null
  rawType: 'property' | 'development'
  rawId: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEV_STAGES = [
  { key: 'registered',        label: 'On priority list' },
  { key: 'brochure_requested', label: 'Brochure requested' },
  { key: 'pricing_shared',    label: 'Pricing shared' },
  { key: 'unit_selected',     label: 'Unit selected' },
  { key: 'eoi_submitted',     label: 'EOI submitted' },
  { key: 'booked',            label: 'Booking confirmed' },
]

const PROP_STAGE_MAP: Record<string, string> = {
  new: 'registered',
  contacted: 'brochure_requested',
  viewing: 'pricing_shared',
  offer: 'unit_selected',
  closed: 'eoi_submitted',
  cold: 'registered',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'Yesterday'
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stageCssClass(stage: string): string {
  return stage.replace(/_/g, '-')
}

function stageLabel(stage: string): string {
  return DEV_STAGES.find(s => s.key === stage)?.label ?? stage.replace(/_/g, ' ')
}

function formatBudget(min: number | null, max: number | null): string {
  function fmt(n: number) {
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(0)}M`
    if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`
    return `AED ${n}`
  }
  if (min && max) return `${fmt(min)}–${fmt(max)}`
  if (min) return `from ${fmt(min)}`
  if (max) return `up to ${fmt(max)}`
  return ''
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
.li-page { display: grid; grid-template-columns: 220px 1fr 420px; min-height: calc(100vh - 60px); }

/* SIDEBAR */
.li-sidebar { padding: 24px 16px; border-right: 1px solid var(--line-soft,#f0f2f4); background: #fff; position: sticky; top: 60px; height: calc(100vh - 60px); overflow-y: auto; }
.li-sidebar-eyebrow { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--quiet,#8b95a0); font-weight: 700; padding: 0 10px 6px; }
.li-nav-link { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 7px; font-size: 13px; color: var(--muted,#5a6470); text-decoration: none; font-weight: 500; cursor: pointer; transition: background .1s, color .1s; }
.li-nav-link:hover { background: var(--paper-warm,#fbfaf7); color: var(--ink,#0f1419); }
.li-nav-link.active { background: var(--ink,#0f1419); color: #fff; font-weight: 600; }
.li-nav-link svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2; fill: none; flex-shrink: 0; }
.li-nav-count { margin-left: auto; font-size: 11px; padding: 1px 7px; background: var(--line-soft,#f0f2f4); color: var(--muted,#5a6470); border-radius: 100px; font-weight: 600; }
.li-nav-link.active .li-nav-count { background: rgba(255,255,255,.18); color: #fff; }

/* MAIN */
.li-main { padding: 30px 32px 60px; overflow-y: auto; min-width: 0; }
.li-page-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
.li-page-title { font-size: 28px; font-weight: 700; color: var(--ink,#0f1419); letter-spacing: -.025em; line-height: 1.15; }
.li-page-sub { font-size: 13.5px; color: var(--muted,#5a6470); margin-bottom: 24px; }

/* TYPE TABS */
.li-type-tabs { display: flex; border-bottom: 1px solid var(--line-soft,#f0f2f4); margin-bottom: 22px; }
.li-type-tab { padding: 12px 18px; font-size: 13.5px; font-weight: 600; color: var(--muted,#5a6470); border: none; background: transparent; cursor: pointer; font-family: inherit; border-bottom: 2px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 8px; transition: color .1s; }
.li-type-tab:hover { color: var(--ink,#0f1419); }
.li-type-tab.active { color: var(--ink,#0f1419); border-bottom-color: var(--accent,#2d5a4f); }
.li-type-tab-count { font-size: 11px; padding: 2px 7px; background: var(--paper-warm,#fbfaf7); color: var(--muted,#5a6470); border-radius: 100px; font-weight: 700; }
.li-type-tab.active .li-type-tab-count { background: var(--accent,#2d5a4f); color: #fff; }

/* FILTERS */
.li-filters { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; padding: 12px 16px; background: #fff; border: 1px solid var(--line-soft,#f0f2f4); border-radius: 10px; }
.li-search-wrap { flex: 1; position: relative; }
.li-search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid var(--line-soft,#f0f2f4); border-radius: 7px; font-size: 13px; font-family: inherit; background: var(--paper-warm,#fbfaf7); outline: none; transition: border-color .1s, background .1s; }
.li-search-input:focus { border-color: var(--accent,#2d5a4f); background: #fff; }
.li-search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; stroke: var(--quiet,#8b95a0); fill: none; stroke-width: 2; }
.li-filter-pill { padding: 7px 12px; border: 1px solid var(--line,#e6e8eb); border-radius: 7px; font-size: 12.5px; font-weight: 500; color: var(--ink-soft,#2c343d); background: #fff; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; transition: border-color .1s; white-space: nowrap; }
.li-filter-pill:hover { border-color: var(--ink,#0f1419); }
.li-filter-pill select { border: none; background: transparent; font-family: inherit; font-size: 12.5px; color: var(--ink-soft,#2c343d); cursor: pointer; outline: none; }

/* LEAD LIST */
.li-section { margin-bottom: 28px; }
.li-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
.li-section-title { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--accent,#2d5a4f); font-weight: 700; }
.li-section-aux { font-size: 11.5px; color: var(--muted,#5a6470); }

.li-lead-row { background: #fff; border: 1px solid var(--line-soft,#f0f2f4); border-radius: 10px; padding: 14px 18px; margin-bottom: 6px; display: grid; grid-template-columns: 36px 1fr auto auto; gap: 14px; align-items: center; cursor: pointer; transition: border-color .12s, transform .12s, background .12s; }
.li-lead-row:hover { border-color: var(--accent,#2d5a4f); transform: translateX(2px); }
.li-lead-row.selected { border-color: var(--accent,#2d5a4f); background: var(--accent-soft,#e8f0ed); }

.li-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.li-avatar.teaser { background: linear-gradient(135deg, #8b6f3a, #a88458); }
.li-avatar.full_info { background: linear-gradient(135deg, var(--accent,#2d5a4f), #234a40); }
.li-avatar.listing { background: linear-gradient(135deg, #4a6fa5, #6585b8); }

.li-lead-info { min-width: 0; }
.li-lead-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.li-lead-name { font-size: 13.5px; font-weight: 600; color: var(--ink,#0f1419); letter-spacing: -.005em; }
.li-lead-tag { font-size: 9.5px; padding: 2px 7px; border-radius: 4px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; flex-shrink: 0; }
.li-lead-tag.teaser { background: var(--highlight,#f6f1e8); color: var(--highlight-text,#8b6f3a); }
.li-lead-tag.full_info { background: var(--accent-soft,#e8f0ed); color: var(--accent,#2d5a4f); }
.li-lead-tag.listing { background: var(--share-soft,#eaeff7); color: var(--share,#4a6fa5); }
.li-lead-meta { font-size: 12px; color: var(--muted,#5a6470); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.li-lead-meta strong { color: var(--ink,#0f1419); font-weight: 600; }
.li-meta-sep { color: var(--quiet,#8b95a0); margin: 0 5px; }

.li-stage { padding: 4px 10px; border-radius: 100px; font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; white-space: nowrap; }
.li-stage.registered { background: var(--highlight,#f6f1e8); color: var(--highlight-text,#8b6f3a); }
.li-stage.brochure-requested { background: var(--accent-soft,#e8f0ed); color: var(--accent,#2d5a4f); }
.li-stage.pricing-shared { background: var(--share-soft,#eaeff7); color: var(--share,#4a6fa5); }
.li-stage.unit-selected { background: #fef3e8; color: var(--signal,#c2603a); }
.li-stage.eoi-submitted { background: var(--accent,#2d5a4f); color: #fff; }
.li-stage.booked { background: var(--ink,#0f1419); color: #fff; }

.li-lead-time { font-size: 11px; color: var(--quiet,#8b95a0); white-space: nowrap; }

/* DETAIL PANEL */
.li-detail { padding: 30px 24px 40px; background: var(--paper-warm,#fbfaf7); border-left: 1px solid var(--line-soft,#f0f2f4); overflow-y: auto; position: sticky; top: 60px; height: calc(100vh - 60px); }

.li-detail-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 18px; border-bottom: 1px solid var(--line-soft,#f0f2f4); }
.li-detail-avatar { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; font-weight: 700; flex-shrink: 0; }
.li-detail-avatar.teaser { background: linear-gradient(135deg, #8b6f3a, #a88458); }
.li-detail-avatar.full_info { background: linear-gradient(135deg, var(--accent,#2d5a4f), #234a40); }
.li-detail-avatar.listing { background: linear-gradient(135deg, #4a6fa5, #6585b8); }
.li-detail-name { font-size: 18px; font-weight: 700; color: var(--ink,#0f1419); letter-spacing: -.015em; line-height: 1.3; margin-bottom: 4px; }
.li-detail-meta { font-size: 12px; color: var(--muted,#5a6470); }
.li-detail-meta strong { color: var(--ink,#0f1419); font-weight: 600; }

.li-detail-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 22px; }
.li-detail-action { padding: 10px; border-radius: 9px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background .12s, border-color .12s; }
.li-detail-action svg { width: 12px; height: 12px; stroke: currentColor; stroke-width: 2; fill: none; }
.li-detail-action.primary { background: var(--accent,#2d5a4f); color: #fff; border: none; }
.li-detail-action.primary:hover { background: var(--accent-hover,#234a40); }
.li-detail-action.outline { background: #fff; color: var(--ink,#0f1419); border: 1px solid var(--line,#e6e8eb); }
.li-detail-action.outline:hover { border-color: var(--ink,#0f1419); }

.li-detail-section { margin-bottom: 22px; }
.li-detail-section-title { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--quiet,#8b95a0); font-weight: 700; margin-bottom: 10px; }

.li-source-card { padding: 12px 14px; background: #fff; border: 1px solid var(--line-soft,#f0f2f4); border-radius: 9px; display: flex; align-items: center; gap: 10px; }
.li-source-thumb { width: 44px; height: 44px; border-radius: 7px; flex-shrink: 0; }
.li-source-thumb.teaser { background: linear-gradient(135deg, #0a0e13 0%, #14201d 50%, var(--accent,#2d5a4f) 100%); }
.li-source-thumb.full_info { background: linear-gradient(135deg, #c4ad8a 0%, #8b7456 60%, #6b5530 100%); }
.li-source-thumb.listing { background: linear-gradient(135deg, #4a6fa5, #6585b8); }
.li-source-tag { font-size: 9px; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
.li-source-tag.teaser { color: var(--highlight-text,#8b6f3a); }
.li-source-tag.full_info { color: var(--accent,#2d5a4f); }
.li-source-tag.listing { color: var(--share,#4a6fa5); }
.li-source-name { font-size: 13px; font-weight: 600; color: var(--ink,#0f1419); line-height: 1.3; margin-bottom: 2px; }
.li-source-meta { font-size: 11px; color: var(--muted,#5a6470); }

.li-fact { display: grid; grid-template-columns: 110px 1fr; gap: 10px; padding: 7px 0; font-size: 12.5px; align-items: start; }
.li-fact-label { color: var(--muted,#5a6470); font-weight: 500; }
.li-fact-value { color: var(--ink,#0f1419); font-weight: 600; }
.li-fact-value a { color: var(--accent,#2d5a4f); text-decoration: none; }
.li-fact-value a:hover { text-decoration: underline; }

/* TIMELINE */
.li-timeline { display: flex; flex-direction: column; }
.li-tl-item { display: grid; grid-template-columns: 16px 1fr; gap: 10px; padding: 8px 0; align-items: flex-start; position: relative; cursor: pointer; }
.li-tl-item:not(:last-child)::before { content: ''; position: absolute; left: 7px; top: 22px; bottom: -4px; width: 2px; background: var(--line,#e6e8eb); }
.li-tl-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--paper-warm,#fbfaf7); border: 2px solid var(--line,#e6e8eb); flex-shrink: 0; margin-top: 3px; position: relative; z-index: 1; transition: border-color .15s, background .15s; }
.li-tl-item:hover .li-tl-dot { border-color: var(--accent,#2d5a4f); }
.li-tl-dot.done { background: #3d8a76; border-color: #3d8a76; }
.li-tl-dot.done::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background: #fff; border-radius: 50%; }
.li-tl-dot.current { background: var(--accent,#2d5a4f); border-color: var(--accent,#2d5a4f); animation: li-pulse 2s infinite; }
@keyframes li-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(45,90,79,.5); } 50% { box-shadow: 0 0 0 6px rgba(45,90,79,0); } }
.li-tl-title { font-size: 12.5px; font-weight: 600; color: var(--ink,#0f1419); line-height: 1.35; }
.li-tl-time { font-size: 11px; color: var(--muted,#5a6470); margin-top: 1px; }
.li-tl-item:hover .li-tl-title { color: var(--accent,#2d5a4f); }

/* EMPTY STATE */
.li-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 12px; color: var(--muted,#5a6470); }
.li-empty svg { width: 40px; height: 40px; stroke: var(--quiet,#8b95a0); stroke-width: 1.5; fill: none; }
.li-empty-title { font-size: 15px; font-weight: 600; color: var(--ink,#0f1419); }
.li-empty-sub { font-size: 13px; color: var(--muted,#5a6470); text-align: center; max-width: 240px; }

/* LOADING */
.li-loading { display: flex; align-items: center; justify-content: center; height: 200px; }
.li-spinner { width: 28px; height: 28px; border: 2.5px solid var(--line,#e6e8eb); border-top-color: var(--accent,#2d5a4f); border-radius: 50%; animation: li-spin .7s linear infinite; }
@keyframes li-spin { to { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width: 1180px) {
  .li-page { grid-template-columns: 220px 1fr; }
  .li-detail { display: none; }
}
@media (max-width: 820px) {
  .li-page { grid-template-columns: 1fr; }
  .li-sidebar { display: none; }
  .li-main { padding: 22px 16px 48px; }
  .li-lead-row { grid-template-columns: 36px 1fr; gap: 10px; }
  .li-stage, .li-lead-time { grid-column: 2; justify-self: start; margin-top: 4px; }
}
`

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({
  to, label, icon, count, active,
}: { to: string; label: string; icon: React.ReactNode; count?: number; active?: boolean }) {
  const navigate = useNavigate()
  return (
    <a
      className={`li-nav-link${active ? ' active' : ''}`}
      onClick={() => navigate(to)}
      style={{ cursor: 'pointer' }}
    >
      {icon}
      {label}
      {count !== undefined && <span className="li-nav-count">{count}</span>}
    </a>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Leads() {
  const { user } = useAuth()

  const [propertyLeads, setPropertyLeads] = useState<RawPropertyLead[]>([])
  const [devLeads, setDevLeads] = useState<RawDevelopmentLead[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'all' | 'listings' | 'developments' | 'live_links'>('all')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [devFilter, setDevFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Counts for nav
  const [propCount, setPropCount] = useState(0)
  const [devCount, setDevCount] = useState(0)

  // Fetch
  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: pl }, { data: dl }, { data: props }, { data: devs }] = await Promise.all([
      supabase
        .from('leads')
        .select('*, properties(title, community)')
        .or(`agent_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('development_leads')
        .select('*, developments(name, developer, handover)')
        .or(`agent_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase.from('properties').select('id', { count: 'exact', head: true }).or(`agent_id.eq.${user.id},user_id.eq.${user.id}`),
      supabase.from('developments').select('id', { count: 'exact', head: true }).or(`agent_id.eq.${user.id},user_id.eq.${user.id}`),
    ])

    setPropertyLeads((pl as RawPropertyLead[]) ?? [])
    setDevLeads((dl as RawDevelopmentLead[]) ?? [])
    setPropCount(props?.length ?? 0)
    setDevCount(devs?.length ?? 0)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Merge into unified list
  const unified = useMemo<UnifiedLead[]>(() => {
    const pl: UnifiedLead[] = (propertyLeads ?? []).map(l => ({
      id: `p_${l.id}`,
      name: l.name,
      email: l.email,
      phone: l.phone,
      stage: PROP_STAGE_MAP[l.status] ?? 'registered',
      created_at: l.created_at,
      leadType: 'listing',
      formType: 'full_info',
      sourceName: l.properties?.title ?? null,
      sourceDeveloper: null,
      sourceHandover: null,
      unitType: l.buyer_type,
      purpose: null,
      budgetMin: null,
      budgetMax: null,
      rawType: 'property',
      rawId: l.id,
    }))

    const dl: UnifiedLead[] = (devLeads ?? []).map(l => ({
      id: `d_${l.id}`,
      name: l.name,
      email: l.email,
      phone: l.phone ?? l.whatsapp,
      stage: l.stage ?? 'registered',
      created_at: l.created_at,
      leadType: 'development',
      formType: (l.form_type === 'teaser' ? 'teaser' : 'full_info') as 'teaser' | 'full_info',
      sourceName: (l.developments as any)?.name ?? null,
      sourceDeveloper: (l.developments as any)?.developer ?? null,
      sourceHandover: (l.developments as any)?.handover ?? null,
      unitType: l.unit_type,
      purpose: l.purpose,
      budgetMin: l.budget_min,
      budgetMax: l.budget_max,
      rawType: 'development',
      rawId: l.id,
    }))

    return [...pl, ...dl].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [propertyLeads, devLeads])

  // Unique dev names for filter
  const devNames = useMemo(() => {
    const names = unified.filter(l => l.leadType === 'development' && l.sourceName).map(l => l.sourceName!)
    return [...new Set(names)]
  }, [unified])

  // Filter
  const filtered = useMemo(() => {
    return unified.filter(l => {
      if (activeTab === 'listings' && l.leadType !== 'listing') return false
      if (activeTab === 'developments' && l.leadType !== 'development') return false
      if (activeTab === 'live_links' && l.leadType !== 'live_link') return false
      if (stageFilter && l.stage !== stageFilter) return false
      if (devFilter && l.sourceName !== devFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !l.name.toLowerCase().includes(q) &&
          !(l.email ?? '').toLowerCase().includes(q) &&
          !(l.sourceName ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [unified, activeTab, stageFilter, devFilter, search])

  // Group by day
  const groups = useMemo(() => {
    const map = new Map<string, UnifiedLead[]>()
    for (const lead of filtered) {
      const label = dayLabel(lead.created_at)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(lead)
    }
    return [...map.entries()]
  }, [filtered])

  // Counts
  const counts = useMemo(() => ({
    all: unified.length,
    listings: unified.filter(l => l.leadType === 'listing').length,
    developments: unified.filter(l => l.leadType === 'development').length,
    live_links: unified.filter(l => l.leadType === 'live_link').length,
  }), [unified])

  // Selected lead
  const selected = useMemo(() => unified.find(l => l.id === selectedId) ?? null, [unified, selectedId])

  // Stage index
  const DEV_STAGE_KEYS = DEV_STAGES.map(s => s.key)

  async function advanceStage(lead: UnifiedLead, stageKey: string) {
    if (lead.rawType === 'development') {
      await supabase.from('development_leads').update({ stage: stageKey }).eq('id', lead.rawId)
      setDevLeads(prev => prev.map(l => l.id === lead.rawId ? { ...l, stage: stageKey } : l))
    } else {
      const reverseMap: Record<string, string> = {
        registered: 'new',
        brochure_requested: 'contacted',
        pricing_shared: 'viewing',
        unit_selected: 'offer',
        eoi_submitted: 'closed',
      }
      const status = reverseMap[stageKey] ?? 'new'
      await supabase.from('leads').update({ status }).eq('id', lead.rawId)
      setPropertyLeads(prev => prev.map(l => l.id === lead.rawId ? { ...l, status } : l))
    }
  }

  // ── Render ──
  return (
    <>
      <style>{CSS}</style>
      <div className="li-page">

        {/* SIDEBAR */}
        <aside className="li-sidebar">
          <div className="li-sidebar-eyebrow">Workspace</div>
          <NavLink to="/dashboard" label="Dashboard" active={false} icon={
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          } />
          <NavLink to="/properties" label="Listings" count={propCount} active={false} icon={
            <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/></svg>
          } />
          <NavLink to="/developments" label="Developments" count={devCount} active={false} icon={
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          } />
          <NavLink to="/leads" label="Leads" count={unified.length} active={true} icon={
            <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
          } />
          <NavLink to="/portfolio/edit" label="Live Links" active={false} icon={
            <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          } />
          <NavLink to="/settings" label="Settings" active={false} icon={
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6h.09A1.65 1.65 0 0011 3.09V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          } />
        </aside>

        {/* MAIN */}
        <main className="li-main">
          <div className="li-page-head">
            <h1 className="li-page-title">Leads</h1>
          </div>
          <p className="li-page-sub">{unified.length} active leads across listings and developments. Sorted by recency.</p>

          {/* Type tabs */}
          <div className="li-type-tabs">
            {([
              { key: 'all', label: 'All' },
              { key: 'listings', label: 'Listings' },
              { key: 'developments', label: 'Developments' },
              { key: 'live_links', label: 'Live Links' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                className={`li-type-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="li-type-tab-count">{counts[tab.key]}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="li-filters">
            <div className="li-search-wrap">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input
                className="li-search-input"
                placeholder="Search by name, email, or development..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="li-filter-pill">
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                <option value="">All stages</option>
                {DEV_STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            {devNames.length > 0 && (
              <div className="li-filter-pill">
                <select value={devFilter} onChange={e => setDevFilter(e.target.value)}>
                  <option value="">All developments</option>
                  {devNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Lead list */}
          {loading ? (
            <div className="li-loading"><div className="li-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="li-empty">
              <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
              <div className="li-empty-title">No leads yet</div>
              <p className="li-empty-sub">Leads from your pages will appear here once they come in.</p>
            </div>
          ) : (
            groups.map(([dayLbl, leads]) => (
              <div key={dayLbl} className="li-section">
                <div className="li-section-head">
                  <div className="li-section-title">{dayLbl} · {leads.length} new</div>
                </div>
                {leads.map(lead => {
                  const isSelected = lead.id === selectedId
                  const avatarClass = lead.leadType === 'listing' ? 'listing' : lead.formType
                  const tagLabel = lead.leadType === 'listing' ? 'Listing' : lead.formType === 'teaser' ? 'Teaser' : 'Full Info'
                  const tagClass = lead.leadType === 'listing' ? 'listing' : lead.formType
                  return (
                    <div
                      key={lead.id}
                      className={`li-lead-row${isSelected ? ' selected' : ''}`}
                      onClick={() => setSelectedId(isSelected ? null : lead.id)}
                    >
                      <div className={`li-avatar ${avatarClass}`}>{getInitials(lead.name)}</div>
                      <div className="li-lead-info">
                        <div className="li-lead-name-row">
                          <div className="li-lead-name">{lead.name}</div>
                          <span className={`li-lead-tag ${tagClass}`}>{tagLabel}</span>
                        </div>
                        <div className="li-lead-meta">
                          {lead.sourceName && <><strong>{lead.sourceName}</strong><span className="li-meta-sep">·</span></>}
                          {lead.unitType && <>Interested in <strong>{lead.unitType}</strong><span className="li-meta-sep">·</span></>}
                          {lead.budgetMin || lead.budgetMax
                            ? <>{formatBudget(lead.budgetMin, lead.budgetMax)}<span className="li-meta-sep">·</span></>
                            : null}
                          {lead.purpose ?? ''}
                        </div>
                      </div>
                      <span className={`li-stage ${stageCssClass(lead.stage)}`}>{stageLabel(lead.stage)}</span>
                      <span className="li-lead-time">{timeAgo(lead.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </main>

        {/* DETAIL PANEL */}
        <aside className="li-detail">
          {!selected ? (
            <div className="li-empty">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>
              <div className="li-empty-title">Select a lead</div>
              <p className="li-empty-sub">Click any lead to view their details and manage their funnel stage.</p>
            </div>
          ) : (
            <DetailPanel
              lead={selected}
              stageKeys={DEV_STAGE_KEYS}
              onAdvanceStage={advanceStage}
            />
          )}
        </aside>

      </div>
    </>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  lead,
  stageKeys,
  onAdvanceStage,
}: {
  lead: UnifiedLead
  stageKeys: string[]
  onAdvanceStage: (lead: UnifiedLead, stage: string) => Promise<void>
}) {
  const currentIdx = stageKeys.indexOf(lead.stage)
  const avatarClass = lead.leadType === 'listing' ? 'listing' : lead.formType

  const whatsappNum = lead.phone?.replace(/[^0-9]/g, '')
  const tagLabel = lead.leadType === 'listing'
    ? 'Listing enquiry'
    : lead.formType === 'teaser' ? 'Teaser lead' : 'Full info lead'

  return (
    <>
      {/* Head */}
      <div className="li-detail-head">
        <div className={`li-detail-avatar ${avatarClass}`}>{getInitials(lead.name)}</div>
        <div>
          <div className="li-detail-name">{lead.name}</div>
          <div className="li-detail-meta">
            <strong>{tagLabel}</strong> · {timeAgo(lead.created_at)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="li-detail-actions">
        {whatsappNum ? (
          <a
            className="li-detail-action primary"
            href={`https://wa.me/${whatsappNum}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
            </svg>
            WhatsApp
          </a>
        ) : (
          <button className="li-detail-action primary" disabled>WhatsApp</button>
        )}
        {lead.phone ? (
          <a
            className="li-detail-action outline"
            href={`tel:${lead.phone}`}
            style={{ textDecoration: 'none' }}
          >
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/></svg>
            Call
          </a>
        ) : (
          <button className="li-detail-action outline" disabled>Call</button>
        )}
      </div>

      {/* Came from */}
      {lead.sourceName && (
        <div className="li-detail-section">
          <div className="li-detail-section-title">Came from</div>
          <div className="li-source-card">
            <div className={`li-source-thumb ${lead.formType}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={`li-source-tag ${lead.formType}`}>
                {lead.leadType === 'development' ? 'Off-plan' : 'Listing'}
                {' · '}{lead.formType === 'teaser' ? 'Teaser' : 'Full Info'}
              </div>
              <div className="li-source-name">{lead.sourceName}</div>
              {(lead.sourceDeveloper || lead.sourceHandover) && (
                <div className="li-source-meta">
                  {lead.sourceDeveloper && `By ${lead.sourceDeveloper}`}
                  {lead.sourceDeveloper && lead.sourceHandover && ' · '}
                  {lead.sourceHandover && `Handover ${lead.sourceHandover}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Captured details */}
      <div className="li-detail-section">
        <div className="li-detail-section-title">Captured details</div>
        {lead.email && (
          <div className="li-fact">
            <div className="li-fact-label">Email</div>
            <div className="li-fact-value"><a href={`mailto:${lead.email}`}>{lead.email}</a></div>
          </div>
        )}
        {lead.phone && (
          <div className="li-fact">
            <div className="li-fact-label">WhatsApp</div>
            <div className="li-fact-value">{lead.phone}</div>
          </div>
        )}
        {lead.unitType && (
          <div className="li-fact">
            <div className="li-fact-label">Interested in</div>
            <div className="li-fact-value">{lead.unitType}</div>
          </div>
        )}
        {(lead.budgetMin || lead.budgetMax) && (
          <div className="li-fact">
            <div className="li-fact-label">Budget</div>
            <div className="li-fact-value">{formatBudget(lead.budgetMin, lead.budgetMax)}</div>
          </div>
        )}
        {lead.purpose && (
          <div className="li-fact">
            <div className="li-fact-label">Purpose</div>
            <div className="li-fact-value">{lead.purpose}</div>
          </div>
        )}
      </div>

      {/* Funnel timeline */}
      <div className="li-detail-section">
        <div className="li-detail-section-title">Funnel stage</div>
        <div className="li-timeline">
          {DEV_STAGES.map((stage, i) => {
            const isDone = i < currentIdx
            const isCurrent = i === currentIdx
            const dotClass = isDone ? 'done' : isCurrent ? 'current' : ''
            return (
              <div
                key={stage.key}
                className="li-tl-item"
                onClick={() => onAdvanceStage(lead, stage.key)}
                title={`Mark as ${stage.label}`}
              >
                <div className={`li-tl-dot ${dotClass}`} />
                <div className="li-tl-content">
                  <div className="li-tl-title">{stage.label}</div>
                  {isCurrent && (
                    <div className="li-tl-time">Click to advance to next stage</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
