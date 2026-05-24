import { useEffect, useState, useCallback } from 'react'
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

interface Property {
  id: string
  title: string
  community: string | null
  price: number | null
  images: string[] | null
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

const COUNTRY_CODES = [
  { flag: '🇦🇪', code: '+971', label: 'UAE' },
  { flag: '🇬🇧', code: '+44', label: 'UK' },
  { flag: '🇺🇸', code: '+1', label: 'US' },
  { flag: '🇸🇦', code: '+966', label: 'KSA' },
  { flag: '🇮🇳', code: '+91', label: 'India' },
  { flag: '🇸🇬', code: '+65', label: 'SG' },
]

const BUYER_TYPES = ['Cash', 'Mortgage', 'Investor', 'Browsing', 'Tenant']


const TIMELINE_OPTIONS = [
  'Just exploring',
  'Within 1 month',
  '1–3 months',
  '3–6 months',
  '6+ months',
]

const SOURCE_CARDS = [
  { key: 'manual_phone', icon: '📞', label: 'Phone call' },
  { key: 'manual_walkin', icon: '🚶', label: 'Walk-in' },
  { key: 'manual_referral', icon: '🤝', label: 'Referral' },
]

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
  if (b.includes('tenant')) return 'browsing'
  return 'browsing'
}

function formatPrice(p: number | null): string {
  if (!p) return ''
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(1)}M`
  if (p >= 1_000) return `AED ${(p / 1_000).toFixed(0)}K`
  return `AED ${p.toLocaleString()}`
}

// ───────────────────────────── Drawer Component ─────────────────────────────

interface DrawerState {
  source: string
  firstName: string
  lastName: string
  countryCode: string
  phone: string
  email: string
  buyerType: string
  propertyId: string | null
  budgetMin: string
  budgetMax: string
  bedsMin: number | null
  bedsMax: number | null
  timeline: string
  status: string
  note: string
  whatsapp: boolean
}

const defaultDrawer = (): DrawerState => ({
  source: 'manual_phone',
  firstName: '',
  lastName: '',
  countryCode: '+971',
  phone: '',
  email: '',
  buyerType: '',
  propertyId: null,
  budgetMin: '',
  budgetMax: '',
  bedsMin: null,
  bedsMax: null,
  timeline: '',
  status: 'new',
  note: '',
  whatsapp: true,
})

interface AddLeadDrawerProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  userId: string
  properties: Property[]
}

function AddLeadDrawer({ open, onClose, onSaved, userId, properties }: AddLeadDrawerProps) {
  const [form, setForm] = useState<DrawerState>(defaultDrawer())
  const [saving, setSaving] = useState(false)
  const [propSearch, setPropSearch] = useState('')
  const [success, setSuccess] = useState<{ name: string; buyerType: string; property: string | null; phone: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm(defaultDrawer())
      setPropSearch('')
      setSuccess(null)
      setErrors({})
    }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (success) setSuccess(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, success, onClose])

  const set = useCallback(<K extends keyof DrawerState>(key: K, val: DrawerState[K]) => {
    setForm(f => ({ ...f, [key]: val }))
  }, [])

  const filteredProps = properties.filter(p =>
    !propSearch ||
    p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
    (p.community ?? '').toLowerCase().includes(propSearch.toLowerCase())
  )

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    const fullPhone = `${form.countryCode}${form.phone.trim()}`
    const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ')

    const { error } = await supabase.schema('agent_pages').from('leads').insert({
      user_id: userId,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim() || null,
      phone: fullPhone,
      phone_country: form.countryCode,
      email: form.email.trim() || null,
      buyer_type: form.buyerType || null,
      property_id: form.propertyId || null,
      budget_min: form.budgetMin ? parseInt(form.budgetMin.replace(/,/g, ''), 10) || null : null,
      budget_max: form.budgetMax ? parseInt(form.budgetMax.replace(/,/g, ''), 10) || null : null,
      beds_min: form.bedsMin,
      beds_max: form.bedsMax,
      timeline: form.timeline || null,
      status: form.status,
      note: form.note.trim() || null,
      source: form.source,
      whatsapp_followup: form.whatsapp,
      // also keep legacy name field for list view
      name: fullName,
    })

    setSaving(false)
    if (error) {
      console.error(error)
      // Try without schema prefix
      await supabase.from('leads').insert({
        agent_id: userId,
        name: fullName,
        phone: fullPhone,
        email: form.email.trim() || null,
        buyer_type: form.buyerType || null,
        property_id: form.propertyId || null,
        status: form.status,
        message: form.note.trim() || null,
        source: form.source,
      })
    }

    const linkedProp = properties.find(p => p.id === form.propertyId)
    setSuccess({
      name: fullName,
      buyerType: form.buyerType || 'Browsing',
      property: linkedProp ? linkedProp.title : null,
      phone: fullPhone,
    })
    onSaved()
  }

  const sourceLabelMap: Record<string, string> = {
    manual_phone: 'Phone call',
    manual_walkin: 'Walk-in',
    manual_referral: 'Referral',
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay${open ? ' open' : ''}`}
        onClick={() => { if (success) setSuccess(null); else onClose(); }}
      />

      {/* Drawer */}
      <div className={`add-lead-drawer${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div className="drawer-eyebrow">NEW LEAD</div>
            <div className="drawer-title">Add a lead manually</div>
            <div className="drawer-subtitle">Only you see this — not shared anywhere.</div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Source chooser */}
        <div className="drawer-source-section">
          <div className="drawer-section-label">How did you meet?</div>
          <div className="drawer-source-grid">
            {SOURCE_CARDS.map(s => (
              <button
                key={s.key}
                className={`source-card${form.source === s.key ? ' selected' : ''}`}
                onClick={() => set('source', s.key)}
                type="button"
              >
                <span className="source-card-icon">{s.icon}</span>
                <span className="source-card-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="drawer-body">
          {/* Section 1 */}
          <div className="drawer-section">
            <div className="drawer-section-num">1</div>
            <div className="drawer-section-content">
              <div className="drawer-section-title">Who they are</div>

              <div className="drawer-row">
                <div className="drawer-field">
                  <label className="drawer-label">First name <span className="req">*</span></label>
                  <input
                    className={`drawer-input${errors.firstName ? ' error' : ''}`}
                    placeholder="e.g. Ahmed"
                    value={form.firstName}
                    onChange={e => { set('firstName', e.target.value); setErrors(v => ({ ...v, firstName: '' })) }}
                  />
                  {errors.firstName && <div className="field-error">{errors.firstName}</div>}
                </div>
                <div className="drawer-field">
                  <label className="drawer-label">Last name</label>
                  <input
                    className="drawer-input"
                    placeholder="Optional"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="drawer-field">
                <label className="drawer-label">Phone / WhatsApp <span className="req">*</span></label>
                <div className={`phone-input-wrap${errors.phone ? ' error' : ''}`}>
                  <select
                    className="country-code-select"
                    value={form.countryCode}
                    onChange={e => set('countryCode', e.target.value)}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    className="phone-number-input"
                    placeholder="50 123 4567"
                    value={form.phone}
                    onChange={e => { set('phone', e.target.value); setErrors(v => ({ ...v, phone: '' })) }}
                    type="tel"
                  />
                </div>
                {errors.phone && <div className="field-error">{errors.phone}</div>}
              </div>

              <div className="drawer-field">
                <label className="drawer-label">Email <span className="optional">(optional)</span></label>
                <input
                  className="drawer-input"
                  placeholder="name@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  type="email"
                />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="drawer-section">
            <div className="drawer-section-num">2</div>
            <div className="drawer-section-content">
              <div className="drawer-section-title">What they're looking for</div>

              <div className="drawer-field">
                <label className="drawer-label">Buyer type</label>
                <div className="pill-row">
                  {BUYER_TYPES.map(bt => (
                    <button
                      key={bt}
                      type="button"
                      className={`pill${form.buyerType === bt ? ' selected' : ''}`}
                      onClick={() => set('buyerType', form.buyerType === bt ? '' : bt)}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="drawer-field">
                <label className="drawer-label">Linked property</label>
                <div className="prop-picker">
                  <div className="prop-search-wrap">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                    <input
                      className="prop-search-input"
                      placeholder="Search properties..."
                      value={propSearch}
                      onChange={e => setPropSearch(e.target.value)}
                    />
                  </div>
                  <div className="prop-list">
                    <button
                      type="button"
                      className={`prop-item no-prop${form.propertyId === null ? ' selected' : ''}`}
                      onClick={() => set('propertyId', null)}
                    >
                      <div className="prop-item-info">
                        <div className="prop-item-name">No property yet</div>
                        <div className="prop-item-meta">General enquiry</div>
                      </div>
                      {form.propertyId === null && (
                        <svg className="prop-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                    {filteredProps.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`prop-item${form.propertyId === p.id ? ' selected' : ''}`}
                        onClick={() => set('propertyId', p.id)}
                      >
                        <div
                          className="prop-item-thumb"
                          style={p.images?.[0] ? { backgroundImage: `url(${p.images[0]})` } : undefined}
                        />
                        <div className="prop-item-info">
                          <div className="prop-item-name">{p.title}</div>
                          <div className="prop-item-meta">
                            {[p.community, formatPrice(p.price)].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        {form.propertyId === p.id && (
                          <svg className="prop-check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget range */}
              <div className="drawer-field">
                <label className="drawer-label">Budget range</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    className="drawer-input"
                    placeholder="AED min"
                    value={form.budgetMin}
                    onChange={e => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                      set('budgetMin', raw ? Number(raw).toLocaleString() : '')
                    }}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="drawer-input"
                    placeholder="AED max"
                    value={form.budgetMax}
                    onChange={e => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                      set('budgetMax', raw ? Number(raw).toLocaleString() : '')
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
                {/* Dual range slider */}
                <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center', gap: 0 }}>
                  <style>{`
                    .budget-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: var(--line, #e6e8eb); outline: none; position: absolute; pointer-events: none; }
                    .budget-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent, #2d5a4f); border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer; pointer-events: all; }
                    .budget-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--accent, #2d5a4f); border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer; pointer-events: all; }
                  `}</style>
                  <input
                    type="range" className="budget-slider"
                    min={500000} max={50000000} step={100000}
                    value={form.budgetMin ? parseInt(form.budgetMin.replace(/,/g,''),10) || 500000 : 500000}
                    onChange={e => {
                      const v = Number(e.target.value)
                      set('budgetMin', v === 500000 ? '' : v.toLocaleString())
                    }}
                  />
                  <input
                    type="range" className="budget-slider"
                    min={500000} max={50000000} step={100000}
                    value={form.budgetMax ? parseInt(form.budgetMax.replace(/,/g,''),10) || 50000000 : 50000000}
                    onChange={e => {
                      const v = Number(e.target.value)
                      set('budgetMax', v === 50000000 ? '' : v.toLocaleString())
                    }}
                  />
                </div>
              </div>

              {/* Bedroom range */}
              <div className="drawer-field">
                <label className="drawer-label">Bedrooms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[null, 'Studio', 1, 2, 3, 4, 5, '6+'].map((bed, idx) => {
                    const isAny = bed === null
                    const bedNum = isAny ? null : bed === 'Studio' ? 0 : bed === '6+' ? 6 : bed as number
                    let isSelected = false
                    if (isAny) isSelected = form.bedsMin === null && form.bedsMax === null
                    else isSelected = form.bedsMin !== null && bedNum !== null && bedNum >= (form.bedsMin ?? 0) && bedNum <= (form.bedsMax ?? form.bedsMin ?? bedNum)
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isAny) { set('bedsMin', null); set('bedsMax', null); return }
                          if (form.bedsMin === null) { set('bedsMin', bedNum); set('bedsMax', bedNum) }
                          else if (bedNum === form.bedsMin && bedNum === form.bedsMax) { set('bedsMin', null); set('bedsMax', null) }
                          else if (bedNum !== null && bedNum < (form.bedsMin ?? 0)) { set('bedsMin', bedNum) }
                          else if (bedNum !== null) { set('bedsMax', bedNum) }
                        }}
                        style={{
                          minHeight: 36, padding: '8px 16px', borderRadius: 100,
                          border: `1.5px solid ${isSelected ? 'var(--accent, #2d5a4f)' : 'var(--line, #e6e8eb)'}`,
                          background: isSelected ? 'var(--accent-soft, #e8f0ed)' : '#fff',
                          color: isSelected ? 'var(--accent, #2d5a4f)' : 'var(--ink, #0f1419)',
                          fontSize: 13, fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                        }}
                      >
                        {isAny ? 'Any' : String(bed)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="drawer-row">
                <div className="drawer-field">
                  <label className="drawer-label">Timeline</label>
                  <select
                    className="drawer-select"
                    value={form.timeline}
                    onChange={e => set('timeline', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {TIMELINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="drawer-section">
            <div className="drawer-section-num">3</div>
            <div className="drawer-section-content">
              <div className="drawer-section-title">Pipeline status</div>

              <div className="drawer-field">
                <label className="drawer-label">Status</label>
                <div className="status-stepper">
                  {PIPELINE_STEPS.map(s => (
                    <button
                      key={s.key}
                      type="button"
                      className={`stepper-pill${form.status === s.key ? ' selected' : ''}`}
                      onClick={() => set('status', s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="drawer-field">
                <label className="drawer-label">First note <span className="optional">(optional)</span></label>
                <textarea
                  className="drawer-textarea"
                  rows={3}
                  placeholder="What did you discuss? Any details to remember..."
                  value={form.note}
                  onChange={e => set('note', e.target.value)}
                />
              </div>

              <div className={`notify-card${form.whatsapp ? ' active' : ''}`}>
                <div className="notify-card-info">
                  <div className="notify-card-title">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                    WhatsApp follow-up
                  </div>
                  <div className="notify-card-sub">Mark as ready to follow up via WhatsApp</div>
                </div>
                <button
                  type="button"
                  className={`toggle-btn${form.whatsapp ? ' on' : ''}`}
                  onClick={() => set('whatsapp', !form.whatsapp)}
                  aria-label="Toggle WhatsApp follow-up"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <div className="drawer-footer-tag">
            Lead source will be tagged as Manual · {sourceLabelMap[form.source]}
          </div>
          <div className="drawer-footer-actions">
            <button className="btn btn-outline" onClick={onClose} type="button">Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? 'Saving...' : 'Save lead ✓'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {success && (
        <div className="success-overlay" onClick={() => setSuccess(null)}>
          <div className="success-card" onClick={e => e.stopPropagation()}>
            <div className="success-check">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="success-title">Lead saved</div>
            <div className="success-summary">
              <div className="success-avatar">{getInitials(success.name)}</div>
              <div className="success-info">
                <div className="success-name">{success.name}</div>
                <div className="success-meta">
                  {success.buyerType}
                  {success.property ? ` · ${success.property}` : ''}
                  {success.phone ? ` · ${success.phone}` : ''}
                </div>
              </div>
            </div>
            <div className="success-actions">
              <button className="btn btn-outline" onClick={() => { setSuccess(null); onClose(); }}>
                View in pipeline →
              </button>
              <button className="btn btn-primary" onClick={() => { setSuccess(null) }}>
                Add another lead
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ───────────────────────────── Main Page ─────────────────────────────

export default function Leads() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [noteText, setNoteText] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchLeads = useCallback(() => {
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

  useEffect(() => { fetchLeads() }, [fetchLeads])

  useEffect(() => {
    if (!user) return
    supabase
      .from('properties')
      .select('id, title, community, price, images')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setProperties((data as Property[]) ?? []))
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
            <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
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
              Lead → viewing rate
            </div>
            <div className="kpi-val">0%</div>
            <div className="kpi-delta muted">—</div>
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

                  <div className="lead-detail-actions">
                    {selectedLead.phone ? (
                      <a className="lead-action-btn primary" href={`tel:${selectedLead.phone}`}>
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

      {/* ADD LEAD DRAWER */}
      {user && (
        <AddLeadDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSaved={fetchLeads}
          userId={user.id}
          properties={properties}
        />
      )}
    </div>
  )
}
