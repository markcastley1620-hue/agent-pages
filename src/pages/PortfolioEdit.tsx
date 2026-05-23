import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/portfolio-editor.css'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  tagline: string | null
  bio: string | null
  rera_number: string | null
  years_in_dubai: string | null
  deals_closed: string | null
  total_volume: string | null
  phone: string | null
  email: string | null
  available_hours: string | null
  specialisms: string[] | null
  languages: string[] | null
  price_range_from: string | null
  price_range_to: string | null
  show_enquiry_form: boolean | null
  show_whatsapp: boolean | null
  portfolio_theme: string | null
  accent_color: string | null
  slug: string | null
  photo_url: string | null
  cover_url: string | null
}

interface FeaturedProperty {
  id: string
  title: string
  community: string | null
  asking_price_aed: number | null
  status: string
}

function formatPrice(p: number | null): string {
  if (!p) return 'POR'
  if (p >= 1_000_000) return `AED ${(p / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  return `AED ${p.toLocaleString()}`
}

function getUserInitials(email: string | undefined, firstName?: string | null, lastName?: string | null): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (firstName) return firstName.substring(0, 2).toUpperCase()
  if (!email) return 'U'
  const parts = email.split('@')[0].split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return email.substring(0, 2).toUpperCase()
}

const LISTING_CLASSES = ['l1', 'l2', 'l3']

export default function PortfolioEdit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [properties, setProperties] = useState<FeaturedProperty[]>([])
  const [featured, setFeatured] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [specialismInput, setSpecialismInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('properties').select('id,title,community,asking_price_aed,status').eq('agent_id', user.id).eq('status', 'live'),
    ]).then(([{ data: profileData }, { data: propsData }]) => {
      if (profileData) setProfile(profileData as Profile)
      setProperties((propsData as FeaturedProperty[]) ?? [])
      setLoading(false)
    })
  }, [user])

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function toggleFeatured(id: string) {
    setFeatured(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({ ...profile, id: user.id })
    setSaving(false)
    if (!error) setSavedAt(new Date())
  }

  async function publish() {
    await saveProfile()
    if (profile.slug) navigate(`/${profile.slug}`)
  }

  function removeSpecialism(s: string) {
    updateField('specialisms', (profile.specialisms ?? []).filter(x => x !== s))
  }
  function addSpecialism(s: string) {
    if (!s.trim()) return
    updateField('specialisms', [...(profile.specialisms ?? []), s.trim()])
    setSpecialismInput('')
  }
  function removeLanguage(l: string) {
    updateField('languages', (profile.languages ?? []).filter(x => x !== l))
  }
  function addLanguage(l: string) {
    if (!l.trim()) return
    updateField('languages', [...(profile.languages ?? []), l.trim()])
    setLanguageInput('')
  }

  const initials = getUserInitials(user?.email, profile.first_name, profile.last_name)
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Your Name'
  const slug = profile.slug ?? 'your-portfolio'

  // Featured listings for preview (up to 3)
  const previewListings = properties.filter(p => featured.has(p.id) || featured.size === 0).slice(0, 3)

  if (loading) {
    return (
      <div className="portfolio-editor-page">
        <div className="loading-state"><div className="loading-spinner" /></div>
      </div>
    )
  }

  const tabs = ['About you', 'Properties', 'Theme', 'SEO']
  const tabIcons = [
    <svg key="about" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>,
    <svg key="props" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21v-8h6v8"/></svg>,
    <svg key="theme" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33"/></svg>,
    <svg key="seo" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>,
  ]

  return (
    <div className="portfolio-editor-page">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-logo">a</div>
            <div className="topbar-name">Agent Pages</div>
          </div>
          <div className="topbar-crumb">
            <Link to="/portfolio/edit">Portfolio</Link>
            <span className="topbar-crumb-sep">/</span>
            <span className="topbar-crumb-current">Edit</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-status">Live</div>
          {savedAt && (
            <div className="topbar-save-state">
              <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Saved {Math.round((Date.now() - savedAt.getTime()) / 1000)}s ago</span>
            </div>
          )}
          {profile.slug && (
            <a className="btn btn-outline" href={`/${profile.slug}`} target="_blank" rel="noreferrer">
              View live
            </a>
          )}
          <button className="btn btn-primary" onClick={publish} disabled={saving}>
            {saving ? 'Saving…' : 'Publish changes'}
          </button>
        </div>
      </div>

      {/* SPLIT */}
      <div className="split">
        {/* EDITOR */}
        <div className="editor">
          <div className="editor-head">
            <div className="editor-eyebrow">Portfolio editor</div>
            <h1 className="editor-title">Your portfolio page</h1>
            <p className="editor-sub">
              Lives at agentpages.io/<strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{slug}</strong>
            </p>
          </div>

          <div className="editor-tabs">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                className={`editor-tab${activeTab === i ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tabIcons[i]}
                {tab}
              </button>
            ))}
          </div>

          <div className="editor-body">
            {/* TAB 0: About you */}
            {activeTab === 0 && (
              <>
                <div className="editor-section">
                  <div className="editor-section-title">Identity</div>

                  <div className="field">
                    <div className="field-label">
                      Profile photo
                      <span className="field-required">required</span>
                    </div>
                    <div className="photo-up">
                      <div className={`photo-up-preview${profile.photo_url ? ' has-image' : ''}`}>
                        {profile.photo_url ? (
                          <img src={profile.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : initials}
                      </div>
                      <div className="photo-up-text">
                        <div className="photo-up-title">{profile.photo_url ? 'Photo uploaded' : 'No photo uploaded'}</div>
                        <div className="photo-up-hint">JPG or PNG · square works best · min 400×400</div>
                      </div>
                      <div className="photo-up-actions">
                        <button className="photo-up-btn">Upload</button>
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <div className="field-label">
                      Cover photo
                      <span className="field-optional">optional</span>
                    </div>
                    <div className="cover-up">
                      <div className="cover-up-image" style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover' } : undefined} />
                      <div className="cover-up-actions">
                        <div className="cover-up-meta">{profile.cover_url ? 'Cover photo set' : 'No cover photo'}</div>
                        <div className="cover-up-btns">
                          <button className="photo-up-btn">Replace</button>
                          {profile.cover_url && (
                            <button className="photo-up-btn danger" onClick={() => updateField('cover_url', null)}>Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <div className="field-label">
                        First name
                        <span className="field-required">required</span>
                      </div>
                      <input
                        className="field-input"
                        value={profile.first_name ?? ''}
                        onChange={e => updateField('first_name', e.target.value)}
                        placeholder="Sarah"
                      />
                    </div>
                    <div className="field">
                      <div className="field-label">
                        Last name
                        <span className="field-required">required</span>
                      </div>
                      <input
                        className="field-input"
                        value={profile.last_name ?? ''}
                        onChange={e => updateField('last_name', e.target.value)}
                        placeholder="Bennett"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <div className="field-label">
                      Tagline
                      <span className="field-optional">recommended</span>
                    </div>
                    <input
                      className="field-input"
                      value={profile.tagline ?? ''}
                      onChange={e => updateField('tagline', e.target.value)}
                      placeholder="Properties presented properly. Buyers handled personally."
                    />
                    <div className="field-hint">Sits under your name on the hero. Keep it punchy.</div>
                  </div>

                  <div className="field">
                    <div className="field-label">
                      RERA number
                      <span className="field-required">required</span>
                    </div>
                    <input
                      className="field-input"
                      value={profile.rera_number ?? ''}
                      onChange={e => updateField('rera_number', e.target.value)}
                      placeholder="12847"
                    />
                    <div className="field-hint">Required for compliance — shown discreetly in the footer.</div>
                  </div>
                </div>

                <div className="editor-section">
                  <div className="editor-section-title">About you</div>

                  <div className="field">
                    <div className="field-label">
                      Bio
                      <span className="field-counter">{(profile.bio ?? '').length} / 600</span>
                    </div>
                    <textarea
                      className="field-textarea"
                      rows={6}
                      maxLength={600}
                      value={profile.bio ?? ''}
                      onChange={e => updateField('bio', e.target.value)}
                      placeholder="Tell buyers about yourself..."
                    />
                    <div className="field-hint">3 short paragraphs work best. Buyers read this in under 30 seconds.</div>
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <div className="field-label">Years in Dubai</div>
                      <input
                        className="field-input"
                        value={profile.years_in_dubai ?? ''}
                        onChange={e => updateField('years_in_dubai', e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div className="field">
                      <div className="field-label">Deals closed</div>
                      <input
                        className="field-input"
                        value={profile.deals_closed ?? ''}
                        onChange={e => updateField('deals_closed', e.target.value)}
                        placeholder="127+"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <div className="field-label">
                      Total volume
                      <span className="field-optional">optional</span>
                    </div>
                    <input
                      className="field-input"
                      value={profile.total_volume ?? ''}
                      onChange={e => updateField('total_volume', e.target.value)}
                      placeholder="AED 2.4B"
                    />
                    <div className="field-hint">Shown as a stat in your hero strip. Leave blank to hide.</div>
                  </div>
                </div>

                <div className="editor-section">
                  <div className="editor-section-title">Specialisms &amp; languages</div>

                  <div className="field">
                    <div className="field-label">Specialisms</div>
                    <div className="chip-input">
                      {(profile.specialisms ?? []).map(s => (
                        <span key={s} className="chip">
                          {s}
                          <button className="chip-remove" onClick={() => removeSpecialism(s)}>
                            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </span>
                      ))}
                      <input
                        className="chip-input-text"
                        placeholder="Add another..."
                        value={specialismInput}
                        onChange={e => setSpecialismInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            addSpecialism(specialismInput)
                          }
                        }}
                      />
                    </div>
                    <div className="field-hint">Communities or specialities. Helps with Google + AI ranking.</div>
                  </div>

                  <div className="field">
                    <div className="field-label">Languages</div>
                    <div className="chip-input">
                      {(profile.languages ?? []).map(l => (
                        <span key={l} className="chip">
                          {l}
                          <button className="chip-remove" onClick={() => removeLanguage(l)}>
                            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </span>
                      ))}
                      <input
                        className="chip-input-text"
                        placeholder="Add another..."
                        value={languageInput}
                        onChange={e => setLanguageInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            addLanguage(languageInput)
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <div className="field-label">Price range from</div>
                      <input
                        className="field-input"
                        value={profile.price_range_from ?? ''}
                        onChange={e => updateField('price_range_from', e.target.value)}
                        placeholder="AED 3M"
                      />
                    </div>
                    <div className="field">
                      <div className="field-label">Price range to</div>
                      <input
                        className="field-input"
                        value={profile.price_range_to ?? ''}
                        onChange={e => updateField('price_range_to', e.target.value)}
                        placeholder="AED 80M"
                      />
                    </div>
                  </div>
                </div>

                <div className="editor-section">
                  <div className="editor-section-title">Contact &amp; lead capture</div>

                  <div className="field">
                    <div className="field-label">
                      Phone (WhatsApp)
                      <span className="field-required">required</span>
                    </div>
                    <input
                      className="field-input"
                      value={profile.phone ?? ''}
                      onChange={e => updateField('phone', e.target.value)}
                      placeholder="+971 50 123 4567"
                    />
                  </div>

                  <div className="field">
                    <div className="field-label">
                      Email
                      <span className="field-required">required</span>
                    </div>
                    <input
                      className="field-input"
                      value={profile.email ?? user?.email ?? ''}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="field">
                    <div className="field-label">
                      Available hours
                      <span className="field-optional">optional</span>
                    </div>
                    <input
                      className="field-input"
                      value={profile.available_hours ?? ''}
                      onChange={e => updateField('available_hours', e.target.value)}
                      placeholder="Daily, 9am – 8pm GST"
                    />
                    <div className="field-hint">Shown next to your phone number on the contact section.</div>
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-row-text">
                      <div className="toggle-row-title">Show enquiry form</div>
                      <div className="toggle-row-desc">Lets buyers send you a detailed enquiry from your portfolio page.</div>
                    </div>
                    <div
                      className={`toggle${profile.show_enquiry_form !== false ? ' on' : ''}`}
                      onClick={() => updateField('show_enquiry_form', profile.show_enquiry_form === false ? true : false)}
                    />
                  </div>

                  <div className="toggle-row">
                    <div className="toggle-row-text">
                      <div className="toggle-row-title">Show WhatsApp button</div>
                      <div className="toggle-row-desc">One-tap WhatsApp from the contact section.</div>
                    </div>
                    <div
                      className={`toggle${profile.show_whatsapp !== false ? ' on' : ''}`}
                      onClick={() => updateField('show_whatsapp', profile.show_whatsapp === false ? true : false)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB 1: Properties */}
            {activeTab === 1 && (
              <div className="editor-section">
                <div className="editor-section-title">Featured properties</div>
                <div className="field">
                  <div className="field-label">Which properties to feature?</div>
                  <div className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
                    Currently showing <strong>{properties.length} live properties</strong>. Click to toggle. Untick to hide from your portfolio.
                  </div>

                  {properties.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                      No live properties yet.{' '}
                      <Link to="/properties/new" style={{ color: 'var(--accent)' }}>Add one →</Link>
                    </p>
                  ) : (
                    properties.map((prop, idx) => {
                      const isSelected = featured.size === 0 || featured.has(prop.id)
                      const thumbGrad = ['linear-gradient(135deg,#2d3e54,#c9a872)', 'linear-gradient(135deg,#4a5d6b,#2c3a47)', 'linear-gradient(135deg,#c4ad8a,#8b7456)', 'linear-gradient(135deg,#5a7d8b,#34505f)', 'linear-gradient(135deg,#d4c9b8,#a89880)'][idx % 5]
                      return (
                        <div
                          key={prop.id}
                          className={`prop-select-row${isSelected ? ' selected' : ''}`}
                          onClick={() => toggleFeatured(prop.id)}
                        >
                          <div className="prop-select-check">
                            <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                          </div>
                          <div className="prop-select-thumb" style={{ background: thumbGrad }} />
                          <div className="prop-select-info">
                            <div className="prop-select-name">{prop.title}</div>
                            <div className="prop-select-meta">
                              {prop.community ?? ''}{prop.community ? ' · ' : ''}{formatPrice(prop.asking_price_aed)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Theme */}
            {activeTab === 2 && (
              <div className="editor-section">
                <div className="editor-section-title">Theme</div>

                <div className="field">
                  <div className="field-label">Layout style</div>
                  <div className="theme-grid">
                    {['editorial', 'modern', 'warm'].map(theme => (
                      <div
                        key={theme}
                        className={`theme-card${(profile.portfolio_theme ?? 'editorial') === theme ? ' selected' : ''}`}
                        onClick={() => updateField('portfolio_theme', theme)}
                      >
                        <div className={`theme-swatch ${theme}`} />
                        <div className="theme-name">{theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="field-hint" style={{ marginTop: 10 }}>
                    Editorial uses serif headlines. Modern uses sans throughout. Warm uses a cream palette.
                  </div>
                </div>

                <div className="field">
                  <div className="field-label">Accent colour</div>
                  <div className="color-row">
                    {['emerald', 'navy', 'burgundy', 'charcoal', 'terracotta', 'olive'].map(color => (
                      <div
                        key={color}
                        className={`color-swatch ${color}${(profile.accent_color ?? 'emerald') === color ? ' selected' : ''}`}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                        onClick={() => updateField('accent_color', color)}
                      />
                    ))}
                  </div>
                  <div className="field-hint" style={{ marginTop: 10 }}>
                    Sets the accent colour across your portfolio — headlines, buttons, tags.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SEO */}
            {activeTab === 3 && (
              <div className="editor-section">
                <div className="editor-section-title">SEO &amp; discoverability</div>
                <div className="field">
                  <div className="field-label">Portfolio URL slug</div>
                  <input
                    className="field-input"
                    value={profile.slug ?? ''}
                    onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="your-name"
                  />
                  <div className="field-hint">agentpages.io/<strong>{profile.slug ?? 'your-name'}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="preview">
          <div className="preview-head">
            <div className="preview-label">Live preview</div>
            <div className="preview-controls">
              <div className="preview-url">agentpages.io/<strong>{slug}</strong></div>
              <div className="preview-device">
                <button
                  className={`preview-device-btn${previewDevice === 'desktop' ? ' active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  Desktop
                </button>
                <button
                  className={`preview-device-btn${previewDevice === 'mobile' ? ' active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/></svg>
                  Mobile
                </button>
              </div>
            </div>
          </div>

          <div className="preview-frame" style={previewDevice === 'mobile' ? { maxWidth: 375, margin: '0 auto' } : undefined}>
            <div className="preview-browser-bar">
              <div className="preview-dot" />
              <div className="preview-dot" />
              <div className="preview-dot" />
              <div className="preview-browser-url">agentpages.io/{slug}</div>
            </div>

            <div className="portfolio-prev">
              {/* HERO */}
              <section className="pp-hero">
                <div className="pp-hero-grid">
                  <div>
                    <div className="pp-hero-eyebrow">
                      {(profile.specialisms ?? []).join(' · ') || 'Downtown · Palm · Emirates Hills'}
                    </div>
                    <h1 className="pp-hero-title">
                      {profile.tagline
                        ? <>{profile.tagline.split('.')[0]}.<em>{profile.tagline.split('.').slice(1).join('.').trim()}</em></>
                        : <>Properties presented <em>properly.</em><br />Buyers handled personally.</>
                      }
                    </h1>
                    <p className="pp-hero-sub">
                      {profile.bio ? profile.bio.split('\n')[0] : 'Fifteen years building Dubai real estate practice. From Burj Khalifa skyline residences to Palm Jumeirah waterfront villas, every property presented with the depth and discretion serious buyers expect.'}
                    </p>
                    <div className="pp-hero-actions">
                      <button className="pp-hero-btn-primary">View properties</button>
                      <button className="pp-hero-btn-secondary">Schedule a call</button>
                    </div>
                  </div>
                  <div>
                    <div className="pp-hero-portrait">
                      <div className="pp-hero-portrait-frame" />
                    </div>
                  </div>
                </div>
              </section>

              {/* STATS */}
              <section className="pp-stats">
                <div className="pp-stats-grid">
                  <div className="pp-stat">
                    <div className="pp-stat-val">{profile.deals_closed ?? '127'}<sup>+</sup></div>
                    <div className="pp-stat-lab">Transactions closed</div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat-val">{profile.total_volume ?? '2.4'}<sup>B</sup></div>
                    <div className="pp-stat-lab">AED in sales volume</div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat-val">{profile.years_in_dubai ?? '15'}<sup>yrs</sup></div>
                    <div className="pp-stat-lab">In Dubai real estate</div>
                  </div>
                  <div className="pp-stat">
                    <div className="pp-stat-val">4.9<sup>★</sup></div>
                    <div className="pp-stat-lab">Average client rating</div>
                  </div>
                </div>
              </section>

              {/* ABOUT */}
              <section className="pp-about">
                <div className="pp-about-inner">
                  <div>
                    <div className="pp-about-eyebrow">About</div>
                    <h2 className="pp-about-title">
                      A practice built on <em>discretion</em> and the right buyer for the right home.
                    </h2>
                    <div className="pp-about-meta">
                      {displayName}{profile.rera_number ? ` · RERA #${profile.rera_number}` : ''}
                    </div>

                    <div className="pp-about-tags">
                      {(profile.specialisms ?? []).length > 0 && (
                        <div className="pp-tag-row">
                          <div className="pp-tag-label">Specialisms</div>
                          <div className="pp-tag-vals">
                            {(profile.specialisms ?? []).map(s => <span key={s}>{s}</span>)}
                          </div>
                        </div>
                      )}
                      {(profile.languages ?? []).length > 0 && (
                        <div className="pp-tag-row">
                          <div className="pp-tag-label">Languages</div>
                          <div className="pp-tag-vals">
                            {(profile.languages ?? []).map(l => <span key={l}>{l}</span>)}
                          </div>
                        </div>
                      )}
                      {(profile.price_range_from || profile.price_range_to) && (
                        <div className="pp-tag-row">
                          <div className="pp-tag-label">Price range</div>
                          <div className="pp-tag-vals">
                            <span>{profile.price_range_from ?? ''}{profile.price_range_from && profile.price_range_to ? ' – ' : ''}{profile.price_range_to ?? ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pp-about-body">
                    {profile.bio
                      ? profile.bio.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
                      : (
                        <>
                          <p>I came to Dubai in 2011, when the market was still finding its feet.</p>
                          <p>My clients tend to be investors, end-users relocating from London or Singapore, and Dubai-based families upsizing into their long-term homes.</p>
                        </>
                      )
                    }
                  </div>
                </div>
              </section>

              {/* LISTINGS */}
              {previewListings.length > 0 && (
                <section className="pp-listings">
                  <div className="pp-listings-inner">
                    <div className="pp-listings-head">
                      <div className="pp-listings-eyebrow">Current portfolio</div>
                      <h2 className="pp-listings-title">Properties <em>currently represented</em></h2>
                    </div>
                    <div className="pp-listings-grid">
                      {previewListings.map((prop, idx) => (
                        <div key={prop.id} className="pp-listing">
                          <div className={`pp-listing-photo ${LISTING_CLASSES[idx % 3]}`}>
                            <div className="pp-listing-badge">Featured</div>
                            <div className="pp-listing-price-overlay">
                              <div className="pp-listing-price">{formatPrice(prop.asking_price_aed)}</div>
                            </div>
                          </div>
                          <div className="pp-listing-body">
                            <div className="pp-listing-name">{prop.title}</div>
                            <div className="pp-listing-loc">{prop.community ?? ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* CONTACT */}
              <section className="pp-contact">
                <div className="pp-contact-inner">
                  <div>
                    <div className="pp-contact-eyebrow">Get in touch</div>
                    <h2 className="pp-contact-title">Looking for something <em>specific?</em></h2>
                    <p className="pp-contact-desc">Tell me what you're looking for and I'll come back to you personally.</p>
                  </div>
                  <div className="pp-form">
                    <div className="pp-form-title">Send me a note</div>
                    <div className="pp-form-sub">I respond personally within one business day.</div>
                    <input type="text" placeholder="Full name" readOnly />
                    <input type="email" placeholder="Email" readOnly />
                    <input type="tel" placeholder="Phone" readOnly />
                    <textarea rows={3} placeholder="What you're looking for..." style={{ resize: 'vertical' }} readOnly />
                    <button className="pp-form-submit">Send enquiry</button>
                  </div>
                </div>
              </section>

              <footer className="pp-footer">
                <div>© {new Date().getFullYear()} {displayName}{profile.rera_number ? ` · RERA #${profile.rera_number}` : ''}</div>
                <div className="pp-footer-powered">Powered by <strong>Agent Pages</strong></div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
