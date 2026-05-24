import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/leads.css'

interface Lead {
  id: string
  agent_id: string
  property_id: string | null
  name: string
  email: string | null
  phone: string | null
  buyer_type: string | null
  message: string | null
  status: 'new' | 'contacted' | 'viewing' | 'offer' | 'closed' | 'cold'
  source: string | null
  created_at: string
  updated_at: string
  properties?: {
    title: string
    community: string | null
  } | null
}

type TabKey = 'all' | 'new' | 'contacted' | 'viewing' | 'offer' | 'closed'

const PIPELINE_STEPS: Array<{ key: string; label: string }> = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'viewing', label: 'Viewing' },
  { key: 'offer', label: 'Offer' },
  { key: 'closed', label: 'Closed' },
]

const AVATAR_COLORS = ['', 'c2', 'c3', 'c4', 'c5', 'c6']

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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'Earlier this week'
  return 'Earlier'
}

function getBuyerTag(bt: string | null): string {
  if (!bt) return 'browsing'
  const b = bt.toLowerCase()
  if (b.includes('cash')) return 'cash'
  if (b.includes('mortgage')) return 'mortgage'
  if (b.includes('invest')) return 'investor'
  return 'browsing'
}

export default function Leads() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('leads')
      .select('*, properties(title, community)')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLeads((data as Lead[]) ?? [])
        setLoading(false)
      })
  }, [user])

  const filtered = leads.filter(l => {
    const matchTab = activeTab === 'all' || l.status === activeTab
    const matchSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.phone ?? '').includes(search)
    return matchTab && matchSearch
  })

  const counts: Record<TabKey, number> = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    viewing: leads.filter(l => l.status === 'viewing').length,
    offer: leads.filter(l => l.status === 'offer').length,
    closed: leads.filter(l => l.status === 'closed').length,
  }

  const today = new Date().toDateString()
  const newToday = leads.filter(l => new Date(l.created_at).toDateString() === today).length
  const viewingsBooked = leads.filter(l => l.status === 'viewing').length

  // Group leads by date label
  const groups: { label: string; leads: Lead[] }[] = []
  const seen = new Set<string>()
  for (const lead of filtered) {
    const label = formatDateLabel(lead.created_at)
    if (!seen.has(label)) {
      seen.add(label)
      groups.push({ label, leads: [] })
    }
    groups[groups.length - 1].leads.push(lead)
  }

  async function updateLeadStatus(leadId: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', leadId)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: status as Lead['status'] } : l))
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status: status as Lead['status'] } : prev)
    }
  }

  return (
    <div className="leads-page">

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="page-head-top">
          <div>
            <h1 className="page-title">Leads</h1>
            <p className="page-sub">All enquiries from your property pages and portfolio — never shared, only yours.</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-outline">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export
            </button>
            <button className="btn btn-primary">
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Add manually
            </button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="kpi-strip">
          <div className="kpi-card">
            <div className="kpi-label">
              <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              Total leads
            </div>
            <div className="kpi-val">{leads.length}</div>
            <div className="kpi-delta">+{Math.min(leads.length, 18)} this week</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="10"/></svg>
              New today
            </div>
            <div className="kpi-val">{newToday}</div>
            <div className="kpi-delta">{counts.new} unread</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
              Viewings booked
            </div>
            <div className="kpi-val">{viewingsBooked}</div>
            <div className="kpi-delta muted">In pipeline</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">
              <svg viewBox="0 0 24 24"><path d="M3 3v18h18M7 14l4-4 3 3 5-6"/></svg>
              Conversion rate
            </div>
            <div className="kpi-val">8.4%</div>
            <div className="kpi-delta">+1.2pp vs last 30d</div>
          </div>
        </div>
      </div>

      {/* INBOX */}
      <div className="inbox-wrap">
        <div className="inbox">
          <div className="inbox-topbar">
            <div className="inbox-tabs">
              {(['all', 'new', 'contacted', 'viewing', 'offer', 'closed'] as TabKey[]).map(tab => (
                <button
                  key={tab}
                  className={`inbox-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="inbox-tab-count">{counts[tab] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="inbox-actions">
              <div className="inbox-search">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                <input
                  type="text"
                  placeholder="Search by name, phone, email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className="filter-btn">
                <svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
                Filters
              </button>
            </div>
          </div>

          <div className="inbox-grid">
            {/* LEAD LIST */}
            <div className="lead-list">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-detail">
                  <div className="empty-detail-icon">
                    <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>
                  </div>
                  <div className="empty-detail-title">No leads yet</div>
                  <p className="empty-detail-text">Leads from your property pages will appear here.</p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label}>
                    <div className="list-group-head">{group.label}</div>
                    {group.leads.map((lead, idx) => {
                      const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                      const isSelected = selectedLead?.id === lead.id
                      const isNew = lead.status === 'new'
                      const buyerTag = getBuyerTag(lead.buyer_type)
                      return (
                        <div
                          key={lead.id}
                          className={`lead-row${isSelected ? ' selected' : ''}${isNew ? ' unread' : ''}`}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div className={`lead-avatar ${avatarColor}`}>{getInitials(lead.name)}</div>
                          <div className="lead-body">
                            <div className="lead-name-row">
                              <div className="lead-name">{lead.name}</div>
                              <div className={`lead-tag ${buyerTag}`}>
                                {lead.buyer_type ?? 'Browsing'}
                              </div>
                            </div>
                            <div className="lead-prop">
                              {lead.properties ? (
                                <><strong>{lead.properties.title}{lead.properties.community ? ` · ${lead.properties.community}` : ''}</strong></>
                              ) : (
                                <span>Portfolio enquiry</span>
                              )}
                            </div>
                            <div className="lead-source">
                              <div className="lead-source-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#8b95a0" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                              </div>
                              {lead.source ?? 'Direct enquiry'}
                            </div>
                          </div>
                          <div className="lead-meta">
                            <div className="lead-time">{timeAgo(lead.created_at)}</div>
                            <div className={`lead-status ${lead.status}`}>{lead.status}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* LEAD DETAIL PANEL */}
            <div className={`lead-detail${selectedLead ? ' visible' : ''}`}>
              {!selectedLead ? (
                <div className="empty-detail">
                  <div className="empty-detail-icon">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="#8b95a0" strokeWidth="2"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" fill="none" stroke="#8b95a0" strokeWidth="2"/></svg>
                  </div>
                  <div className="empty-detail-title">Select a lead</div>
                  <p className="empty-detail-text">Click any lead on the left to see their details and manage the pipeline.</p>
                </div>
              ) : (
                <>
                  <div className="lead-detail-head">
                    <div className="lead-detail-avatar">{getInitials(selectedLead.name)}</div>
                    <div className="lead-detail-info">
                      <div className="lead-detail-name">{selectedLead.name}</div>
                      <div className="lead-detail-tagline">
                        <span className={`lead-tag ${getBuyerTag(selectedLead.buyer_type)}`}>
                          {selectedLead.buyer_type ?? 'Browsing'}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(selectedLead.created_at)}</span>
                      </div>
                    </div>
                    <button className="lead-detail-close" onClick={() => setSelectedLead(null)}>
                      <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  {/* Property card */}
                  {selectedLead.properties && (
                    <div
                      className="lead-detail-prop"
                      onClick={() => selectedLead.property_id && navigate(`/properties/${selectedLead.property_id}`)}
                    >
                      <div className="lead-detail-prop-thumb" />
                      <div className="lead-detail-prop-info">
                        <div className="lead-detail-prop-name">{selectedLead.properties.title}</div>
                        <div className="lead-detail-prop-meta">
                          {selectedLead.properties.community ?? ''} · Live listing
                        </div>
                      </div>
                      <div className="lead-detail-prop-link">
                        <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="lead-detail-actions">
                    {selectedLead.phone ? (
                      <a
                        className="lead-action-btn primary"
                        href={`tel:${selectedLead.phone}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z"/>
                        </svg>
                        Call
                      </a>
                    ) : (
                      <button className="lead-action-btn primary" disabled>Call</button>
                    )}
                    {selectedLead.phone ? (
                      <a
                        className="lead-action-btn whatsapp"
                        href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                        WhatsApp
                      </a>
                    ) : (
                      <button className="lead-action-btn whatsapp" disabled>WhatsApp</button>
                    )}
                    <button className="lead-action-btn outline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
                      Book viewing
                    </button>
                  </div>

                  {/* Pipeline */}
                  <div className="lead-pipeline">
                    {PIPELINE_STEPS.map((step, i) => {
                      const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === selectedLead.status)
                      const isDone = i < currentIdx
                      const isActive = i === currentIdx
                      return (
                        <button
                          key={step.key}
                          className={`lead-pipeline-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}
                          onClick={() => updateLeadStatus(selectedLead.id, step.key)}
                        >
                          {step.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Contact details */}
                  <div className="detail-section">
                    <div className="detail-section-title">Contact</div>
                    <div className="detail-fields">
                      {selectedLead.phone && (
                        <div className="detail-field">
                          <div className="detail-field-label">Phone</div>
                          <div className="detail-field-value">
                            <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a>
                          </div>
                        </div>
                      )}
                      {selectedLead.email && (
                        <div className="detail-field">
                          <div className="detail-field-label">Email</div>
                          <div className="detail-field-value">{selectedLead.email}</div>
                        </div>
                      )}
                      {selectedLead.buyer_type && (
                        <div className="detail-field">
                          <div className="detail-field-label">Buyer type</div>
                          <div className="detail-field-value">{selectedLead.buyer_type}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Source */}
                  {selectedLead.source && (
                    <div className="detail-section">
                      <div className="detail-section-title">Source</div>
                      <div className="source-box">
                        <div className="source-row">
                          <span className="source-label">Channel</span>
                          <strong>{selectedLead.source}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message / Notes */}
                  {selectedLead.message && (
                    <div className="detail-section">
                      <div className="detail-section-title">Message</div>
                      <div className="notes-list">
                        <div className="note">
                          <div className="note-text">{selectedLead.message}</div>
                          <div className="note-meta">Lead · {timeAgo(selectedLead.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes input */}
                  <div className="detail-section">
                    <div className="detail-section-title">Notes</div>
                    <div className="notes-input-wrap">
                      <textarea
                        className="notes-input"
                        rows={1}
                        placeholder="Add a note... (only you see this)"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
