import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/properties.css'

interface Property {
  id: string
  title: string
  status: 'live' | 'draft' | 'paused' | 'sold'
  slug: string | null
  asking_price_aed: number | null
  community: string | null
  bedrooms: number | null
  size_sqft: number | null
  photo_count?: number
  created_at: string
  updated_at: string
  view_count?: number
  inquiry_count?: number
}

function formatPrice(p: number | null): string {
  if (!p) return 'POR'
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (p >= 1_000) return `AED ${(p / 1_000).toFixed(0)}K`
  return `AED ${p.toLocaleString()}`
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
  if (days < 14) return '1 week ago'
  if (days < 21) return '2 weeks ago'
  if (days < 35) return '3 weeks ago'
  const weeks = Math.floor(days / 7)
  if (weeks < 8) return `${weeks} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

const THUMB_CLASSES = ['t1', 't2', 't3', 't4', 't5', 't6']



type TabKey = 'all' | 'live' | 'draft' | 'paused' | 'sold'

export default function Properties() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('properties')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProperties((data as Property[]) ?? [])
        setLoading(false)
      })
  }, [user])

  const filtered = properties.filter(p => {
    const matchTab = activeTab === 'all' || p.status === activeTab
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.community ?? '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts: Record<TabKey, number> = {
    all: properties.length,
    live: properties.filter(p => p.status === 'live').length,
    draft: properties.filter(p => p.status === 'draft').length,
    paused: properties.filter(p => p.status === 'paused').length,
    sold: properties.filter(p => p.status === 'sold').length,
  }

  const liveCount = counts.live
  const totalSlots = 19
  const progressPct = Math.round((liveCount / totalSlots) * 100)

  return (
    <div className="properties-page">

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="page-head-top">
          <div>
            <h1 className="page-title">Properties</h1>
            <p className="page-sub">Every property page you've published or drafted — live, paused, sold, or in progress.</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-outline">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/properties/new')}>
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Add property
            </button>
          </div>
        </div>

        {/* Plan usage banner */}
        <div className="plan-banner">
          <div className="plan-banner-left">
            <div className="plan-banner-icon">
              <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21v-8h6v8"/></svg>
            </div>
            <div>
              <div className="plan-banner-text-title">Pro plan · 10–19 properties</div>
              <div className="plan-banner-bar">
                <div className="plan-banner-progress">
                  <div className="plan-banner-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="plan-banner-progress-text">
                  <strong>{liveCount}</strong> live · {totalSlots - liveCount} of {totalSlots} slots remaining
                </div>
              </div>
            </div>
          </div>
          <div className="plan-banner-right">
            <div className="plan-banner-bill">Next bill <strong>$100</strong> on <strong>15 Jun</strong></div>
            <button className="btn btn-outline">Manage plan</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-tabs">
            {(['all', 'live', 'draft', 'paused', 'sold'] as TabKey[]).map(tab => (
              <button
                key={tab}
                className={`toolbar-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="toolbar-tab-count">{counts[tab]}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="sort-btn">
              Sort: Most recent
              <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div className="view-toggle">
              <button className="view-toggle-btn active" title="Table view">
                <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              </button>
              <button className="view-toggle-btn" title="Grid view">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROPERTIES TABLE */}
      <div className="properties-wrap">
        <div className="properties-table">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/></svg>
              </div>
              <div className="empty-state-title">
                {search ? 'No properties match your search' : 'No properties yet'}
              </div>
              <p className="empty-state-text">
                {search ? 'Try a different search term.' : 'Add your first property to get started.'}
              </p>
              {!search && (
                <button className="btn btn-primary" onClick={() => navigate('/properties/new')}>
                  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Add property
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-head">
                <div />
                <div className="table-head-cell">Property</div>
                <div className="table-head-cell">Status</div>
                <div className="table-head-cell">
                  Views
                  <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <div className="table-head-cell">
                  Leads
                  <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <div className="table-head-cell">Updated</div>
                <div />
              </div>

              {filtered.map((prop, idx) => {
                const thumbClass = prop.status === 'draft' && !prop.asking_price_aed
                  ? 'empty'
                  : THUMB_CLASSES[idx % THUMB_CLASSES.length]
                const isDraft = prop.status === 'draft'
                const rowStyle = isDraft ? { background: 'rgba(251,250,247,0.6)' } : undefined

                return (
                  <div
                    key={prop.id}
                    className="prop-row"
                    style={rowStyle}
                    onClick={() => navigate(`/properties/${prop.id}`)}
                  >
                    {/* Thumb */}
                    <div className={`prop-thumb ${thumbClass}`}>
                      {thumbClass === 'empty' ? (
                        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
                      ) : (
                        prop.photo_count && prop.photo_count > 0 ? (
                          <div className="prop-thumb-count">{prop.photo_count}</div>
                        ) : null
                      )}
                    </div>

                    {/* Info */}
                    <div className="prop-info">
                      <div className="prop-name-row">
                        <div className="prop-name">{prop.title || 'Untitled draft'}</div>
                        {isDraft && (
                          <span className="warn-pill">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            Incomplete
                          </span>
                        )}
                      </div>
                      <div className="prop-meta">
                        {prop.community && <span>{prop.community}</span>}
                        {prop.community && prop.bedrooms && <span className="prop-meta-dot" />}
                        {prop.bedrooms && <span>{prop.bedrooms} beds</span>}
                        {prop.size_sqft && <><span className="prop-meta-dot" /><span>{prop.size_sqft.toLocaleString()} sqft</span></>}
                        {prop.asking_price_aed && <><span className="prop-meta-dot" /><span className="prop-price">{formatPrice(prop.asking_price_aed)}</span></>}
                        {prop.slug && !isDraft && (
                          <>
                            <span className="prop-meta-dot" />
                            <a
                              className="prop-url"
                              href={`/${prop.slug}`}
                              onClick={e => e.stopPropagation()}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                              {prop.slug}
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="prop-status-cell">
                      <span className={`status-pill ${prop.status}`}>
                        {prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
                      </span>
                    </div>

                    {/* Views */}
                    <div className="prop-views-cell">
                      {isDraft ? (
                        <div className="metric dim">—</div>
                      ) : (
                        <div className="metric">{(prop.view_count ?? 0).toLocaleString()}</div>
                      )}
                    </div>

                    {/* Leads */}
                    <div className="prop-leads-cell">
                      {isDraft ? (
                        <div className="metric dim">—</div>
                      ) : (
                        <div className="metric">{prop.inquiry_count ?? 0}</div>
                      )}
                    </div>

                    {/* Updated */}
                    <div className="prop-updated-cell">
                      <div className="metric">{timeAgo(prop.updated_at || prop.created_at)}</div>
                      {prop.status === 'live' && (
                        <div className="metric-sub">live</div>
                      )}
                      {prop.status === 'paused' && (
                        <div className="metric-sub">paused</div>
                      )}
                      {prop.status === 'sold' && (
                        <div className="metric-sub">closed</div>
                      )}
                    </div>

                    {/* Menu */}
                    <div className="prop-menu-cell">
                      <button
                        className="row-menu"
                        onClick={e => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
