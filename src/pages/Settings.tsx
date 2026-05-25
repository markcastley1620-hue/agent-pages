import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/settings.css'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Profile {
  id?: string
  first_name: string
  last_name: string
  role: string
  tagline: string
  brokerage_name: string
  rera_number: string
  orn: string
  accent_color: string
  url_handle: string
  phone: string
  email: string
  available_hours: string
  timezone: string
  photo_url: string
  logo_url: string
  show_call: boolean
  show_whatsapp: boolean
  show_calendar: boolean
  notif_push: boolean
  notif_email: boolean
  notif_daily_digest: boolean
}

const defaultProfile: Profile = {
  first_name: '',
  last_name: '',
  role: '',
  tagline: '',
  brokerage_name: '',
  rera_number: '',
  orn: '',
  accent_color: '#2d5a4f',
  url_handle: '',
  phone: '',
  email: '',
  available_hours: 'Daily, 9am – 8pm GST',
  timezone: 'GST · Dubai (UTC+4)',
  photo_url: '',
  logo_url: '',
  show_call: true,
  show_whatsapp: true,
  show_calendar: false,
  notif_push: true,
  notif_email: true,
  notif_daily_digest: false,
}

const BRAND_COLORS = [
  '#2d5a4f', '#1f3a68', '#6e2e3d', '#2c343d', '#a14b2c', '#5e6b3a', '#1a2535',
]

const TIMEZONES = [
  'GST · Dubai (UTC+4)',
  'GMT · London',
  'EST · New York',
  'PST · Los Angeles',
  'IST · Mumbai (UTC+5:30)',
]

// ── Upload helper ─────────────────────────────────────────────────────────────
const uploadFile = async (bucket: string, path: string, file: File): Promise<string | null> => {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>
)
const IconLock = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
)
const IconMoon = () => (
  <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
)
const IconCard = () => (
  <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
)
const IconFile = () => (
  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
)
const IconBell = () => (
  <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
)
const IconMail = () => (
  <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
)
const IconTeam = () => (
  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
)
const IconLink = () => (
  <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
)
const IconCode = () => (
  <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
)
const IconHelp = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
)
const IconLogout = () => (
  <svg viewBox="0 0 24 24"><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/></svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
)
const IconStar = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z"/></svg>
)
const IconCheckSmall = () => (
  <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
)

