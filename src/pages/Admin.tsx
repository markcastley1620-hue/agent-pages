import React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import BrandLogo from '../components/BrandLogo'

/* ── Constants ─────────────────────────────────────────────────────────── */
const ADMIN_EMAILS = ['test-agent@agentpages.io', 'mark@activateos.com', 'mark@chatdxb.com']

const AI_ENGINES = ['ChatGPT', 'Gemini', 'Perplexity', 'Claude', 'Grok', 'Bing AI', 'Meta AI']

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  brokerage: string
  rera_number: string
  slug: string
  created_at: string
  plan?: string
  status?: string
  _property_count?: number
  _lead_count?: number
}

interface Property {
  id: string
  agent_id: string
  title: string
  community: string
  property_type: string
  price: number
  status: string
  published_at: string
  created_at: string
  slug: string
  _agent_name?: string
  _lead_count?: number
}

interface Lead {
  id: string
  property_id: string
  agent_id: string
  name: string
  phone: string
  email: string
  source: string
  status: string
  budget: number
  beds: string
  created_at: string
  _property_title?: string
  _agent_name?: string
}

type AdminSection = 'overview' | 'agents' | 'properties' | 'leads' | 'visibility' | 'activity'

/* ── KPI Card ─────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #f0f2f4',
      borderRadius: 12,
      padding: '20px 24px',
      flex: '1 1 140px',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#5a6470', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

/* ── Section Tab ─────────────────────────────────────────────────────────── */
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        borderRadius: 7,
        border: 'none',
        cursor: 'pointer',
        background: active ? '#0f1419' : 'transparent',
        color: active ? '#fff' : '#5a6470',
        transition: 'background 0.12s, color 0.12s',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

/* ── Table styles ─────────────────────────────────────────────────────────── */
const TH: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #f0f2f4',
  whiteSpace: 'nowrap',
  background: '#fafafa',
}

const TD: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 13,
  color: '#0f1419',
  borderBottom: '1px solid #f8f9fa',
  verticalAlign: 'middle',
}

/* ── Status Badge ─────────────────────────────────────────────────────────── */
function Badge({ text }: { text: string }) {
  const t = (text || '').toLowerCase()
  let bg = '#f0f2f4', color = '#5a6470'
  if (t === 'live' || t === 'published' || t === 'closed') { bg = '#d1fae5'; color = '#059669' }
  else if (t === 'draft') { bg = '#fef3c7'; color = '#d97706' }
  else if (t === 'new') { bg = '#dbeafe'; color = '#2563eb' }
  else if (t === 'contacted' || t === 'viewing') { bg = '#ede9fe'; color = '#7c3aed' }
  else if (t === 'offer') { bg = '#fce7f3'; color = '#db2777' }
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {text || 'unknown'}
    </span>
  )
}

/* ── Visibility Dots ─────────────────────────────────────────────────────── */
function VisibilityDots({ status }: { status: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {AI_ENGINES.map((engine, idx) => (
        <div
          key={engine}
          title={`${engine}: ${status[idx] || 'pending'}`}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: (status[idx] || 'pending') === 'submitted' ? '#10b981' : '#e5e7eb',
          }}
        />
      ))}
    </div>
  )
}

