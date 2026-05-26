import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Development {
  id: string
  name: string
  mode: 'teaser' | 'full_info'
  status: 'draft' | 'live' | 'archived'
  slug: string
  property_type_label: string | null
  handover_quarter: string | null
  handover_year: number | null
  created_at: string
  updated_at: string
  developer_id: string | null
}

interface Developer {
  id: string
  name: string
}

interface DevelopmentLead {
  development_id: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 5) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 8) return `${weeks}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

type TabKey = 'all' | 'live' | 'draft' | 'archived'

export default function Developments() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [developments, setDevelopments] = useState<Development[]>([])
  const [developers, setDevelopers] = useState<Record<string, string>>({})
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('developments').select('*').eq('workspace_id', user.id).order('created_at', { ascending: false }),
      supabase.from('developers').select('id,name'),
      supabase.from('development_leads').select('development_id').eq('workspace_id', user.id),
    ]).then(([{ data: devs }, { data: devrs }, { data: leads }]) => {
      setDevelopments((devs as Development[]) ?? [])
      const dMap: Record<string, string> = {}
      ;((devrs as Developer[]) ?? []).forEach(d => { dMap[d.id] = d.name })
      setDevelopers(dMap)
      const lCounts: Record<string, number> = {}
      ;((leads as DevelopmentLead[]) ?? []).forEach(l => {
        lCounts[l.development_id] = (lCounts[l.development_id] ?? 0) + 1
      })
      setLeadCounts(lCounts)
      setLoading(false)
    })
  }, [user])

  const filtered = developments.filter(d => {
    const matchTab = activeTab === 'all' || d.status === activeTab
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts: Record<TabKey, number> = {
    all: developments.length,
    live: developments.filter(d => d.status === 'live').length,
    draft: developments.filter(d => d.status === 'draft').length,
    archived: developments.filter(d => d.status === 'archived').length,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 80px' }}>
      <style>{`
        .dev-row { transition: background .1s; cursor: pointer; }
        .dev-row:hover { background: var(--paper-warm, #fbfaf7) !important; }
        .dev-tab { padding: 6px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; font-family: inherit; color: var(--muted, #5a6470); transition: all .12s; }
        .dev-tab.active { background: var(--ink, #0f1419); color: #fff; font-weight: 600; }
        .dev-tab:not(.active):hover { background: var(--line-soft, #f0f2f4); color: var(--ink, #0f1419); }
        .badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 100px; font-size: 11px; font-weight: 600; }
        .badge-teaser { background: var(--highlight, #f6f1e8); color: var(--highlight-text, #8b6f3a); }
        .badge-fullinfo { background: var(--accent-soft, #e8f0ed); color: var(--accent, #2d5a4f); }
        .badge-live { background: #dcfce7; color: #166534; }
        .badge-draft { background: var(--line-soft, #f0f2f4); color: var(--muted, #5a6470); }
        .badge-archived { background: #fef2f2; color: #991b1b; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink, #0f1419)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Developments
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted, #5a6470)', margin: 0 }}>
            Off-plan launches · Teaser and Full Info modes
          </p>
        </div>
        <button
          onClick={() => navigate('/developments/new')}
          style={{
            padding: '9px 18px', background: 'var(--accent, #2d5a4f)', color: '#fff',
            border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover, #234a40)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent, #2d5a4f)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add development
        </button>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'live', 'draft', 'archived'] as TabKey[]).map(tab => (
            <button key={tab} className={`dev-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.75 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search developments…"
          style={{
            padding: '8px 13px', borderRadius: 8, border: '1px solid var(--line, #e6e8eb)',
            fontSize: 13, background: '#fff', color: 'var(--ink, #0f1419)',
            fontFamily: 'inherit', width: 220, outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--line-soft, #f0f2f4)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 90px 80px',
          padding: '10px 20px', background: 'var(--paper-warm, #fbfaf7)',
          borderBottom: '1px solid var(--line-soft, #f0f2f4)',
          fontSize: 11, fontWeight: 700, color: 'var(--quiet, #8b95a0)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <span>Name</span>
          <span>Developer</span>
          <span>Mode</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Leads</span>
          <span style={{ textAlign: 'right' }}>Updated</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--quiet, #8b95a0)', fontSize: 13 }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--muted, #5a6470)', marginBottom: 8 }}>
              {search ? 'No developments match your search.' : 'No developments yet.'}
            </div>
            {!search && (
              <button
                onClick={() => navigate('/developments/new')}
                style={{
                  padding: '8px 16px', background: 'var(--accent, #2d5a4f)', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Add your first development
              </button>
            )}
          </div>
        ) : (
          filtered.map((dev, idx) => (
            <div
              key={dev.id}
              className="dev-row"
              onClick={() => navigate(`/developments/${dev.id}/edit`)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 90px 80px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--line-soft, #f0f2f4)' : 'none',
                background: '#fff',
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink, #0f1419)', marginBottom: 2 }}>
                  {dev.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted, #5a6470)' }}>
                  {dev.property_type_label ?? '—'}{dev.handover_quarter ? ` · ${dev.handover_quarter}` : dev.handover_year ? ` · ${dev.handover_year}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted, #5a6470)' }}>
                {dev.developer_id ? (developers[dev.developer_id] ?? '—') : '—'}
              </div>
              <div>
                <span className={`badge ${dev.mode === 'teaser' ? 'badge-teaser' : 'badge-fullinfo'}`}>
                  {dev.mode === 'teaser' ? 'Teaser' : 'Full Info'}
                </span>
              </div>
              <div>
                <span className={`badge badge-${dev.status}`}>
                  {dev.status.charAt(0).toUpperCase() + dev.status.slice(1)}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--ink, #0f1419)' }}>
                {leadCounts[dev.id] ?? 0}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--quiet, #8b95a0)' }}>
                {timeAgo(dev.updated_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