// ── Component ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [saving, setSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [activeLink, setActiveLink] = useState('profile')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Section refs for scroll
  const identityRef = useRef<HTMLDivElement>(null)
  const brokerageRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const billingRef = useRef<HTMLDivElement>(null)
  const integRef = useRef<HTMLDivElement>(null)
  const teamRef = useRef<HTMLDivElement>(null)

  // Load profile on mount
  useEffect(() => {
    if (!user) return
    supabase
      .schema('agent_pages')
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile({ ...defaultProfile, ...data })
      })
  }, [user])

  // Save helpers
  const saveProfile = async (section: string, partial?: Partial<Profile>) => {
    if (!user) return
    setSaving(true)
    const payload = { ...(partial ?? profile), id: user.id }
    const { error } = await supabase
      .schema('agent_pages')
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
    setSaving(false)
    if (!error) {
      setSavedSection(section)
      setTimeout(() => setSavedSection(null), 2500)
    }
  }

  const set = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile(p => ({ ...p, [key]: e.target.value }))
  }

  const toggle = (key: keyof Profile) => () => {
    setProfile(p => {
      const updated = { ...p, [key]: !p[key] }
      // auto-save toggles
      if (user) {
        supabase.schema('agent_pages').from('profiles').upsert({ ...updated, id: user.id }, { onConflict: 'id' })
      }
      return updated
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const url = await uploadFile('agent-assets', `${user.id}/photo-${file.name}`, file)
    if (url) {
      setProfile(p => ({ ...p, photo_url: url }))
      await supabase.schema('agent_pages').from('profiles').upsert({ id: user.id, photo_url: url }, { onConflict: 'id' })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const url = await uploadFile('agent-assets', `${user.id}/logo-${file.name}`, file)
    if (url) {
      setProfile(p => ({ ...p, logo_url: url }))
      await supabase.schema('agent_pages').from('profiles').upsert({ id: user.id, logo_url: url }, { onConflict: 'id' })
    }
  }

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, link: string) => {
    setActiveLink(link)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const avatarInitials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'AP'
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Your Name'

  return (
    <div className="settings-root">
      {/* TOP BAR */}
      <div className="s-topbar">
        <div className="s-topbar-left">
          <div className="s-topbar-brand">
            <div className="s-topbar-logo">a</div>
            <div className="s-topbar-name">Agent Pages</div>
          </div>
          <nav className="s-topbar-nav">
            <a href="/dashboard">Dashboard</a>
            <a href="/properties">Properties</a>
            <a href="/leads">Leads</a>
            <a href="/portfolio">Portfolio</a>
            <a href="/analytics">Analytics</a>
          </nav>
        </div>
        <div className="s-topbar-right">
          <div className="s-topbar-avatar">{avatarInitials}</div>
        </div>
      </div>

      <div className="s-page">
        {/* SIDEBAR */}
        <aside className="s-side">
          <div className="s-side-eyebrow">Settings</div>
          <div className="s-side-title">{displayName}</div>

          <div className="s-side-group">
            <div className="s-side-group-label">Account</div>
            <button className={`s-side-link ${activeLink === 'profile' ? 'active' : ''}`} onClick={() => scrollTo(identityRef, 'profile')}>
              <IconUser /> Profile &amp; branding
            </button>
            <button className={`s-side-link ${activeLink === 'security' ? 'active' : ''}`} onClick={() => setActiveLink('security')}>
              <IconLock /> Security &amp; password
            </button>
            <button className={`s-side-link ${activeLink === 'appearance' ? 'active' : ''}`} onClick={() => setActiveLink('appearance')}>
              <IconMoon /> Appearance
            </button>
          </div>

          <div className="s-side-group">
            <div className="s-side-group-label">Billing</div>
            <button className={`s-side-link ${activeLink === 'billing' ? 'active' : ''}`} onClick={() => scrollTo(billingRef, 'billing')}>
              <IconCard /> Plan &amp; billing
            </button>
            <button className={`s-side-link ${activeLink === 'invoices' ? 'active' : ''}`} onClick={() => setActiveLink('invoices')}>
              <IconFile /> Invoices
            </button>
          </div>

          <div className="s-side-group">
            <div className="s-side-group-label">Notifications</div>
            <button className={`s-side-link ${activeLink === 'alerts' ? 'active' : ''}`} onClick={() => scrollTo(notifRef, 'alerts')}>
              <IconBell /> Lead alerts
            </button>
            <button className={`s-side-link ${activeLink === 'emailprefs' ? 'active' : ''}`} onClick={() => setActiveLink('emailprefs')}>
              <IconMail /> Email preferences
            </button>
          </div>

          <div className="s-side-group">
            <div className="s-side-group-label">Workspace</div>
            <button className={`s-side-link ${activeLink === 'team' ? 'active' : ''}`} onClick={() => scrollTo(teamRef, 'team')}>
              <IconTeam /> Team members
            </button>
            <button className={`s-side-link ${activeLink === 'integrations' ? 'active' : ''}`} onClick={() => scrollTo(integRef, 'integrations')}>
              <IconLink /> Integrations
            </button>
            <button className={`s-side-link ${activeLink === 'api' ? 'active' : ''}`} onClick={() => setActiveLink('api')}>
              <IconCode /> API &amp; webhooks
            </button>
          </div>

          <div className="s-side-group">
            <div className="s-side-group-label">Other</div>
            <button className={`s-side-link ${activeLink === 'rera' ? 'active' : ''}`} onClick={() => scrollTo(brokerageRef, 'rera')}>
              <IconCheck /> RERA compliance
            </button>
            <button className={`s-side-link ${activeLink === 'help' ? 'active' : ''}`} onClick={() => setActiveLink('help')}>
              <IconHelp /> Help &amp; support
            </button>
            <button className="s-side-link danger" onClick={() => navigate('/login')}>
              <IconLogout /> Sign out
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="s-content">
          <div className="s-content-head">
            <div className="s-content-eyebrow">Account</div>
            <h1 className="s-content-title">Profile &amp; branding</h1>
            <p className="s-content-sub">
              The agent details and brand styling that appear on every property page you publish.
              Changes here update across all your pages instantly.
            </p>
          </div>

          {/* ── IDENTITY ── */}
          <div className="s-sec-card" ref={identityRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Identity</div>
                <div className="s-sec-card-sub">Your photo, name, and role. Appears in the agent block on every property page.</div>
              </div>
              {savedSection === 'identity' && (
                <div className="s-saved-pill">
                  <IconCheckSmall />
                  Synced
                </div>
              )}
              {savedSection !== 'identity' && (
                <div className="s-saved-pill">
                  <IconCheckSmall />
                  Synced to 7 pages
                </div>
              )}
            </div>
            <div className="s-sec-card-body">
              {/* Photo row */}
              <div className="s-photo-row">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt="Profile" className="s-photo-preview" />
                ) : (
                  <div className="s-photo-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
                    {avatarInitials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="s-photo-name">{profile.photo_url ? 'Profile photo' : 'No photo uploaded'}</div>
                  <div className="s-photo-meta">{profile.photo_url ? 'Tap Replace to update' : 'Upload a headshot (JPG, PNG · max 5 MB)'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                  <button className="s-btn s-btn-outline" onClick={() => photoInputRef.current?.click()}>Replace</button>
                  {profile.photo_url && (
                    <button className="s-btn s-btn-danger" onClick={() => setProfile(p => ({ ...p, photo_url: '' }))}>Remove</button>
                  )}
                </div>
              </div>

              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">First name<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.first_name} onChange={set('first_name')} onBlur={() => saveProfile('identity')} />
                </div>
                <div className="s-field">
                  <div className="s-field-label">Last name<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.last_name} onChange={set('last_name')} onBlur={() => saveProfile('identity')} />
                </div>
              </div>

              <div className="s-field">
                <div className="s-field-label">Role / title<span className="s-field-optional">optional</span></div>
                <input className="s-field-input" value={profile.role} onChange={set('role')} onBlur={() => saveProfile('identity')} />
              </div>

              <div className="s-field">
                <div className="s-field-label">Tagline<span className="s-field-optional">optional</span></div>
                <input className="s-field-input" value={profile.tagline} onChange={set('tagline')} onBlur={() => saveProfile('identity')} />
                <div className="s-field-hint">Shown on your portfolio page (active once you have 3 properties live).</div>
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Changes apply across all <strong style={{ color: 'var(--ink)' }}>7 live property pages</strong></div>
              <button className="s-btn s-btn-primary" onClick={() => saveProfile('identity')} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── BROKERAGE ── */}
          <div className="s-sec-card" ref={brokerageRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Brokerage &amp; compliance</div>
                <div className="s-sec-card-sub">RERA-verified credentials. Shown in the footer of every page for regulatory compliance.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              <div className="s-field">
                <div className="s-field-label">Brokerage name<span className="s-field-required">required</span></div>
                <input className="s-field-input" value={profile.brokerage_name} onChange={set('brokerage_name')} onBlur={() => saveProfile('brokerage')} />
              </div>

              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">RERA agent number<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.rera_number} onChange={set('rera_number')} onBlur={() => saveProfile('brokerage')} />
                </div>
                <div className="s-field">
                  <div className="s-field-label">ORN (brokerage)<span className="s-field-optional">optional</span></div>
                  <input className="s-field-input" value={profile.orn} onChange={set('orn')} onBlur={() => saveProfile('brokerage')} />
                </div>
              </div>

              <div className="s-field">
                <div className="s-field-label">Brokerage logo<span className="s-field-optional">optional</span></div>
                <div className="s-logo-row">
                  <div className="s-logo-preview">
                    {profile.logo_url ? <img src={profile.logo_url} alt="Logo" /> : <span>{profile.brokerage_name?.slice(0, 3) || 'B&P'}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                      {profile.logo_url ? 'Brokerage logo' : 'No logo uploaded'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {profile.logo_url ? 'Transparent PNG recommended' : 'Upload PNG or SVG (transparent background)'}
                    </div>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  <button className="s-btn s-btn-outline" onClick={() => logoInputRef.current?.click()}>Replace</button>
                </div>
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">RERA verified · last checked 5 days ago</div>
              <button className="s-btn s-btn-primary" onClick={() => saveProfile('brokerage')} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── BRAND & URL ── */}
          <div className="s-sec-card" ref={brandRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Brand &amp; URL</div>
                <div className="s-sec-card-sub">Your accent colour and URL handle. Used across every page you publish.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              <div className="s-field">
                <div className="s-field-label">URL handle<span className="s-field-required">required</span></div>
                <div className="s-url-input-wrap">
                  <span className="s-url-prefix">agentpages.io/</span>
                  <input
                    className="s-url-input"
                    value={profile.url_handle}
                    onChange={set('url_handle')}
                    onBlur={() => saveProfile('brand')}
                  />
                  <button className="s-btn-ghost" style={{ fontSize: 11 }}>Change</button>
                </div>
                <div className="s-field-hint">Changing this redirects your old URLs automatically — no link rot.</div>
              </div>

              <div className="s-field">
                <div className="s-field-label">Accent colour</div>
                <div className="s-color-row">
                  {BRAND_COLORS.map(color => (
                    <button
                      key={color}
                      className={`s-color-swatch ${profile.accent_color === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => {
                        setProfile(p => ({ ...p, accent_color: color }))
                        saveProfile('brand', { ...profile, accent_color: color })
                      }}
                      title={color}
                    />
                  ))}
                  {/* Custom hex picker */}
                  <label style={{ position: 'relative', cursor: 'pointer' }} title="Custom colour">
                    <div
                      className={`s-color-swatch ${!BRAND_COLORS.includes(profile.accent_color) ? 'selected' : ''}`}
                      style={{
                        background: BRAND_COLORS.includes(profile.accent_color) ? '#e6e8eb' : profile.accent_color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, color: '#5a6470'
                      }}
                    >
                      {BRAND_COLORS.includes(profile.accent_color) ? '+' : ''}
                    </div>
                    <input
                      type="color"
                      value={profile.accent_color}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      onChange={e => {
                        const c = e.target.value
                        setProfile(p => ({ ...p, accent_color: c }))
                      }}
                      onBlur={() => saveProfile('brand')}
                    />
                  </label>
                </div>
              </div>

              <div className="s-field">
                <div className="s-field-label">Custom domain<span className="s-field-optional">Pro &amp; above</span></div>
                <div className="s-domain-upsell">
                  <div className="s-domain-upsell-title">Want to use your own domain?</div>
                  <div className="s-domain-upsell-desc">
                    Connect a domain like <strong>bennett.ae</strong> or buy per-property URLs like <strong>4bedroomvillainmeadows.com</strong>.
                    SSL and DNS handled automatically.
                  </div>
                  <button className="s-btn s-btn-primary">Add custom domain</button>
                </div>
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Brand applied across all <strong style={{ color: 'var(--ink)' }}>7 live pages</strong> + portfolio</div>
              <button className="s-btn s-btn-primary" onClick={() => saveProfile('brand')} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── CONTACT ── */}
          <div className="s-sec-card" ref={contactRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Contact details</div>
                <div className="s-sec-card-sub">How buyers reach you. Powers the Call and WhatsApp buttons on every page.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">Phone (WhatsApp)<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.phone} onChange={set('phone')} onBlur={() => saveProfile('contact')} />
                </div>
                <div className="s-field">
                  <div className="s-field-label">Email<span className="s-field-required">required</span></div>
                  <input className="s-field-input" type="email" value={profile.email} onChange={set('email')} onBlur={() => saveProfile('contact')} />
                </div>
              </div>

              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">Available hours</div>
                  <input className="s-field-input" value={profile.available_hours} onChange={set('available_hours')} onBlur={() => saveProfile('contact')} />
                </div>
                <div className="s-field">
                  <div className="s-field-label">Time zone</div>
                  <select className="s-field-select" value={profile.timezone} onChange={set('timezone')} onBlur={() => saveProfile('contact')}>
                    {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Show "Call" button on pages</div>
                  <div className="s-toggle-row-desc">One-tap dial directly from your property page.</div>
                </div>
                <button className={`s-toggle ${profile.show_call ? 'on' : ''}`} onClick={toggle('show_call')} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Show "WhatsApp" button on pages</div>
                  <div className="s-toggle-row-desc">One-tap WhatsApp pre-filled with the property reference.</div>
                </div>
                <button className={`s-toggle ${profile.show_whatsapp ? 'on' : ''}`} onClick={toggle('show_whatsapp')} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Show "Book viewing" calendar</div>
                  <div className="s-toggle-row-desc">Embed your calendar so buyers can self-schedule. Requires Calendar integration.</div>
                </div>
                <button className={`s-toggle ${profile.show_calendar ? 'on' : ''}`} onClick={toggle('show_calendar')} />
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Your <strong style={{ color: 'var(--ink)' }}>142 leads</strong> arrived through these channels</div>
              <button className="s-btn s-btn-primary" onClick={() => saveProfile('contact')} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── LEAD NOTIFICATIONS ── */}
          <div className="s-sec-card" ref={notifRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Lead notifications</div>
                <div className="s-sec-card-sub">Configure how you receive lead alerts. We recommend leaving them all on.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">
                    Browser &amp; desktop push
                    <span className="s-notif-badge">Instant</span>
                  </div>
                  <div className="s-toggle-row-desc">Live notifications when you're logged in.</div>
                </div>
                <button className={`s-toggle ${profile.notif_push ? 'on' : ''}`} onClick={toggle('notif_push')} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Email summaries</div>
                  <div className="s-toggle-row-desc">
                    Full lead details delivered to <strong style={{ color: 'var(--ink)' }}>{profile.email || 'your email'}</strong>.
                  </div>
                </div>
                <button className={`s-toggle ${profile.notif_email ? 'on' : ''}`} onClick={toggle('notif_email')} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Daily digest email</div>
                  <div className="s-toggle-row-desc">Morning summary of overnight leads and page performance, 7am GST.</div>
                </div>
                <button className={`s-toggle ${profile.notif_daily_digest ? 'on' : ''}`} onClick={toggle('notif_daily_digest')} />
              </div>
            </div>
          </div>

          {/* ── PLAN & BILLING ── */}
          <div className="s-sec-card" ref={billingRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Plan &amp; billing</div>
                <div className="s-sec-card-sub">Your current subscription and usage. Volume-based pricing — pay only for what you use.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              <div className="s-plan-card">
                <div className="s-plan-card-left">
                  <div className="s-plan-card-icon">
                    <IconStar />
                  </div>
                  <div>
                    <div className="s-plan-card-name">Current plan</div>
                    <div className="s-plan-card-title">Pro · 10–19 properties</div>
                    <div className="s-plan-card-meta">As low as <strong>$5 per property</strong> · Includes 3 custom URLs</div>
                  </div>
                </div>
                <div className="s-plan-card-right">
                  <div className="s-plan-card-price">
                    <div className="s-plan-card-price-val">$100<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>/mo</span></div>
                    <div className="s-plan-card-price-sub">Next billed 15 Jun</div>
                  </div>
                  <button className="s-btn s-btn-outline">Change plan</button>
                </div>
              </div>

              <div className="s-usage-bar">
                <div className="s-usage-label">
                  <span><strong>7</strong> of 19 properties used</span>
                  <span>36% of plan limit</span>
                </div>
                <div className="s-usage-track">
                  <div className="s-usage-fill" style={{ width: '36%' }} />
                </div>
              </div>

              {/* Payment methods */}
              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Payment method
                </div>
                <div className="s-pay-row">
                  <div className="s-pay-icon visa">VISA</div>
                  <div className="s-pay-info">
                    <div className="s-pay-name">•••• •••• •••• 4242</div>
                    <div className="s-pay-meta">Expires 04/28 · Sarah Bennett</div>
                  </div>
                  <div className="s-pay-default">Default</div>
                  <button className="s-btn-ghost">Edit</button>
                </div>
                <div className="s-pay-row">
                  <div className="s-pay-icon mc">MC</div>
                  <div className="s-pay-info">
                    <div className="s-pay-name">•••• •••• •••• 8821</div>
                    <div className="s-pay-meta">Expires 11/27 · Backup</div>
                  </div>
                  <button className="s-btn-ghost">Edit</button>
                </div>
                <button className="s-btn s-btn-outline" style={{ marginTop: 8 }}>
                  <IconPlus />
                  Add payment method
                </button>
              </div>

              {/* Invoices */}
              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Recent invoices</div>
                  <button className="s-btn-ghost" style={{ fontSize: 12 }}>View all →</button>
                </div>
                <div className="s-invoice-row">
                  <div className="s-invoice-head">Invoice</div>
                  <div className="s-invoice-head">Amount</div>
                  <div className="s-invoice-head">Status</div>
                  <div className="s-invoice-head right">PDF</div>
                </div>
                {[
                  { label: 'May 2026 — Pro subscription', date: '15 May 2026', amount: '$100.00' },
                  { label: 'Apr 2026 — Pro subscription', date: '15 Apr 2026', amount: '$100.00' },
                  { label: 'Mar 2026 — Growth (4 properties)', date: '15 Mar 2026', amount: '$40.00' },
                ].map((inv, i) => (
                  <div key={i} className="s-invoice-row">
                    <div>
                      <div className="s-invoice-cell">{inv.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--quiet)', marginTop: 2 }}>{inv.date}</div>
                    </div>
                    <div className="s-invoice-cell">{inv.amount}</div>
                    <div><span className="s-invoice-paid">Paid</span></div>
                    <div className="s-invoice-cell right"><button className="s-invoice-link">Download</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── INTEGRATIONS ── */}
          <div className="s-sec-card" ref={integRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Integrations</div>
                <div className="s-sec-card-sub">Connect Agent Pages to the tools you already use.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              {/* WhatsApp */}
              <div className="s-integ-row">
                <div className="s-integ-icon whatsapp">
                  <svg viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" fill="#25D366"/>
                  </svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">WhatsApp Business <span className="s-integ-status connected">Connected</span></div>
                  <div className="s-integ-desc">Receive lead alerts, reply to leads, send page links directly from WhatsApp.</div>
                </div>
                <button className="s-btn s-btn-outline">Manage</button>
              </div>

              {/* Google */}
              <div className="s-integ-row">
                <div className="s-integ-icon google">
                  <svg viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Google Search Console <span className="s-integ-status connected">Connected</span></div>
                  <div className="s-integ-desc">Index pages instantly with Google and pull search performance into your analytics.</div>
                </div>
                <button className="s-btn s-btn-outline">Manage</button>
              </div>

              {/* Google Calendar */}
              <div className="s-integ-row">
                <div className="s-integ-icon calendar">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Google Calendar</div>
                  <div className="s-integ-desc">Let buyers self-book viewings directly from your property pages.</div>
                </div>
                <button className="s-btn s-btn-outline">Connect</button>
              </div>

              {/* Zapier */}
              <div className="s-integ-row">
                <div className="s-integ-icon zapier">
                  <svg viewBox="0 0 24 24" fill="#FF4A00"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Zapier</div>
                  <div className="s-integ-desc">Connect Agent Pages to 5,000+ apps. Trigger workflows from new leads or page events.</div>
                </div>
                <button className="s-btn s-btn-outline">Connect</button>
              </div>

              {/* Stripe */}
              <div className="s-integ-row">
                <div className="s-integ-icon stripe">
                  <svg viewBox="0 0 24 24" fill="#635bff">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.756 4.992 3.756 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.235 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Stripe</div>
                  <div className="s-integ-desc">Accept booking deposits or hold fees directly through your property pages.</div>
                </div>
                <button className="s-btn s-btn-outline">Connect</button>
              </div>
            </div>
          </div>

          {/* ── TEAM MEMBERS ── */}
          <div className="s-sec-card" ref={teamRef}>
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Team members</div>
                <div className="s-sec-card-sub">Invite team members to manage properties, view leads, or just see analytics.</div>
              </div>
              <button className="s-btn s-btn-primary">
                <IconPlus />
                Invite member
              </button>
            </div>
            <div className="s-sec-card-body">
              <div className="s-team-row">
                <div className="s-team-avatar">{avatarInitials}</div>
                <div className="s-team-info">
                  <div className="s-team-name">
                    {displayName} <span style={{ fontSize: 10, color: 'var(--quiet)', fontWeight: 500, marginLeft: 4 }}>(you)</span>
                  </div>
                  <div className="s-team-email">{profile.email}</div>
                </div>
                <div className="s-team-role">Owner</div>
              </div>
              <div className="s-team-row">
                <div className="s-team-avatar c2">AC</div>
                <div className="s-team-info">
                  <div className="s-team-name">Amir Chowdhury</div>
                  <div className="s-team-email">amir@bennett.ae</div>
                </div>
                <div className="s-team-role">Editor</div>
                <button className="s-btn-ghost">Manage</button>
              </div>
              <div className="s-team-row">
                <div className="s-team-avatar c3">LM</div>
                <div className="s-team-info">
                  <div className="s-team-name">Lina Morais</div>
                  <div className="s-team-email">lina@bennett.ae · invited 3 days ago</div>
                </div>
                <div className="s-team-role viewer">Viewer</div>
                <button className="s-btn-ghost">Manage</button>
              </div>
            </div>
          </div>

          {/* ── DANGER ZONE ── */}
          <div className="s-danger-card">
            <div className="s-danger-title">Close account</div>
            <div className="s-danger-desc">
              Closing your account permanently removes your properties, portfolio page, and lead history.
              All public URLs you've created will return 404. This can't be undone.
            </div>
            <button className="s-btn s-btn-danger">Close my account</button>
          </div>
        </div>
      </div>
    </div>
  )
}