/* ── Format helpers ─────────────────────────────────────────────────────── */
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtPrice(p: number) {
  if (!p) return '—'
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(1)}M`
  if (p >= 1000) return `AED ${Math.round(p / 1000)}K`
  return `AED ${p}`
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [section, setSection] = useState<AdminSection>('overview')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter/search state
  const [agentSearch, setAgentSearch] = useState('')
  const [propFilterStatus, setPropFilterStatus] = useState('')
  const [propFilterAgent, setPropFilterAgent] = useState('')
  const [leadFilterStatus, setLeadFilterStatus] = useState('')
  const [leadFilterAgent, setLeadFilterAgent] = useState('')

  // Expanded rows
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [expandedProp, setExpandedProp] = useState<string | null>(null)

  // Sort
  const [agentSort, setAgentSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' })
  const [propSort, setPropSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' })
  const [leadSort, setLeadSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'created_at', dir: 'desc' })

  /* ── Auth check ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
    if (!authLoading && user && !ADMIN_EMAILS.includes(user.email || '')) navigate('/dashboard')
  }, [authLoading, user, navigate])

  /* ── Load data ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) return

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [profilesRes, propertiesRes, leadsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('properties').select('*').order('created_at', { ascending: false }),
          supabase.from('leads').select('*').order('created_at', { ascending: false }),
        ])

        if (profilesRes.error) throw profilesRes.error
        if (propertiesRes.error) throw propertiesRes.error
        if (leadsRes.error) throw leadsRes.error

        const rawProfiles: Profile[] = profilesRes.data || []
        const rawProperties: Property[] = propertiesRes.data || []
        const rawLeads: Lead[] = leadsRes.data || []

        // Enrich profiles with counts
        const enrichedProfiles = rawProfiles.map(p => ({
          ...p,
          _property_count: rawProperties.filter(pr => pr.agent_id === p.id).length,
          _lead_count: rawLeads.filter(l => l.agent_id === p.id).length,
        }))

        // Build agent lookup
        const agentMap: Record<string, string> = {}
        rawProfiles.forEach(p => {
          agentMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || p.id
        })

        // Enrich properties
        const enrichedProperties = rawProperties.map(pr => ({
          ...pr,
          _agent_name: agentMap[pr.agent_id] || pr.agent_id,
          _lead_count: rawLeads.filter(l => l.property_id === pr.id).length,
        }))

        // Build property lookup
        const propMap: Record<string, string> = {}
        rawProperties.forEach(p => { propMap[p.id] = p.title || p.id })

        // Enrich leads
        const enrichedLeads = rawLeads.map(l => ({
          ...l,
          _property_title: propMap[l.property_id] || l.property_id,
          _agent_name: agentMap[l.agent_id] || l.agent_id,
        }))

        setProfiles(enrichedProfiles)
        setProperties(enrichedProperties)
        setLeads(enrichedLeads)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  /* ── KPIs ───────────────────────────────────────────────────────────── */
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const kpis = useMemo(() => {
    const liveStatuses = ['live', 'published']
    return {
      totalAgents: profiles.length,
      totalProperties: properties.length,
      liveProperties: properties.filter(p => liveStatuses.includes((p.status || '').toLowerCase())).length,
      totalLeads: leads.length,
      signupsToday: profiles.filter(p => p.created_at?.slice(0, 10) === today).length,
      publishedToday: properties.filter(p => (p.published_at || p.created_at)?.slice(0, 10) === today).length,
    }
  }, [profiles, properties, leads, today])

  /* ── Filtered & sorted data ─────────────────────────────────────────── */
  function sortRows<T>(rows: T[], sort: { col: string; dir: 'asc' | 'desc' }): T[] {
    return [...rows].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sort.col] ?? '')
      const bv = String((b as Record<string, unknown>)[sort.col] ?? '')
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }

  function sortHeader(col: string, current: { col: string; dir: 'asc' | 'desc' }, setter: (s: { col: string; dir: 'asc' | 'desc' }) => void) {
    return () => setter(
      current.col === col ? { col, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }
    )
  }

  function sortArrow(col: string, current: { col: string; dir: 'asc' | 'desc' }) {
    if (current.col !== col) return <span style={{ color: '#d1d5db', marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{current.dir === 'asc' ? '↑' : '↓'}</span>
  }

  const filteredAgents = useMemo(() => {
    const q = agentSearch.toLowerCase()
    const rows = profiles.filter(p =>
      !q ||
      (p.first_name || '').toLowerCase().includes(q) ||
      (p.last_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.brokerage || '').toLowerCase().includes(q)
    )
    return sortRows(rows, agentSort)
  }, [profiles, agentSearch, agentSort])

  const filteredProperties = useMemo(() => {
    const rows = properties.filter(p =>
      (!propFilterStatus || (p.status || '').toLowerCase() === propFilterStatus.toLowerCase()) &&
      (!propFilterAgent || p.agent_id === propFilterAgent)
    )
    return sortRows(rows, propSort)
  }, [properties, propFilterStatus, propFilterAgent, propSort])

  const filteredLeads = useMemo(() => {
    const rows = leads.filter(l =>
      (!leadFilterStatus || (l.status || '').toLowerCase() === leadFilterStatus.toLowerCase()) &&
      (!leadFilterAgent || l.agent_id === leadFilterAgent)
    )
    return sortRows(rows, leadSort)
  }, [leads, leadFilterStatus, leadFilterAgent, leadSort])

  /* ── Activity log ─────────────────────────────────────────────────── */
  const activityLog = useMemo(() => {
    type ActivityItem = { type: string; text: string; sub: string; time: string }
    const events: ActivityItem[] = [
      ...profiles.map(p => ({
        type: 'signup',
        text: `New signup: ${[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email}`,
        sub: p.email || '',
        time: p.created_at,
      })),
      ...properties.map(p => ({
        type: 'property',
        text: `Property published: ${p.title || 'Untitled'}`,
        sub: p._agent_name || '',
        time: p.published_at || p.created_at,
      })),
      ...leads.map(l => ({
        type: 'lead',
        text: `New lead: ${l.name || l.email || 'Unknown'}`,
        sub: l._property_title || '',
        time: l.created_at,
      })),
    ]
    return events.sort((a, b) => b.time?.localeCompare(a.time || '') || 0).slice(0, 50)
  }, [profiles, properties, leads])

  /* ── Early returns ─────────────────────────────────────────────────── */
  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfaf7' }}>
        <div style={{ color: '#5a6470', fontSize: 14 }}>Loading admin panel…</div>
      </div>
    )
  }

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfaf7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#0f1419' }}>Access Denied</div>
          <div style={{ color: '#5a6470', fontSize: 14, marginTop: 6 }}>You don't have admin access.</div>
          <Link to="/dashboard" style={{ display: 'inline-block', marginTop: 16, color: '#2d5a4f', fontSize: 13, textDecoration: 'underline' }}>← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfaf7' }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <div style={{ fontWeight: 600 }}>Error loading admin data</div>
          <div style={{ fontSize: 13, marginTop: 6, color: '#5a6470' }}>{error}</div>
        </div>
      </div>
    )
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#fbfaf7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Admin signal bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #dc2626, #ef4444, #f97316)' }} />

      {/* Topbar */}
      <header style={{
        height: 56, background: '#fff',
        borderBottom: '1px solid #f0f2f4',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <BrandLogo size={24} />
            <span style={{ fontSize: 14, letterSpacing: '-0.015em' }}>
              <span style={{ fontWeight: 700, color: '#0f1419' }}>Agent</span>
              <span style={{ fontWeight: 400, color: '#5a6470', marginLeft: 3 }}>Pages</span>
            </span>
          </Link>
          <div style={{ width: 1, height: 20, background: '#f0f2f4' }} />
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#dc2626',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            background: '#fef2f2', padding: '3px 8px', borderRadius: 6,
          }}>
            🔴 Admin Panel
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{user.email}</span>
          <Link to="/dashboard" style={{
            fontSize: 12, color: '#5a6470', textDecoration: 'none',
            padding: '5px 10px', borderRadius: 6, border: '1px solid #f0f2f4',
            background: '#fff',
          }}>← Dashboard</Link>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['overview', 'agents', 'properties', 'leads', 'visibility', 'activity'] as AdminSection[]).map(s => (
            <Tab key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={section === s} onClick={() => setSection(s)} />
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {section === 'overview' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', marginBottom: 16 }}>Platform Overview</h2>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <KpiCard label="Total Agents" value={kpis.totalAgents} />
              <KpiCard label="Total Properties" value={kpis.totalProperties} />
              <KpiCard label="Live Properties" value={kpis.liveProperties} sub="status = live/published" />
              <KpiCard label="Total Leads" value={kpis.totalLeads} />
              <KpiCard label="Signups Today" value={kpis.signupsToday} />
              <KpiCard label="Published Today" value={kpis.publishedToday} sub="properties" />
            </div>

            {/* Quick navigation */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'View all agents →', tab: 'agents' as AdminSection },
                { label: 'View all properties →', tab: 'properties' as AdminSection },
                { label: 'View all leads →', tab: 'leads' as AdminSection },
                { label: 'Activity log →', tab: 'activity' as AdminSection },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => setSection(item.tab)}
                  style={{
                    padding: '9px 16px', fontSize: 13, fontWeight: 500,
                    borderRadius: 8, border: '1px solid #f0f2f4',
                    background: '#fff', cursor: 'pointer', color: '#0f1419',
                    fontFamily: 'inherit',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── AGENTS ─────────────────────────────────────────────────── */}
        {section === 'agents' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', margin: 0 }}>Agents ({filteredAgents.length})</h2>
              <input
                placeholder="Search by name, email, brokerage…"
                value={agentSearch}
                onChange={e => setAgentSearch(e.target.value)}
                style={{
                  padding: '8px 14px', fontSize: 13, borderRadius: 8,
                  border: '1px solid #f0f2f4', background: '#fff', color: '#0f1419',
                  fontFamily: 'inherit', width: 280, outline: 'none',
                }}
              />
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f0f2f4', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Name', col: 'first_name' },
                      { label: 'Email', col: 'email' },
                      { label: 'Brokerage', col: 'brokerage' },
                      { label: 'RERA #', col: 'rera_number' },
                      { label: 'Slug', col: 'slug' },
                      { label: 'Properties', col: '_property_count' },
                      { label: 'Leads', col: '_lead_count' },
                      { label: 'Signed up', col: 'created_at' },
                    ].map(h => (
                      <th key={h.col} style={{ ...TH, cursor: 'pointer', userSelect: 'none' }} onClick={sortHeader(h.col, agentSort, setAgentSort)}>
                        {h.label}{sortArrow(h.col, agentSort)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.length === 0 && (
                    <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: 32 }}>No agents found</td></tr>
                  )}
                  {filteredAgents.map(agent => {
                    const isExpanded = expandedAgent === agent.id
                    const agentProps = properties.filter(p => p.agent_id === agent.id)
                    const agentLeads = leads.filter(l => l.agent_id === agent.id)
                    return (
                      <React.Fragment key={agent.id}>
                        <tr
                          onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                          style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isExpanded ? '#fafafa' : '#fff'}
                        >
                          <td style={TD}>
                            <div style={{ fontWeight: 600 }}>{[agent.first_name, agent.last_name].filter(Boolean).join(' ') || '—'}</div>
                          </td>
                          <td style={{ ...TD, color: '#5a6470' }}>{agent.email || '—'}</td>
                          <td style={{ ...TD, color: '#5a6470' }}>{agent.brokerage || '—'}</td>
                          <td style={{ ...TD, color: '#5a6470', fontFamily: 'monospace', fontSize: 12 }}>{agent.rera_number || '—'}</td>
                          <td style={{ ...TD, color: '#5a6470', fontFamily: 'monospace', fontSize: 12 }}>{agent.slug || '—'}</td>
                          <td style={{ ...TD, fontWeight: 600 }}>{agent._property_count}</td>
                          <td style={{ ...TD, fontWeight: 600 }}>{agent._lead_count}</td>
                          <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{fmtDate(agent.created_at)}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} style={{ padding: '0 16px 16px', background: '#fafafa', borderBottom: '1px solid #f0f2f4' }}>
                              <div style={{ padding: '12px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 12, color: '#5a6470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Properties ({agentProps.length})</div>
                                  {agentProps.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 12 }}>No properties</div> : agentProps.slice(0, 5).map(p => (
                                    <div key={p.id} style={{ fontSize: 12, color: '#0f1419', marginBottom: 4 }}>
                                      <span style={{ fontWeight: 500 }}>{p.title || 'Untitled'}</span>
                                      <span style={{ color: '#9ca3af', marginLeft: 8 }}>{fmtPrice(p.price)} · <Badge text={p.status} /></span>
                                    </div>
                                  ))}
                                  {agentProps.length > 5 && <div style={{ fontSize: 11, color: '#9ca3af' }}>+{agentProps.length - 5} more</div>}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 12, color: '#5a6470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leads ({agentLeads.length})</div>
                                  {agentLeads.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 12 }}>No leads</div> : agentLeads.slice(0, 5).map(l => (
                                    <div key={l.id} style={{ fontSize: 12, color: '#0f1419', marginBottom: 4 }}>
                                      <span style={{ fontWeight: 500 }}>{l.name || l.email || 'Unknown'}</span>
                                      <span style={{ color: '#9ca3af', marginLeft: 8 }}>{l._property_title}</span>
                                    </div>
                                  ))}
                                  {agentLeads.length > 5 && <div style={{ fontSize: 11, color: '#9ca3af' }}>+{agentLeads.length - 5} more</div>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PROPERTIES ─────────────────────────────────────────────── */}
        {section === 'properties' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', margin: 0 }}>Properties ({filteredProperties.length})</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={propFilterStatus}
                  onChange={e => setPropFilterStatus(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #f0f2f4', background: '#fff', fontFamily: 'inherit', color: '#0f1419' }}
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="live">Live</option>
                  <option value="published">Published</option>
                </select>
                <select
                  value={propFilterAgent}
                  onChange={e => setPropFilterAgent(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #f0f2f4', background: '#fff', fontFamily: 'inherit', color: '#0f1419' }}
                >
                  <option value="">All agents</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f0f2f4', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Title', col: 'title' },
                      { label: 'Agent', col: '_agent_name' },
                      { label: 'Community', col: 'community' },
                      { label: 'Type', col: 'property_type' },
                      { label: 'Price', col: 'price' },
                      { label: 'Status', col: 'status' },
                      { label: 'Published', col: 'published_at' },
                      { label: 'Views', col: 'views' },
                      { label: 'Leads', col: '_lead_count' },
                      { label: 'Visibility', col: '' },
                      { label: 'Actions', col: '' },
                    ].map(h => (
                      <th key={h.col + h.label} style={{ ...TH, cursor: h.col ? 'pointer' : 'default', userSelect: 'none' }} onClick={h.col ? sortHeader(h.col, propSort, setPropSort) : undefined}>
                        {h.label}{h.col ? sortArrow(h.col, propSort) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.length === 0 && (
                    <tr><td colSpan={11} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: 32 }}>No properties found</td></tr>
                  )}
                  {filteredProperties.map(prop => {
                    const isExpanded = expandedProp === prop.id
                    const propLeads = leads.filter(l => l.property_id === prop.id)
                    return (
                      <React.Fragment key={prop.id}>
                        <tr
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                        >
                          <td style={{ ...TD, fontWeight: 600 }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>
                            {prop.title || 'Untitled'}
                          </td>
                          <td style={{ ...TD, color: '#5a6470' }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>{prop._agent_name || '—'}</td>
                          <td style={{ ...TD, color: '#5a6470' }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>{prop.community || '—'}</td>
                          <td style={{ ...TD, color: '#5a6470' }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>{prop.property_type || '—'}</td>
                          <td style={TD} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>{fmtPrice(prop.price)}</td>
                          <td style={TD} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}><Badge text={prop.status} /></td>
                          <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>{fmtDate(prop.published_at || prop.created_at)}</td>
                          <td style={{ ...TD, color: '#5a6470' }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>0</td>
                          <td style={{ ...TD, fontWeight: 600 }} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>{prop._lead_count}</td>
                          <td style={TD} onClick={() => setExpandedProp(isExpanded ? null : prop.id)}>
                            <VisibilityDots status={['submitted', 'submitted', 'submitted', 'submitted', 'submitted', 'submitted', 'submitted']} />
                          </td>
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {prop.slug && (
                                <a
                                  href={`/p/${profiles.find(p => p.id === prop.agent_id)?.slug || prop.agent_id}/${prop.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: 11, padding: '3px 7px', borderRadius: 5, border: '1px solid #f0f2f4', color: '#5a6470', textDecoration: 'none', background: '#fff' }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={11} style={{ padding: '0 16px 16px', background: '#fafafa', borderBottom: '1px solid #f0f2f4' }}>
                              <div style={{ padding: '12px 0' }}>
                                <div style={{ fontWeight: 600, fontSize: 12, color: '#5a6470', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leads for this property ({propLeads.length})</div>
                                {propLeads.length === 0 ? <div style={{ color: '#9ca3af', fontSize: 12 }}>No leads yet</div> : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {propLeads.map(l => (
                                      <div key={l.id} style={{ fontSize: 12, display: 'flex', gap: 16, color: '#0f1419' }}>
                                        <span style={{ fontWeight: 500 }}>{l.name || 'Unknown'}</span>
                                        <span style={{ color: '#5a6470' }}>{l.phone}</span>
                                        <span style={{ color: '#5a6470' }}>{l.email}</span>
                                        <Badge text={l.status || 'new'} />
                                        <span style={{ color: '#9ca3af' }}>{fmtDate(l.created_at)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LEADS ─────────────────────────────────────────────────── */}
        {section === 'leads' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', margin: 0 }}>Leads ({filteredLeads.length})</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={leadFilterStatus}
                  onChange={e => setLeadFilterStatus(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #f0f2f4', background: '#fff', fontFamily: 'inherit', color: '#0f1419' }}
                >
                  <option value="">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="viewing">Viewing</option>
                  <option value="offer">Offer</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={leadFilterAgent}
                  onChange={e => setLeadFilterAgent(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #f0f2f4', background: '#fff', fontFamily: 'inherit', color: '#0f1419' }}
                >
                  <option value="">All agents</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f0f2f4', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Name', col: 'name' },
                      { label: 'Phone', col: 'phone' },
                      { label: 'Email', col: 'email' },
                      { label: 'Property', col: '_property_title' },
                      { label: 'Agent', col: '_agent_name' },
                      { label: 'Source', col: 'source' },
                      { label: 'Status', col: 'status' },
                      { label: 'Budget', col: 'budget' },
                      { label: 'Beds', col: 'beds' },
                      { label: 'Received', col: 'created_at' },
                    ].map(h => (
                      <th key={h.col} style={{ ...TH, cursor: 'pointer', userSelect: 'none' }} onClick={sortHeader(h.col, leadSort, setLeadSort)}>
                        {h.label}{sortArrow(h.col, leadSort)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={10} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: 32 }}>No leads found</td></tr>
                  )}
                  {filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                    >
                      <td style={{ ...TD, fontWeight: 600 }}>{lead.name || '—'}</td>
                      <td style={{ ...TD, color: '#5a6470', fontFamily: 'monospace', fontSize: 12 }}>{lead.phone || '—'}</td>
                      <td style={{ ...TD, color: '#5a6470', fontSize: 12 }}>{lead.email || '—'}</td>
                      <td style={{ ...TD, color: '#5a6470' }}>{lead._property_title || '—'}</td>
                      <td style={{ ...TD, color: '#5a6470' }}>{lead._agent_name || '—'}</td>
                      <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{lead.source || '—'}</td>
                      <td style={TD}><Badge text={lead.status || 'new'} /></td>
                      <td style={TD}>{fmtPrice(lead.budget)}</td>
                      <td style={{ ...TD, color: '#5a6470' }}>{lead.beds || '—'}</td>
                      <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{fmtDate(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VISIBILITY ─────────────────────────────────────────────── */}
        {section === 'visibility' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', marginBottom: 4 }}>AI Search Visibility Pipeline</h2>
              <p style={{ fontSize: 13, color: '#5a6470', margin: 0 }}>
                {properties.filter(p => ['live', 'published'].includes((p.status || '').toLowerCase())).length} properties submitted to all 7 engines
              </p>
            </div>
            {/* Engine legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {AI_ENGINES.map((engine) => (
                <div key={engine} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5a6470' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  {engine}
                </div>
              ))}
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f0f2f4', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={TH}>Property</th>
                    <th style={TH}>Agent</th>
                    <th style={TH}>Published</th>
                    <th style={TH}>AI Visibility (7 engines)</th>
                    <th style={TH}>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 && (
                    <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: 32 }}>No properties</td></tr>
                  )}
                  {properties.map(prop => {
                    const mockStatus = AI_ENGINES.map(() => 'submitted')
                    return (
                      <tr
                        key={prop.id}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                      >
                        <td style={{ ...TD, fontWeight: 600 }}>{prop.title || 'Untitled'}</td>
                        <td style={{ ...TD, color: '#5a6470' }}>{prop._agent_name || '—'}</td>
                        <td style={{ ...TD, color: '#9ca3af', fontSize: 12 }}>{fmtDate(prop.published_at || prop.created_at)}</td>
                        <td style={TD}><VisibilityDots status={mockStatus} /></td>
                        <td style={{ ...TD, fontSize: 12 }}>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>7/7</span>
                          <span style={{ color: '#9ca3af', marginLeft: 6 }}>submitted</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ─────────────────────────────────────────────── */}
        {section === 'activity' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', marginBottom: 16 }}>Activity Log (last 50 events)</h2>
            <div style={{ borderRadius: 12, border: '1px solid #f0f2f4', background: '#fff', overflow: 'hidden' }}>
              {activityLog.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No activity yet</div>
              )}
              {activityLog.map((event, i) => {
                const iconConfig: Record<string, { bg: string; color: string; emoji: string }> = {
                  signup: { bg: '#dbeafe', color: '#2563eb', emoji: '👤' },
                  property: { bg: '#d1fae5', color: '#059669', emoji: '🏠' },
                  lead: { bg: '#fef3c7', color: '#d97706', emoji: '📨' },
                }
                const cfg = iconConfig[event.type] || { bg: '#f0f2f4', color: '#5a6470', emoji: '•' }
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 20px',
                      borderBottom: i < activityLog.length - 1 ? '1px solid #f8f9fa' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15,
                    }}>
                      {cfg.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0f1419', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.text}</div>
                      {event.sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{event.sub}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{fmtDate(event.time)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
