import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/settings.css'

// ── Brand colour palette (matches HTML design) ───────────────────────────────
const BRAND_COLORS = [
  { hex: '#2d5a4f', label: 'Emerald' },
  { hex: '#1f3a68', label: 'Navy' },
  { hex: '#6e2e3d', label: 'Ruby' },
  { hex: '#2c343d', label: 'Charcoal' },
  { hex: '#a14b2c', label: 'Brick' },
  { hex: '#5e6b3a', label: 'Olive' },
  { hex: '#1a2535', label: 'Midnight' },
]

// ── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`s-toggle${on ? ' on' : ''}`}
      aria-pressed={on}
    />
  )
}

// ── Saved pill ───────────────────────────────────────────────────────────────
function SavedPill({ text = 'Saved' }: { text?: string }) {
  return (
    <span className="s-saved-pill">
      <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
      {text}
    </span>
  )
}

// ── Profile interface ─────────────────────────────────────────────────────────
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
  slug: string
  phone: string
  email: string
  photo_url: string
  brokerage_logo_url: string
  push_alerts: boolean
  email_alerts: boolean
  show_call: boolean
  show_whatsapp: boolean
  show_calendar: boolean
}

// ── Main Settings component ───────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [activeLink, setActiveLink] = useState('identity')

  const [profile, setProfile] = useState<Profile>({
    first_name: '', last_name: '', role: '', tagline: '',
    brokerage_name: '', rera_number: '', orn: '',
    accent_color: '#2d5a4f', slug: '', phone: '', email: '',
    photo_url: '', brokerage_logo_url: '',
    push_alerts: true, email_alerts: true,
    show_call: true, show_whatsapp: true, show_calendar: false,
  })

  // Section refs
  const refIdentity = useRef<HTMLDivElement>(null)
  const refBrokerage = useRef<HTMLDivElement>(null)
  const refBrand = useRef<HTMLDivElement>(null)
  const refContact = useRef<HTMLDivElement>(null)
  const refNotifs = useRef<HTMLDivElement>(null)
  const refBilling = useRef<HTMLDivElement>(null)
  const refIntegrations = useRef<HTMLDivElement>(null)
  const refTeam = useRef<HTMLDivElement>(null)

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    identity: refIdentity,
    brokerage: refBrokerage,
    brand: refBrand,
    contact: refContact,
    notifs: refNotifs,
    billing: refBilling,
    integrations: refIntegrations,
    team: refTeam,
  }

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile(prev => ({
          ...prev,
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          role: data.role ?? '',
          tagline: data.tagline ?? '',
          brokerage_name: data.brokerage_name ?? '',
          rera_number: data.rera_number ?? '',
          orn: data.orn ?? '',
          accent_color: data.accent_color ?? '#2d5a4f',
          slug: data.slug ?? '',
          phone: data.phone ?? '',
          email: data.email ?? user.email ?? '',
          photo_url: data.photo_url ?? '',
          brokerage_logo_url: data.brokerage_logo_url ?? '',
          push_alerts: data.push_alerts ?? true,
          email_alerts: data.email_alerts ?? true,
          show_call: data.show_call ?? true,
          show_whatsapp: data.show_whatsapp ?? true,
          show_calendar: data.show_calendar ?? false,
        }))
      }
      setLoading(false)
    })
  }, [user])

  function up(k: keyof Profile, v: unknown) {
    setProfile(p => ({ ...p, [k]: v }))
  }

  async function save(section: string, fields: Partial<Profile>) {
    if (!user) return
    setSaving(section)
    await supabase.from('profiles').update(fields).eq('id', user.id)
    setSaving(null)
    setSavedSection(section)
    setTimeout(() => setSavedSection(null), 2500)
  }

  function scrollTo(id: string) {
    setActiveLink(id)
    const el = sectionRefs[id]?.current
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function uploadPhoto(file: File, field: 'photo_url' | 'brokerage_logo_url', folder: string) {
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${folder}/${user.id}.${ext}`
    const { error } = await supabase.storage.from('agent-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('agent-assets').getPublicUrl(path)
      up(field, publicUrl)
    }
  }

  function triggerUpload(field: 'photo_url' | 'brokerage_logo_url', folder: string) {
    const inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = 'image/*'
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) uploadPhoto(f, field, folder)
    }
    inp.click()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Your Account'
  const initials = profile.first_name && profile.last_name
    ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
    : (user?.email?.substring(0, 2) ?? 'U').toUpperCase()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #2d5a4f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="settings-root">
      <div className="s-page">

        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <aside className="s-side">
          <div className="s-side-eyebrow">Settings</div>
          <div className="s-side-title">{displayName}</div>

          {/* Account */}
          <div className="s-side-group">
            <div className="s-side-group-label">Account</div>
            {[
              { id: 'identity', label: 'Profile & branding', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" /></svg> },
              { id: 'brokerage', label: 'Brokerage & compliance', icon: <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg> },
              { id: 'brand', label: 'Brand & URL', icon: <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg> },
            ].map(({ id, label, icon }) => (
              <button key={id} type="button" className={`s-side-link${activeLink === id ? ' active' : ''}`} onClick={() => scrollTo(id)}>
                <svg viewBox="0 0 24 24">{icon.props.children}</svg>
                {label}
              </button>
            ))}
          </div>

          {/* Billing */}
          <div className="s-side-group">
            <div className="s-side-group-label">Billing</div>
            <button type="button" className={`s-side-link${activeLink === 'billing' ? ' active' : ''}`} onClick={() => scrollTo('billing')}>
              <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
              Plan &amp; billing
            </button>
          </div>

          {/* Notifications */}
          <div className="s-side-group">
            <div className="s-side-group-label">Notifications</div>
            <button type="button" className={`s-side-link${activeLink === 'notifs' ? ' active' : ''}`} onClick={() => scrollTo('notifs')}>
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              Lead alerts
            </button>
          </div>

          {/* Workspace */}
          <div className="s-side-group">
            <div className="s-side-group-label">Workspace</div>
            <button type="button" className={`s-side-link${activeLink === 'team' ? ' active' : ''}`} onClick={() => scrollTo('team')}>
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
              Team members
            </button>
            <button type="button" className={`s-side-link${activeLink === 'integrations' ? ' active' : ''}`} onClick={() => scrollTo('integrations')}>
              <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
              Integrations
            </button>
            <button type="button" className={`s-side-link${activeLink === 'contact' ? ' active' : ''}`} onClick={() => scrollTo('contact')}>
              <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
              Contact details
            </button>
          </div>

          {/* Other */}
          <div className="s-side-group">
            <div className="s-side-group-label">Other</div>
            <button type="button" className="s-side-link" onClick={() => navigate('/settings/domain')}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
              Domain settings
            </button>
            <button type="button" className="s-side-link danger" onClick={handleSignOut}>
              <svg viewBox="0 0 24 24"><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /></svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        <div className="s-content">
          <div className="s-content-head">
            <div className="s-content-eyebrow">Account</div>
            <h1 className="s-content-title">Profile &amp; branding</h1>
            <p className="s-content-sub">The agent details and brand styling that appear on every property page you publish. Changes here update across all your pages instantly.</p>
          </div>

          {/* ── IDENTITY ──────────────────────────────────────────────── */}
          <div ref={refIdentity} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Identity</div>
                <div className="s-sec-card-sub">Your photo, name, and role. Appears in the agent block on every property page.</div>
              </div>
              {savedSection === 'identity' && <SavedPill text="Synced" />}
            </div>
            <div className="s-sec-card-body">
              {/* Photo row */}
              <div className="s-photo-row">
                {profile.photo_url
                  ? <img src={profile.photo_url} alt="Profile" className="s-photo-preview" />
                  : <div className="s-photo-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#a89880' }}>👤</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="s-photo-name">{profile.photo_url ? 'Profile photo' : 'No photo uploaded'}</div>
                  <div className="s-photo-meta">Square JPG or PNG, max 5 MB</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" className="s-btn s-btn-outline" onClick={() => triggerUpload('photo_url', 'avatars')}>Replace</button>
                  {profile.photo_url && <button type="button" className="s-btn s-btn-danger" onClick={() => up('photo_url', '')}>Remove</button>}
                </div>
              </div>

              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">First name<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.first_name} onChange={e => up('first_name', e.target.value)} placeholder="Sarah" />
                </div>
                <div className="s-field">
                  <div className="s-field-label">Last name<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.last_name} onChange={e => up('last_name', e.target.value)} placeholder="Bennett" />
                </div>
              </div>

              <div className="s-field">
                <div className="s-field-label">Role / title<span className="s-field-optional">optional</span></div>
                <input className="s-field-input" value={profile.role} onChange={e => up('role', e.target.value)} placeholder="Senior Property Consultant" />
              </div>

              <div className="s-field">
                <div className="s-field-label">Tagline<span className="s-field-optional">optional</span></div>
                <input
                  className="s-field-input"
                  value={profile.tagline}
                  onChange={e => up('tagline', e.target.value)}
                  placeholder="Properties presented properly. Buyers handled personally."
                />
                <div className="s-field-hint">Shown on your portfolio page (active once you have 3 properties live).</div>
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Changes apply across all live property pages</div>
              <button
                type="button"
                className="s-btn s-btn-primary"
                disabled={saving === 'identity'}
                onClick={() => save('identity', {
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  role: profile.role,
                  tagline: profile.tagline,
                  photo_url: profile.photo_url,
                })}
              >
                {saving === 'identity' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── BROKERAGE & COMPLIANCE ────────────────────────────────── */}
          <div ref={refBrokerage} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Brokerage &amp; compliance</div>
                <div className="s-sec-card-sub">RERA-verified credentials. Shown in the footer of every page for regulatory compliance.</div>
              </div>
              {savedSection === 'brokerage' && <SavedPill />}
            </div>
            <div className="s-sec-card-body">
              <div className="s-field">
                <div className="s-field-label">Brokerage name<span className="s-field-required">required</span></div>
                <input className="s-field-input" value={profile.brokerage_name} onChange={e => up('brokerage_name', e.target.value)} placeholder="Bennett & Partners" />
              </div>

              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">RERA agent number<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.rera_number} onChange={e => up('rera_number', e.target.value)} placeholder="12847" />
                </div>
                <div className="s-field">
                  <div className="s-field-label">ORN (brokerage)<span className="s-field-optional">optional</span></div>
                  <input className="s-field-input" value={profile.orn} onChange={e => up('orn', e.target.value)} placeholder="84219" />
                </div>
              </div>

              <div className="s-field">
                <div className="s-field-label">Brokerage logo<span className="s-field-optional">optional</span></div>
                <div className="s-logo-row">
                  <div className="s-logo-preview">
                    {profile.brokerage_logo_url
                      ? <img src={profile.brokerage_logo_url} alt="Brokerage logo" />
                      : <span>{profile.brokerage_name ? profile.brokerage_name.substring(0, 3).toUpperCase() : 'B&P'}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                      {profile.brokerage_logo_url ? 'Brokerage logo uploaded' : 'No logo uploaded'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Transparent PNG recommended</div>
                  </div>
                  <button type="button" className="s-btn s-btn-outline" onClick={() => triggerUpload('brokerage_logo_url', 'logos')}>Replace</button>
                </div>
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">RERA verified · last checked recently</div>
              <button
                type="button"
                className="s-btn s-btn-primary"
                disabled={saving === 'brokerage'}
                onClick={() => save('brokerage', {
                  brokerage_name: profile.brokerage_name,
                  rera_number: profile.rera_number,
                  orn: profile.orn,
                  brokerage_logo_url: profile.brokerage_logo_url,
                })}
              >
                {saving === 'brokerage' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── BRAND & URL ───────────────────────────────────────────── */}
          <div ref={refBrand} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Brand &amp; URL</div>
                <div className="s-sec-card-sub">Your accent colour and URL handle. Used across every page you publish.</div>
              </div>
              {savedSection === 'brand' && <SavedPill />}
            </div>
            <div className="s-sec-card-body">
              {/* URL handle */}
              <div className="s-field">
                <div className="s-field-label">URL handle<span className="s-field-required">required</span></div>
                <div className="s-url-input-wrap">
                  <span className="s-url-prefix">agentpages.io/</span>
                  <input
                    className="s-url-input"
                    value={profile.slug}
                    onChange={e => up('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-name"
                  />
                  <button type="button" className="s-btn-ghost" style={{ fontSize: 11 }}>Change</button>
                </div>
                <div className="s-field-hint">Changing this redirects your old URLs automatically — no link rot.</div>
              </div>

              {/* Accent colour */}
              <div className="s-field">
                <div className="s-field-label">Accent colour</div>
                <div className="s-color-row">
                  {BRAND_COLORS.map(c => (
                    <div
                      key={c.hex}
                      className={`s-color-swatch${profile.accent_color === c.hex ? ' selected' : ''}`}
                      style={{ background: c.hex }}
                      title={c.label}
                      onClick={() => up('accent_color', c.hex)}
                    />
                  ))}
                  {/* Custom hex */}
                  <input
                    type="color"
                    title="Custom colour"
                    value={BRAND_COLORS.some(c => c.hex === profile.accent_color) ? '#2d5a4f' : (profile.accent_color || '#2d5a4f')}
                    onChange={e => up('accent_color', e.target.value)}
                    style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid var(--line)', cursor: 'pointer', padding: 2, background: '#fff' }}
                  />
                </div>
              </div>

              {/* Custom domain upsell */}
              <div className="s-field">
                <div className="s-field-label">Custom domain<span className="s-field-optional">Pro &amp; above</span></div>
                <div className="s-domain-upsell">
                  <div className="s-domain-upsell-title">Want to use your own domain?</div>
                  <div className="s-domain-upsell-desc">
                    Connect a domain like <strong>bennett.ae</strong> or buy per-property URLs like <strong>4bedroomvillainmeadows.com</strong>. SSL and DNS handled automatically.
                  </div>
                  <button type="button" className="s-btn s-btn-primary" onClick={() => navigate('/settings/domain')}>Add custom domain</button>
                </div>
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Brand applied across all live pages + portfolio</div>
              <button
                type="button"
                className="s-btn s-btn-primary"
                disabled={saving === 'brand'}
                onClick={() => save('brand', { accent_color: profile.accent_color, slug: profile.slug })}
              >
                {saving === 'brand' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── CONTACT DETAILS ───────────────────────────────────────── */}
          <div ref={refContact} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Contact details</div>
                <div className="s-sec-card-sub">How buyers reach you. Powers the Call and WhatsApp buttons on every page.</div>
              </div>
              {savedSection === 'contact' && <SavedPill />}
            </div>
            <div className="s-sec-card-body">
              <div className="s-field-row">
                <div className="s-field">
                  <div className="s-field-label">Phone (WhatsApp)<span className="s-field-required">required</span></div>
                  <input className="s-field-input" value={profile.phone} onChange={e => up('phone', e.target.value)} placeholder="+971 50 123 4567" />
                </div>
                <div className="s-field">
                  <div className="s-field-label">Email<span className="s-field-required">required</span></div>
                  <input className="s-field-input" type="email" value={profile.email} onChange={e => up('email', e.target.value)} placeholder="you@agency.ae" />
                </div>
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Show "Call" button on pages</div>
                  <div className="s-toggle-row-desc">One-tap dial directly from your property page.</div>
                </div>
                <Toggle on={profile.show_call} onToggle={() => up('show_call', !profile.show_call)} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Show "WhatsApp" button on pages</div>
                  <div className="s-toggle-row-desc">One-tap WhatsApp pre-filled with the property reference.</div>
                </div>
                <Toggle on={profile.show_whatsapp} onToggle={() => up('show_whatsapp', !profile.show_whatsapp)} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Show "Book viewing" calendar</div>
                  <div className="s-toggle-row-desc">Embed your calendar so buyers can self-schedule. Requires Calendar integration.</div>
                </div>
                <Toggle on={profile.show_calendar} onToggle={() => up('show_calendar', !profile.show_calendar)} />
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Your leads arrived through these channels</div>
              <button
                type="button"
                className="s-btn s-btn-primary"
                disabled={saving === 'contact'}
                onClick={() => save('contact', {
                  phone: profile.phone,
                  email: profile.email,
                  show_call: profile.show_call,
                  show_whatsapp: profile.show_whatsapp,
                  show_calendar: profile.show_calendar,
                })}
              >
                {saving === 'contact' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── LEAD NOTIFICATIONS ────────────────────────────────────── */}
          <div ref={refNotifs} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Lead notifications</div>
                <div className="s-sec-card-sub">Stay on top of every enquiry. We recommend leaving them all on.</div>
              </div>
              {savedSection === 'notifs' && <SavedPill />}
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
                <Toggle on={profile.push_alerts} onToggle={() => up('push_alerts', !profile.push_alerts)} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Email summaries</div>
                  <div className="s-toggle-row-desc">
                    Full lead details delivered to <strong style={{ color: 'var(--ink)' }}>{profile.email || 'your email'}</strong>.
                  </div>
                </div>
                <Toggle on={profile.email_alerts} onToggle={() => up('email_alerts', !profile.email_alerts)} />
              </div>

              <div className="s-toggle-row">
                <div className="s-toggle-row-text">
                  <div className="s-toggle-row-title">Daily digest email</div>
                  <div className="s-toggle-row-desc">Morning summary of overnight leads and page performance, 7am GST.</div>
                </div>
                <Toggle on={false} onToggle={() => {}} />
              </div>
            </div>
            <div className="s-sec-card-foot">
              <div className="s-sec-card-foot-text">Save to update your notification preferences</div>
              <button
                type="button"
                className="s-btn s-btn-primary"
                disabled={saving === 'notifs'}
                onClick={() => save('notifs', { push_alerts: profile.push_alerts, email_alerts: profile.email_alerts })}
              >
                {saving === 'notifs' ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>

          {/* ── PLAN & BILLING ────────────────────────────────────────── */}
          <div ref={refBilling} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Plan &amp; billing</div>
                <div className="s-sec-card-sub">Your current subscription and usage. Volume-based pricing — pay only for what you use.</div>
              </div>
            </div>
            <div className="s-sec-card-body">
              {/* Plan card */}
              <div className="s-plan-card">
                <div className="s-plan-card-left">
                  <div className="s-plan-card-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z" /></svg>
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
                  <button type="button" className="s-btn s-btn-outline">Change plan</button>
                </div>
              </div>

              {/* Usage bar */}
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
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Payment method</div>
                <div className="s-pay-row">
                  <div className="s-pay-icon visa">VISA</div>
                  <div className="s-pay-info">
                    <div className="s-pay-name">•••• •••• •••• 4242</div>
                    <div className="s-pay-meta">Expires 04/28 · Default</div>
                  </div>
                  <span className="s-pay-default">Default</span>
                  <button type="button" className="s-btn-ghost">Edit</button>
                </div>
                <div className="s-pay-row">
                  <div className="s-pay-icon mc">MC</div>
                  <div className="s-pay-info">
                    <div className="s-pay-name">•••• •••• •••• 8821</div>
                    <div className="s-pay-meta">Expires 11/27 · Backup</div>
                  </div>
                  <button type="button" className="s-btn-ghost">Edit</button>
                </div>
                <button type="button" className="s-btn s-btn-outline" style={{ marginTop: 8 }}>
                  <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  Add payment method
                </button>
              </div>

              {/* Recent invoices */}
              <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Recent invoices</div>
                  <button type="button" className="s-btn-ghost" style={{ fontSize: 12 }}>View all →</button>
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
                    <div className="s-invoice-cell right"><button type="button" className="s-invoice-link">Download</button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── INTEGRATIONS ──────────────────────────────────────────── */}
          <div ref={refIntegrations} className="s-sec-card">
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
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                  </svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">WhatsApp Business <span className="s-integ-status connected">Connected</span></div>
                  <div className="s-integ-desc">Receive lead alerts, reply to leads, send page links directly from WhatsApp.</div>
                </div>
                <button type="button" className="s-btn s-btn-outline">Manage</button>
              </div>

              {/* Google Search Console */}
              <div className="s-integ-row">
                <div className="s-integ-icon google">
                  <svg viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Google Search Console <span className="s-integ-status connected">Connected</span></div>
                  <div className="s-integ-desc">Index pages instantly with Google and pull search performance into your analytics.</div>
                </div>
                <button type="button" className="s-btn s-btn-outline">Manage</button>
              </div>

              {/* Google Calendar */}
              <div className="s-integ-row">
                <div className="s-integ-icon calendar">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Google Calendar</div>
                  <div className="s-integ-desc">Let buyers self-book viewings directly from your property pages.</div>
                </div>
                <button type="button" className="s-btn s-btn-outline">Connect</button>
              </div>

              {/* Zapier */}
              <div className="s-integ-row">
                <div className="s-integ-icon zapier">
                  <svg viewBox="0 0 24 24" fill="#FF4A00"><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Zapier</div>
                  <div className="s-integ-desc">Connect Agent Pages to 5,000+ apps. Trigger workflows from new leads or page events.</div>
                </div>
                <button type="button" className="s-btn s-btn-outline">Connect</button>
              </div>

              {/* Stripe */}
              <div className="s-integ-row">
                <div className="s-integ-icon stripe">
                  <svg viewBox="0 0 24 24" fill="#635bff">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.756 4.992 3.756 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.235 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                  </svg>
                </div>
                <div className="s-integ-info">
                  <div className="s-integ-name">Stripe</div>
                  <div className="s-integ-desc">Accept booking deposits or hold fees directly through your property pages.</div>
                </div>
                <button type="button" className="s-btn s-btn-outline">Connect</button>
              </div>
            </div>
          </div>

          {/* ── TEAM MEMBERS ──────────────────────────────────────────── */}
          <div ref={refTeam} className="s-sec-card">
            <div className="s-sec-card-head">
              <div className="s-sec-card-head-text">
                <div className="s-sec-card-title">Team members</div>
                <div className="s-sec-card-sub">Invite team members to manage properties, view leads, or just see analytics.</div>
              </div>
              <button type="button" className="s-btn s-btn-primary">
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                Invite member
              </button>
            </div>
            <div className="s-sec-card-body">
              {/* Owner row */}
              <div className="s-team-row">
                <div className="s-team-avatar">{initials}</div>
                <div className="s-team-info">
                  <div className="s-team-name">
                    {displayName}
                    <span style={{ fontSize: 10, color: 'var(--quiet)', fontWeight: 500, marginLeft: 4 }}>(you)</span>
                  </div>
                  <div className="s-team-email">{profile.email || user?.email}</div>
                </div>
                <div className="s-team-role">Owner</div>
              </div>

              {/* Example members */}
              <div className="s-team-row">
                <div className="s-team-avatar c2">AC</div>
                <div className="s-team-info">
                  <div className="s-team-name">Amir Chowdhury</div>
                  <div className="s-team-email">amir@agency.ae</div>
                </div>
                <div className="s-team-role">Editor</div>
                <button type="button" className="s-btn-ghost">Manage</button>
              </div>

              <div className="s-team-row">
                <div className="s-team-avatar c3">LM</div>
                <div className="s-team-info">
                  <div className="s-team-name">Lina Morais</div>
                  <div className="s-team-email">lina@agency.ae · invited 3 days ago</div>
                </div>
                <div className="s-team-role viewer">Viewer</div>
                <button type="button" className="s-btn-ghost">Manage</button>
              </div>
            </div>
          </div>

          {/* ── DANGER ZONE ───────────────────────────────────────────── */}
          <div className="s-danger-card">
            <div className="s-danger-title">Close account</div>
            <div className="s-danger-desc">
              Closing your account permanently removes your properties, portfolio page, and lead history. All public URLs you've created will return 404. This can't be undone.
            </div>
            <button
              type="button"
              className="s-btn s-btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to close your account? This cannot be undone.')) {
                  // handle account closure
                }
              }}
            >
              Close my account
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
