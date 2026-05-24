import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import LocationPicker, { type LocationValue } from '../components/LocationPicker'

/* ── helpers ── */
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}
function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (firstName) return firstName.substring(0, 2).toUpperCase()
  if (email) { const p = email.split('@')[0].split(/[._-]/); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : email.substring(0, 2).toUpperCase() }
  return 'AP'
}

/* ── types ── */
type PropertyType = 'Villa' | 'Apartment' | 'Townhouse' | 'Penthouse' | 'Plot / Land' | 'Other'
type Purpose = 'For sale' | 'For rent'
type Tone = 'Refined' | 'Warm' | 'Investor'

interface FormState {
  propertyType: PropertyType | ''
  purpose: Purpose | ''
  community: string
  subCommunity: string
  tower: string
  addressInternal: string
  pageTitle: string
  lat: string
  lng: string
  placeId: string
  locationDisplay: string
  locationExact: boolean
  beds: string
  baths: string
  sqft: string
  plotSqft: string
  price: string
  feature1: string
  feature2: string
  feature3: string
  feature4: string
  tone: Tone
  description: string
  photos: File[]
  slug: string
  customDomain: string
  showSoldPricing: boolean
  showLeadForm: boolean
  showOnPortfolio: boolean
}

interface AgentProfile {
  first_name?: string
  last_name?: string
  email?: string
  brokerage?: string
  slug?: string
}

/* ── step meta ── */
const STEPS = [
  { name: 'The basics', desc: 'Type, location, listing purpose' },
  { name: 'Specs & price', desc: 'Beds, baths, sqft, top features' },
  { name: 'AI description', desc: 'Generated, editable, three tones' },
  { name: 'Photos', desc: 'Hero + gallery' },
  { name: 'URL & options', desc: 'Slug, sold pricing, leads' },
  { name: 'Review & publish', desc: 'Final check, go live' },
]

/* ── property type SVG icons (no emoji) ── */
const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Villa': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  'Apartment': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1"/>
      <path d="M9 22V12h6v10"/>
      <line x1="8" y1="7" x2="8" y2="7"/><line x1="12" y1="7" x2="12" y2="7"/><line x1="16" y1="7" x2="16" y2="7"/>
      <line x1="8" y1="11" x2="8" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  'Townhouse': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10l5-5 5 5V21H1z"/>
      <path d="M8 10l5-5 5 5V21H8z"/>
      <path d="M18 22V13h4v9"/>
    </svg>
  ),
  'Penthouse': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="17" rx="1"/>
      <path d="M3 9h18"/>
      <path d="M8 5V2l4-1 4 1v3"/>
      <path d="M10 22v-5h4v5"/>
    </svg>
  ),
  'Plot / Land': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l4-8 5 5 3-4 6 7"/>
      <path d="M3 21h18"/>
    </svg>
  ),
  'Other': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
}

const TYPE_OPTIONS: { label: PropertyType }[] = [
  { label: 'Villa' },
  { label: 'Apartment' },
  { label: 'Townhouse' },
  { label: 'Penthouse' },
  { label: 'Plot / Land' },
  { label: 'Other' },
]

/* ══════════════════════════════════════════════════════════════ */
export default function PropertyNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(true)
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')
  const [form, setForm] = useState<FormState>({
    propertyType: '', purpose: '', community: '', subCommunity: '', tower: '', addressInternal: '', pageTitle: '',
    lat: '', lng: '', placeId: '', locationDisplay: '', locationExact: false,
    beds: '', baths: '', sqft: '', plotSqft: '', price: '',
    feature1: '', feature2: '', feature3: '', feature4: '',
    tone: 'Refined', description: '',
    photos: [],
    slug: '', customDomain: '', showSoldPricing: false, showLeadForm: true, showOnPortfolio: true,
  })

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('first_name,last_name,email,brokerage,slug').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  const setField = (key: keyof FormState, val: string | boolean | File[]) => {
    setSaved(false)
    setForm(f => ({ ...f, [key]: val }))
    setTimeout(() => setSaved(true), 800)
  }

  const titleSlug = slugify(form.pageTitle)
  const agentSlug = profile?.slug || 'your-name'
  const effectiveSlug = form.slug || titleSlug || 'property-title'
  const propSlug = effectiveSlug
  const formattedPrice = form.price ? 'AED ' + Number(form.price).toLocaleString() : 'AED —'
  const initials = getInitials(profile?.first_name, profile?.last_name, user?.email || '')
  const agentName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user?.email || 'Agent' : (user?.email || 'Agent')

  const locationParts = [
    form.community,
    form.subCommunity ? `**${form.subCommunity}**` : '',
    form.tower,
  ].filter(Boolean)

  const rightActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
        background: saved ? 'var(--accent-soft,#e8f0ed)' : '#fff8e6',
        borderRadius: 20, fontSize: 11.5, fontWeight: 500,
        color: saved ? 'var(--accent,#2d5a4f)' : '#8b6f3a',
        border: '1px solid', borderColor: saved ? 'var(--accent-soft,#e8f0ed)' : '#ebe3d2',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: saved ? 'var(--accent-bright,#3d8a76)' : '#e0a020', display: 'inline-block' }} />
        {saved ? 'Draft saved' : 'Saving…'}
      </div>
      <Link to="/properties" style={{
        padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        textDecoration: 'none', color: 'var(--muted,#5a6470)',
        border: '1px solid var(--line,#e6e8eb)', background: 'transparent',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--line-soft,#f0f2f4)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink,#0f1419)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted,#5a6470)' }}
      >Exit</Link>
    </div>
  )

  return (
    <AppShell variant="breadcrumb" breadcrumb={{ parent: 'Properties', parentHref: '/properties', current: 'Add new' }} rightActions={rightActions}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');

        .pnw-grid {
          display: grid;
          grid-template-columns: 240px 1fr 480px;
          min-height: calc(100vh - 60px);
        }
        @media (max-width: 1279px) {
          .pnw-grid { grid-template-columns: 220px 1fr 420px; }
        }
        @media (max-width: 1099px) {
          .pnw-grid { grid-template-columns: 200px 1fr; }
          .pnw-preview-col { display: none !important; }
        }
        @media (max-width: 819px) {
          .pnw-grid { grid-template-columns: 1fr; }
          .pnw-rail { display: none !important; }
        }

        @keyframes pnw-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes pnw-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pnw-expand {
          from { max-height: 0; opacity: 0; }
          to { max-height: 600px; opacity: 1; }
        }

        .pnw-type-card:hover { border-color: var(--accent-bright,#3d8a76) !important; background: var(--accent-soft,#e8f0ed) !important; }
        .pnw-purpose-card:hover { border-color: var(--accent-bright,#3d8a76) !important; background: var(--accent-soft,#e8f0ed) !important; }
        .pnw-input { width:100%; padding:11px 14px; background:#fff; border:1px solid var(--line,#e6e8eb); border-radius:9px; font-size:14px; color:var(--ink,#0f1419); font-family:inherit; transition:all .12s; line-height:1.5; box-sizing:border-box; }
        .pnw-input::placeholder { color:var(--quiet,#8b95a0); }
        .pnw-input:focus { outline:none; border-color:var(--accent,#2d5a4f); box-shadow:0 0 0 3px rgba(45,90,79,0.08); }
        .pnw-txn-card { animation: pnw-expand 0.25s ease forwards; overflow: hidden; }
      `}</style>

      <div className="pnw-grid">
        {/* ── LEFT: Step Rail ── */}
        <aside className="pnw-rail" style={{
          background: '#fff', borderRight: '1px solid var(--line-soft,#f0f2f4)',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, marginBottom: 4 }}>NEW PROPERTY</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#0f1419)', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {form.pageTitle || 'Untitled draft'}
            </div>
          </div>

          <div style={{ padding: '16px 20px 12px' }}>
            <div style={{ height: 4, background: 'var(--line-soft,#f0f2f4)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${(step / 6) * 100}%`, background: 'var(--accent,#2d5a4f)', borderRadius: 2, transition: 'width .3s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted,#5a6470)', fontWeight: 500 }}>
              <strong style={{ color: 'var(--ink,#0f1419)' }}>Step {step} of 6</strong> · {STEPS[step - 1].name}
            </div>
          </div>

          <div style={{ flex: 1, padding: '4px 10px' }}>
            {STEPS.map((s, i) => {
              const n = i + 1
              const isActive = step === n
              const isDone = step > n
              return (
                <div key={n}
                  onClick={() => setStep(n)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? 'var(--accent-soft,#e8f0ed)' : 'transparent',
                    marginBottom: 2, transition: 'background .12s', position: 'relative',
                  }}
                >
                  {i < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 22, top: 34, bottom: -2, width: 1.5,
                      background: isDone ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)',
                    }} />
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, position: 'relative', zIndex: 1,
                    background: isActive ? 'var(--accent,#2d5a4f)' : isDone ? 'var(--accent-bright,#3d8a76)' : '#fff',
                    border: isActive ? '1.5px solid var(--accent,#2d5a4f)' : isDone ? '1.5px solid var(--accent-bright,#3d8a76)' : '1.5px solid var(--line,#e6e8eb)',
                    color: isActive || isDone ? '#fff' : 'var(--quiet,#8b95a0)',
                    boxShadow: isActive ? '0 0 0 4px rgba(45,90,79,0.12)' : 'none',
                  }}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : n}
                  </div>
                  <div style={{ paddingTop: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--ink,#0f1419)' : isDone ? 'var(--ink,#0f1419)' : 'var(--muted,#5a6470)', marginBottom: 1 }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: isDone ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-soft,#f0f2f4)', fontSize: 11, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
            Your draft auto-saves as you type.
          </div>
        </aside>

        {/* ── MIDDLE: Form ── */}
        <main style={{ padding: '40px 48px 120px', overflowY: 'auto', background: 'var(--paper-warm,#fbfaf7)' }}>
          <div style={{ maxWidth: 600 }}>
            {step === 1 && <Step1Form form={form} setField={setField} onContinue={() => setStep(2)} />}
            {step === 2 && <Step2Form form={form} setField={setField} onBack={() => setStep(1)} onContinue={() => setStep(3)} />}
            {step === 3 && <Step3Form form={form} setField={setField} onBack={() => setStep(2)} onContinue={() => setStep(4)} />}
            {step === 4 && <Step4Form form={form} setField={setField} onBack={() => setStep(3)} onContinue={() => setStep(5)} />}
            {step === 5 && <Step5Form form={form} setField={setField} onBack={() => setStep(4)} onContinue={() => setStep(6)} agentSlug={agentSlug} />}
            {step === 6 && (
              <Step6Form
                form={form}
                setField={setField}
                onBack={() => setStep(5)}
                agentSlug={agentSlug}
                formattedPrice={formattedPrice}
                onPublish={async () => {
                  if (!user) return
                  await supabase.from('properties').upsert({
                    user_id: user.id,
                    property_type: form.propertyType,
                    listing_purpose: form.purpose,
                    community: form.community,
                    sub_community: form.subCommunity,
                    tower: form.tower,
                    address: form.addressInternal,
                    title: form.pageTitle,
                    beds: form.beds ? Number(form.beds) : null,
                    baths: form.baths ? Number(form.baths) : null,
                    sqft: form.sqft ? Number(form.sqft) : null,
                    plot_sqft: form.plotSqft ? Number(form.plotSqft) : null,
                    price: form.price ? Number(form.price) : null,
                    features: [form.feature1, form.feature2, form.feature3, form.feature4].filter(Boolean),
                    description: form.description,
                    description_tone: form.tone,
                    slug: form.slug || slugify(form.pageTitle),
                    custom_domain: form.customDomain || null,
                    show_sold_pricing: form.showSoldPricing,
                    show_lead_form: form.showLeadForm,
                    show_on_portfolio: form.showOnPortfolio,
                    lat: form.lat ? parseFloat(form.lat) : null,
                    lng: form.lng ? parseFloat(form.lng) : null,
                    place_id: form.placeId || null,
                    location_display: form.locationDisplay || null,
                    location_exact: form.locationExact,
                    status: 'published',
                  })
                  navigate('/properties')
                }}
                onSaveDraft={async () => {
                  if (!user) return
                  await supabase.from('properties').upsert({
                    user_id: user.id,
                    title: form.pageTitle,
                    slug: form.slug || slugify(form.pageTitle),
                    status: 'draft',
                    property_type: form.propertyType,
                    listing_purpose: form.purpose,
                    community: form.community,
                    sub_community: form.subCommunity,
                    beds: form.beds ? Number(form.beds) : null,
                    baths: form.baths ? Number(form.baths) : null,
                    sqft: form.sqft ? Number(form.sqft) : null,
                    price: form.price ? Number(form.price) : null,
                    description: form.description,
                    lat: form.lat ? parseFloat(form.lat) : null,
                    lng: form.lng ? parseFloat(form.lng) : null,
                    place_id: form.placeId || null,
                    location_display: form.locationDisplay || null,
                    location_exact: form.locationExact,
                  })
                  navigate('/properties')
                }}
              />
            )}
          </div>
        </main>

        {/* ── RIGHT: Live Preview ── */}
        <aside className="pnw-preview-col" style={{
          background: 'var(--paper-warm,#fbfaf7)', borderLeft: '1px solid var(--line-soft,#f0f2f4)',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '28px 20px',
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600 }}>LIVE PREVIEW</div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pnw-pulse 2s infinite' }} />
            </div>
            <div style={{ display: 'inline-flex', background: 'var(--line-soft,#f0f2f4)', borderRadius: 8, padding: 3, marginBottom: 10 }}>
              {(['desktop', 'mobile'] as const).map(m => (
                <button key={m} onClick={() => setDeviceMode(m)} style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, fontFamily: 'inherit', transition: 'all .12s',
                  background: deviceMode === m ? 'var(--ink,#0f1419)' : 'transparent',
                  color: deviceMode === m ? '#fff' : 'var(--muted,#5a6470)',
                }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--quiet,#8b95a0)', lineHeight: 1.5 }}>
              Exactly what buyers see when they visit your page. Updates as you type.
            </div>
          </div>

          {/* Browser frame */}
          <div style={{
            background: '#fff', borderRadius: 12, boxShadow: '0 14px 36px rgba(15,20,25,0.08)',
            overflow: 'hidden', maxWidth: deviceMode === 'mobile' ? 290 : '100%',
            transition: 'max-width .3s ease', margin: '0 auto', width: '100%',
          }}>
            {/* Chrome bar */}
            <div style={{ height: 30, background: '#f5f5f5', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, background: '#fff', borderRadius: 4, height: 18,
                display: 'flex', alignItems: 'center', padding: '0 8px',
                fontSize: 10, color: 'var(--muted,#5a6470)', border: '1px solid #e8e8e8',
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                {form.customDomain
                  ? <span style={{ color: '#22c55e', fontWeight: 600 }}>{form.customDomain}</span>
                  : <><span style={{ color: 'var(--quiet,#8b95a0)' }}>agentpages.io/{agentSlug}/</span><span style={{ color: '#22c55e', fontWeight: 600 }}>{propSlug}</span></>
                }
              </div>
            </div>

            {/* Mini property page */}
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
              {/* Agent brand bar */}
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent,#2d5a4f), #1d4030)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 9, fontWeight: 700,
                  }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink,#0f1419)', lineHeight: 1.2 }}>{agentName}</div>
                    <div style={{ fontSize: 9.5, color: '#22c55e', fontWeight: 500 }}>{profile?.brokerage || 'Brokerage'}</div>
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', background: 'var(--accent,#2d5a4f)', color: '#fff',
                  borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'default',
                }}>Enquire</div>
              </div>

              {/* Hero */}
              {form.photos[0] ? (
                <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
                  <img src={URL.createObjectURL(form.photos[0])} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 9.5, fontWeight: 600 }}>
                    {form.photos.length} / 18
                  </div>
                </div>
              ) : (
                <div style={{
                  height: 160, background: 'linear-gradient(135deg, #f0ede6 0%, #e8e2d8 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0a890" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <div style={{ fontSize: 10, color: '#b0a890', textAlign: 'center', lineHeight: 1.5 }}>Photos added in step 4</div>
                </div>
              )}

              {/* Content */}
              <div style={{ padding: '14px 16px' }}>
                {/* Type chip — no emoji */}
                {form.propertyType && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#dcfce7', borderRadius: 20, fontSize: 9.5, fontWeight: 600, color: '#15803d', marginBottom: 8 }}>
                    {form.propertyType.toUpperCase()}
                  </div>
                )}

                {/* Title */}
                <div style={{
                  fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, lineHeight: 1.3, marginBottom: 6,
                  color: form.pageTitle ? 'var(--ink,#0f1419)' : 'var(--quiet,#8b95a0)',
                  fontStyle: form.pageTitle ? 'normal' : 'italic',
                  fontWeight: 400,
                }}>
                  {form.pageTitle || 'Your property title here'}
                </div>

                {/* Location */}
                <div style={{
                  fontSize: 10.5, color: locationParts.length ? 'var(--muted,#5a6470)' : 'var(--quiet,#8b95a0)',
                  fontStyle: locationParts.length ? 'normal' : 'italic', marginBottom: 10, lineHeight: 1.5,
                }}>
                  {locationParts.length ? locationParts.map((p, i) => {
                    const isBold = p.startsWith('**') && p.endsWith('**')
                    const text = isBold ? p.slice(2, -2) : p
                    return (
                      <span key={i}>
                        {i > 0 && ', '}
                        {isBold ? <strong>{text}</strong> : text}
                      </span>
                    )
                  }) : 'Community, Sub-community, Tower'}
                </div>

                {/* Price + purpose */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.price ? 'var(--ink,#0f1419)' : 'var(--quiet,#8b95a0)' }}>{formattedPrice}</div>
                  {form.purpose && (
                    <div style={{ padding: '2px 8px', background: form.purpose === 'For sale' ? '#dbeafe' : '#fef3c7', color: form.purpose === 'For sale' ? '#1d4ed8' : '#92400e', borderRadius: 20, fontSize: 9.5, fontWeight: 600 }}>
                      {form.purpose}
                    </div>
                  )}
                </div>

                {/* Specs grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14, background: 'var(--paper-warm,#fbfaf7)', borderRadius: 8, padding: '10px 8px' }}>
                  {[
                    { label: 'Beds', val: form.beds },
                    { label: 'Baths', val: form.baths },
                    { label: 'Sqft', val: form.sqft ? Number(form.sqft).toLocaleString() : '' },
                    { label: 'Plot', val: form.plotSqft ? Number(form.plotSqft).toLocaleString() : '' },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: val ? 'var(--ink,#0f1419)' : 'var(--quiet,#8b95a0)', marginBottom: 1 }}>{val || '—'}</div>
                      <div style={{ fontSize: 9, color: 'var(--quiet,#8b95a0)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Location preview map */}
                {form.lat && form.lng && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, marginBottom: 6 }}>LOCATION</div>
                    <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${form.lat},${form.lng}&zoom=15&size=400x120&key=AIzaSyBdZrnGpA6uof-um3fxLH1gu2Y6uoqCwqw&style=feature:all|saturation:-80`}
                        alt="Location map"
                        style={{ width: '100%', display: 'block' }}
                      />
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--quiet,#8b95a0)', fontStyle: 'italic' }}>
                      {form.locationExact ? 'Exact location' : 'Approximate location'}
                    </div>
                  </div>
                )}

                {/* AI description */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, marginBottom: 6 }}>ABOUT THIS PROPERTY</div>
                  {form.description
                    ? <div style={{ fontSize: 10, color: 'var(--muted,#5a6470)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{form.description}</div>
                    : <div style={{ border: '1.5px dashed var(--line,#e6e8eb)', borderRadius: 6, padding: '10px 12px', fontSize: 10, color: 'var(--quiet,#8b95a0)', fontStyle: 'italic', lineHeight: 1.5 }}>AI description appears in step 3</div>
                  }
                </div>

                {/* Sold transactions in preview */}
                {form.showSoldPricing && form.community && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, marginBottom: 6 }}>RECENT TRANSACTIONS</div>
                    {MOCK_TRANSACTIONS.filter(t => t.checked).slice(0, 3).map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{t.label}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--muted,#5a6470)' }}>{t.sub}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agent block */}
                <div style={{ background: '#dcfce7', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent,#2d5a4f), #1d4030)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{agentName}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--muted,#5a6470)' }}>Licensed Agent</div>
                      <div style={{ fontSize: 9.5, color: '#15803d', fontWeight: 500 }}>{profile?.brokerage || 'Brokerage'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Call', 'WhatsApp'].map(label => (
                      <div key={label} style={{
                        flex: 1, padding: '5px 0', background: '#fff', borderRadius: 6,
                        textAlign: 'center', fontSize: 9.5, fontWeight: 600, color: '#15803d', cursor: 'default',
                      }}>{label}</div>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 9, color: 'var(--quiet,#8b95a0)', paddingBottom: 8 }}>
                  Powered by Agent Pages
                </div>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div style={{ marginTop: 14, background: '#dcfce7', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#15803d', lineHeight: 1.6 }}>
              <strong>Watch the URL build up</strong> — your title turns into the public URL slug. You can fully customise it in step 5.
            </div>
          )}
          {step === 6 && (
            <div style={{ marginTop: 14 }}>
              <a href="#" style={{ display: 'block', textAlign: 'center', padding: '9px 0', background: 'var(--accent,#2d5a4f)', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View full page ↗</a>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  )
}

/* ── Mock transactions data ── */
const MOCK_TRANSACTIONS = [
  { label: '3BR Villa · AED 4,200,000', sub: '14 days ago · 3,200 sqft', checked: true },
  { label: '4BR Villa · AED 5,800,000', sub: '21 days ago · 4,100 sqft', checked: true },
  { label: '3BR Villa · AED 3,950,000', sub: '1 month ago · 3,050 sqft', checked: true },
  { label: '5BR Villa · AED 7,200,000', sub: '2 months ago · 5,500 sqft', checked: false },
  { label: '3BR Villa · AED 4,100,000', sub: '2 months ago · 3,200 sqft', checked: false },
  { label: '4BR Villa · AED 5,500,000', sub: '3 months ago · 3,900 sqft', checked: false },
]

/* ═══════════════════════════════════════════════════════════════
   STEP 1 — The basics
═══════════════════════════════════════════════════════════════ */
function Step1Form({ form, setField, onContinue }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
  onContinue: () => void
}) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 1 OF 6</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>Let's start with the basics</h1>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Watch the live preview on the right update as you fill in details — your property page builds in real time.
      </p>

      {/* Property type — compact horizontal cards */}
      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Property type</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {TYPE_OPTIONS.map(({ label }) => {
            const isSelected = form.propertyType === label
            return (
              <div key={label} className="pnw-type-card" onClick={() => setField('propertyType', label)}
                style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: '13px 14px', borderRadius: 10, cursor: 'pointer', height: 52,
                  border: isSelected ? '2px solid var(--accent,#2d5a4f)' : '1.5px solid var(--line,#e6e8eb)',
                  background: isSelected ? 'var(--accent-soft,#e8f0ed)' : '#fff',
                  transition: 'all .12s', boxSizing: 'border-box',
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: isSelected ? '#fff' : 'var(--paper-warm,#fbfaf7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isSelected ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)',
                }}>
                  {TYPE_ICONS[label]}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink,#0f1419)', lineHeight: 1.2 }}>{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Listing purpose — compact, no emoji */}
      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Listing purpose</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {(['For sale', 'For rent'] as const).map(p => {
            const isSelected = form.purpose === p
            return (
              <div key={p} className="pnw-purpose-card" onClick={() => setField('purpose', p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 18px', height: 52, borderRadius: 10, cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent,#2d5a4f)' : '1.5px solid var(--line,#e6e8eb)',
                  background: isSelected ? 'var(--accent-soft,#e8f0ed)' : '#fff',
                  transition: 'all .12s', boxSizing: 'border-box',
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: isSelected ? '#fff' : 'var(--paper-warm,#fbfaf7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isSelected ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)',
                }}>
                  {p === 'For sale' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{p}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Location section — Google Places or fallback */}
      <SectionDivider>Location</SectionDivider>

      <GooglePlacesLocation form={form} setField={setField} />

      <div style={{ marginBottom: 18 }}>
        <FieldLabel required>Community / Area</FieldLabel>
        <LocationPicker
          value={form.community ? { name: form.tower || form.subCommunity || form.community, hierarchy: [form.community, form.subCommunity, form.tower].filter(Boolean).join('>'), type: form.tower ? 'B' : form.subCommunity ? 'C' : 'N' } : null}
          onChange={(loc: LocationValue | null) => {
            if (!loc) {
              setField('community', '')
              setField('subCommunity', '')
              setField('tower', '')
            } else {
              const parts = loc.hierarchy.split('>')
              const locParts = parts.filter((p: string) => !['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain'].includes(p))
              setField('community', locParts[0] || loc.name)
              setField('subCommunity', locParts[1] || '')
              setField('tower', locParts[2] || '')
            }
          }}
          required
        />
        <FieldHint>This forms the address shown on your property page. Search 15,000+ Dubai communities.</FieldHint>
      </div>

      <div style={{ marginBottom: 18 }}>
        <FieldLabel>Internal address (plot / villa number)</FieldLabel>
        <input className="pnw-input" value={form.addressInternal} onChange={e => setField('addressInternal', e.target.value)} placeholder="e.g. Unit 2304, Tower B — never shown publicly" />
      </div>

      {/* Page title */}
      <SectionDivider>Page title</SectionDivider>

      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Title</FieldLabel>
        <input className="pnw-input" value={form.pageTitle} onChange={e => setField('pageTitle', e.target.value)} placeholder="e.g. Stunning 3BR Villa with Pool in Emirates Hills" />
        <FieldHint>Be descriptive — this becomes your headline and URL slug</FieldHint>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--quiet,#8b95a0)' }}>Step 1 of 6 · Auto-saved</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: '1.5px solid var(--line,#e6e8eb)', background: '#fff', color: 'var(--ink,#0f1419)', fontFamily: 'inherit',
          }}>Save & exit</button>
          <button onClick={onContinue} style={{
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff', fontFamily: 'inherit',
          }}>Continue to specs →</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2 — Specs & price
═══════════════════════════════════════════════════════════════ */
function Step2Form({ form, setField, onBack, onContinue }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 2 OF 6</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>Specs &amp; price</h1>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        The numbers buyers scan first — beds, baths, size, price, and the features that make this one stand out.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div>
          <FieldLabel required>Beds</FieldLabel>
          <input type="number" min="0" className="pnw-input" value={form.beds} onChange={e => setField('beds', e.target.value)} placeholder="e.g. 4" />
        </div>
        <div>
          <FieldLabel required>Baths</FieldLabel>
          <input type="number" min="0" className="pnw-input" value={form.baths} onChange={e => setField('baths', e.target.value)} placeholder="e.g. 5" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div>
          <FieldLabel required>Built-up area (sqft)</FieldLabel>
          <input type="number" min="0" className="pnw-input" value={form.sqft} onChange={e => setField('sqft', e.target.value)} placeholder="e.g. 4200" />
        </div>
        <div>
          <FieldLabel optional>Plot size (sqft)</FieldLabel>
          <input type="number" min="0" className="pnw-input" value={form.plotSqft} onChange={e => setField('plotSqft', e.target.value)} placeholder="e.g. 8000" />
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Price (AED)</FieldLabel>
        <input type="number" min="0" className="pnw-input" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="e.g. 8500000" />
        <FieldHint>Shown publicly. Use digits only — we format it.</FieldHint>
      </div>

      <SectionDivider>Top features</SectionDivider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        {(['feature1', 'feature2', 'feature3', 'feature4'] as const).map((k, i) => (
          <div key={k}>
            <FieldLabel optional>Feature {i + 1}</FieldLabel>
            <input className="pnw-input" value={form[k]} onChange={e => setField(k, e.target.value)} placeholder={['Private pool', 'Sea view', 'Upgraded kitchen', 'Vacant on transfer'][i]} />
          </div>
        ))}
      </div>
      <FieldHint>These feed the AI description in the next step. Think: private pool, sea view, upgraded kitchen, vacant on transfer.</FieldHint>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid var(--line-soft,#f0f2f4)', marginTop: 32 }}>
        <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent', color: 'var(--ink,#0f1419)', fontFamily: 'inherit' }}>← Back to basics</button>
        <button onClick={onContinue} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff', fontFamily: 'inherit' }}>Continue to description →</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 — AI description
═══════════════════════════════════════════════════════════════ */
const TONE_OPTIONS: { id: Tone; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'Refined', label: 'Refined', desc: 'Elegant, formal prose for luxury listings',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  },
  {
    id: 'Warm', label: 'Warm', desc: 'Friendly, conversational, approachable',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  },
  {
    id: 'Investor', label: 'Investor', desc: 'Data-driven, ROI-focused, returns-led',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  },
]

const MOCK_DESCRIPTIONS: Record<Tone, (f: FormState) => string> = {
  Refined: f => `Presenting an exceptional ${f.propertyType || 'residence'} in the prestigious ${f.community || 'community'}, this meticulously curated property embodies the pinnacle of refined living. ${f.beds ? `Comprising ${f.beds} generously proportioned bedrooms` : 'Comprising beautifully proportioned bedrooms'} and ${f.baths ? `${f.baths} elegantly appointed bathrooms` : 'elegantly appointed bathrooms'}, the residence is complemented by ${[f.feature1, f.feature2, f.feature3, f.feature4].filter(Boolean).join(', ') || 'bespoke finishes and curated amenities'} that distinguish it from ordinary offerings. ${f.sqft ? `Spanning ${Number(f.sqft).toLocaleString()} sq ft` : 'Spanning an impressive footprint'}, every space has been thoughtfully designed to deliver an uncompromising lifestyle. An unmissable opportunity for the most discerning of buyers.`,
  Warm: f => `Welcome home to this wonderful ${f.propertyType || 'property'} in ${f.community || 'a fantastic community'}! With ${f.beds || 'spacious'} bedrooms and ${f.baths || 'beautifully finished'} bathrooms, there's space for everyone to feel right at home. ${[f.feature1, f.feature2, f.feature3, f.feature4].filter(Boolean).length > 0 ? `You'll love the ${[f.feature1, f.feature2, f.feature3, f.feature4].filter(Boolean).join(', ')} — ` : ''}${f.sqft ? `all ${Number(f.sqft).toLocaleString()} sq ft of it` : 'every inch of it'} has been cared for and is ready for its next chapter. Whether you're looking for family space or your own retreat, this one just feels right. Come see it for yourself — we'd love to show you around.`,
  Investor: f => `Strong investment opportunity: ${f.propertyType || 'property'} in ${f.community || 'a high-demand community'}, one of Dubai's most sought-after residential zones with consistent year-on-year capital appreciation. ${f.beds ? `${f.beds}-bedroom` : 'Multi-bedroom'} configuration ${f.sqft ? `across ${Number(f.sqft).toLocaleString()} sq ft` : ''} offers broad rental appeal. ${[f.feature1, f.feature2, f.feature3, f.feature4].filter(Boolean).length > 0 ? `Key value drivers: ${[f.feature1, f.feature2, f.feature3, f.feature4].filter(Boolean).join(', ')}.` : ''} ${f.price ? `Listed at AED ${Number(f.price).toLocaleString()}, representing competitive entry pricing` : 'Competitively priced'} for a market where comparable units command premium returns. Ideal for portfolio diversification, buy-to-let, or capital preservation strategy.`,
}

function Step3Form({ form, setField, onBack, onContinue }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
  onBack: () => void
  onContinue: () => void
}) {
  const [generating, setGenerating] = useState(false)

  const generate = () => {
    setGenerating(true)
    setField('description', '')
    setTimeout(() => {
      setGenerating(false)
      setField('description', MOCK_DESCRIPTIONS[form.tone](form))
    }, 2000)
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 3 OF 6</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>AI description</h1>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        We'll write a unique, search-optimised description based on everything you've entered. Pick a tone, edit freely.
      </p>

      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Tone</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {TONE_OPTIONS.map(t => {
            const sel = form.tone === t.id
            return (
              <div key={t.id} onClick={() => setField('tone', t.id)}
                style={{
                  padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                  border: sel ? '2px solid var(--accent,#2d5a4f)' : '1.5px solid var(--line,#e6e8eb)',
                  background: sel ? 'var(--accent-soft,#e8f0ed)' : '#fff',
                  transition: 'all .12s',
                }}>
                <div style={{ color: sel ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)', marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#0f1419)', marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Generate button — no emoji */}
      <button onClick={generate} disabled={generating} style={{
        padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? 'wait' : 'pointer',
        border: 'none', background: generating ? 'var(--muted,#5a6470)' : 'var(--accent,#2d5a4f)', color: '#fff',
        fontFamily: 'inherit', marginBottom: 16, transition: 'background .12s',
      }}>Generate description</button>

      {generating && (
        <div style={{ marginBottom: 16 }}>
          {[100, 90, 95, 70].map((w, i) => (
            <div key={i} style={{
              height: 14, borderRadius: 6, background: '#e6e8eb', marginBottom: 8,
              width: `${w}%`, animation: 'pnw-pulse 1.4s infinite', animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      )}

      {!generating && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="pnw-input"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder="Click 'Generate description' above, or write your own…"
            style={{ minHeight: 200, resize: 'vertical', lineHeight: 1.7 }}
          />
          <FieldHint>This is YOUR description — edit it however you like. Every property gets unique copy, no duplicates.</FieldHint>
        </div>
      )}

      {form.description && !generating && (
        <button onClick={generate} style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent', color: 'var(--muted,#5a6470)',
          fontFamily: 'inherit', marginBottom: 24,
        }}>Try a different version</button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid var(--line-soft,#f0f2f4)', marginTop: 16 }}>
        <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent', color: 'var(--ink,#0f1419)', fontFamily: 'inherit' }}>← Back to specs</button>
        <button onClick={onContinue} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff', fontFamily: 'inherit' }}>Continue to photos →</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4 — Photos
═══════════════════════════════════════════════════════════════ */
function Step4Form({ form, setField, onBack, onContinue }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
  onBack: () => void
  onContinue: () => void
}) {
  const MAX_PHOTOS = 18
  const photos = form.photos

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    const combined = [...photos, ...newFiles].slice(0, MAX_PHOTOS)
    setField('photos', combined)
  }

  const removePhoto = (i: number) => {
    setField('photos', photos.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 4 OF 6</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>Photos</h1>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        The hero photo is the first thing buyers see. Add up to 18 photos — drag to reorder.
      </p>

      <div style={{ marginBottom: 20 }}>
        <FieldLabel>Hero photo</FieldLabel>
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          height: 200, borderRadius: 12, cursor: 'pointer',
          border: photos[0] ? '2px solid var(--accent,#2d5a4f)' : '2px dashed var(--line,#e6e8eb)',
          background: photos[0] ? 'transparent' : '#fff',
          overflow: 'hidden', position: 'relative', transition: 'all .12s',
        }}>
          {photos[0] ? (
            <>
              <img src={URL.createObjectURL(photos[0])} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{photos[0].name}</div>
            </>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--quiet,#8b95a0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ fontSize: 13, color: 'var(--muted,#5a6470)' }}>Drop your hero photo here or click to browse</span>
            </>
          )}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <FieldLabel>Gallery</FieldLabel>
          <span style={{ fontSize: 12, color: 'var(--muted,#5a6470)', fontWeight: 500 }}>{photos.length} / {MAX_PHOTOS} photos</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {photos.slice(1).map((f, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', background: '#f0f2f4' }}>
              <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removePhoto(i + 1)} style={{
                position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}>×</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              borderRadius: 8, border: '2px dashed var(--line,#e6e8eb)', cursor: 'pointer',
              aspectRatio: '4/3', background: '#fff', fontSize: 11, color: 'var(--muted,#5a6470)', transition: 'all .12s',
            }}>
              <span style={{ fontSize: 20 }}>+</span>
              <span>Add photos</span>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>
      <FieldHint>Landscape, well-lit photos work best. The hero photo replaces the gradient placeholder on your page.</FieldHint>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid var(--line-soft,#f0f2f4)', marginTop: 24 }}>
        <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent', color: 'var(--ink,#0f1419)', fontFamily: 'inherit' }}>← Back to description</button>
        <button onClick={onContinue} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff', fontFamily: 'inherit' }}>Continue to URL &amp; options →</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 5 — URL & options
═══════════════════════════════════════════════════════════════ */
function ToggleCard({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', borderRadius: 10, cursor: 'pointer',
      border: value ? '2px solid var(--accent,#2d5a4f)' : '1.5px solid var(--line,#e6e8eb)',
      background: value ? 'var(--accent-soft,#e8f0ed)' : '#fff', marginBottom: 10, transition: 'all .12s',
    }}>
      <div style={{
        width: 40, height: 22, borderRadius: 11, background: value ? 'var(--accent,#2d5a4f)' : 'var(--line,#e6e8eb)',
        position: 'relative', flexShrink: 0, marginTop: 2, transition: 'background .15s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3, width: 16, height: 16,
          borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink,#0f1419)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  )
}

function Step5Form({ form, setField, onBack, onContinue, agentSlug }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
  onBack: () => void
  onContinue: () => void
  agentSlug: string
}) {
  const derivedSlug = form.slug || slugify(form.pageTitle) || 'property-title'
  const [txnChecked, setTxnChecked] = useState(MOCK_TRANSACTIONS.map(t => t.checked))

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 5 OF 6</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>URL &amp; options</h1>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Choose your page URL, toggle sold pricing data, and configure lead capture.
      </p>

      <SectionDivider>Page URL</SectionDivider>

      <div style={{ marginBottom: 18 }}>
        <FieldLabel>URL slug</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--line,#e6e8eb)', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '11px 12px', background: 'var(--paper-warm,#fbfaf7)', fontSize: 13, color: 'var(--muted,#5a6470)', borderRight: '1px solid var(--line,#e6e8eb)', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            agentpages.io/{agentSlug}/
          </div>
          <input
            style={{ flex: 1, padding: '11px 12px', border: 'none', fontSize: 13, color: 'var(--ink,#0f1419)', fontFamily: 'inherit', outline: 'none', background: 'transparent', minWidth: 0 }}
            value={form.slug}
            onChange={e => setField('slug', e.target.value)}
            placeholder={derivedSlug}
          />
        </div>
        <div style={{ marginTop: 5, fontSize: 12, color: '#15803d', fontWeight: 500 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ verticalAlign: 'middle', marginRight: 4 }}>
            <path d="M2 6l3 3 5-5" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Available
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <FieldLabel optional>Custom domain</FieldLabel>
        <input className="pnw-input" value={form.customDomain} onChange={e => setField('customDomain', e.target.value)} placeholder="e.g. 4bedroomvillainmeadows.com" />
        <FieldHint>Pro plan and above. We handle DNS + SSL.</FieldHint>
      </div>

      <SectionDivider>Options</SectionDivider>

      <ToggleCard
        label="Show sold pricing data"
        desc="Include DLD sold transaction data for this community on your page. Builds buyer trust."
        value={form.showSoldPricing}
        onChange={v => setField('showSoldPricing', v)}
      />

      {/* Transactions card — shown when showSoldPricing is ON */}
      {form.showSoldPricing && (
        <div className="pnw-txn-card" style={{
          background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 10,
          padding: 14, marginBottom: 10, marginTop: -4,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink,#0f1419)', marginBottom: 4 }}>
            Community transactions{form.community ? ` for ${form.community}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginBottom: 12 }}>
            Select which transactions appear on your page
          </div>
          {MOCK_TRANSACTIONS.map((t, i) => (
            <div key={i} onClick={() => {
              const next = [...txnChecked]
              next[i] = !next[i]
              setTxnChecked(next)
            }} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < MOCK_TRANSACTIONS.length - 1 ? '1px solid var(--line-soft,#f0f2f4)' : 'none',
              cursor: 'pointer',
            }}>
              {/* Custom checkbox */}
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: txnChecked[i] ? 'none' : '1.5px solid var(--line,#e6e8eb)',
                background: txnChecked[i] ? 'var(--accent,#2d5a4f)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {txnChecked[i] && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{t.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)' }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ToggleCard
        label="Lead capture form"
        desc="Show the enquiry form on this page. Leads go to your inbox + WhatsApp."
        value={form.showLeadForm}
        onChange={v => setField('showLeadForm', v)}
      />
      <ToggleCard
        label="Show on portfolio"
        desc="Include this property on your public portfolio page."
        value={form.showOnPortfolio}
        onChange={v => setField('showOnPortfolio', v)}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, borderTop: '1px solid var(--line-soft,#f0f2f4)', marginTop: 16 }}>
        <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent', color: 'var(--ink,#0f1419)', fontFamily: 'inherit' }}>← Back to photos</button>
        <button onClick={onContinue} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff', fontFamily: 'inherit' }}>Review &amp; publish →</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 6 — Review & publish
═══════════════════════════════════════════════════════════════ */
function Step6Form({ form, setField: _setField, onBack, onPublish, onSaveDraft, agentSlug, formattedPrice }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
  onBack: () => void
  onPublish: () => void
  onSaveDraft: () => void
  agentSlug: string
  formattedPrice: string
}) {
  const effectiveSlug = form.slug || slugify(form.pageTitle) || 'property-title'
  const pageUrl = form.customDomain ? form.customDomain : `agentpages.io/${agentSlug}/${effectiveSlug}`
  const truncateDesc = form.description.length > 200 ? form.description.slice(0, 200) + '…' : form.description

  const checks = [
    { label: 'Property details complete', ok: !!(form.propertyType && form.pageTitle && form.community) },
    { label: 'Description written', ok: !!form.description },
    { label: 'Photos uploaded', ok: form.photos.length > 0 },
    { label: 'URL configured', ok: !!effectiveSlug },
  ]

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 6 OF 6</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>Review &amp; publish</h1>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Everything looks good? Hit publish and your page goes live instantly.
      </p>

      {/* Summary card */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--line-soft,#f0f2f4)', padding: '24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(15,20,25,0.04)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {form.propertyType && <span style={{ padding: '3px 10px', background: 'var(--accent-soft,#e8f0ed)', color: 'var(--accent,#2d5a4f)', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{form.propertyType}</span>}
          {form.purpose && <span style={{ padding: '3px 10px', background: form.purpose === 'For sale' ? '#dbeafe' : '#fef3c7', color: form.purpose === 'For sale' ? '#1d4ed8' : '#92400e', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{form.purpose}</span>}
        </div>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: 'var(--ink,#0f1419)', marginBottom: 6, lineHeight: 1.25 }}>
          {form.pageTitle || <em style={{ color: 'var(--quiet,#8b95a0)' }}>No title yet</em>}
        </div>
        {form.community && (
          <div style={{ fontSize: 13, color: 'var(--muted,#5a6470)', marginBottom: 14 }}>
            {[form.community, form.subCommunity, form.tower].filter(Boolean).join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink,#0f1419)' }}>{formattedPrice}</span>
          {form.beds && <span style={{ fontSize: 13, color: 'var(--muted,#5a6470)' }}>{form.beds} bed</span>}
          {form.baths && <span style={{ fontSize: 13, color: 'var(--muted,#5a6470)' }}>{form.baths} bath</span>}
          {form.sqft && <span style={{ fontSize: 13, color: 'var(--muted,#5a6470)' }}>{Number(form.sqft).toLocaleString()} sqft</span>}
        </div>
        {form.description && (
          <div style={{ fontSize: 13, color: 'var(--muted,#5a6470)', lineHeight: 1.6, marginBottom: 14, padding: '12px 14px', background: 'var(--paper-warm,#fbfaf7)', borderRadius: 8 }}>
            {truncateDesc}
          </div>
        )}
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--muted,#5a6470)' }}>
          <span>{form.photos.length} photo{form.photos.length !== 1 ? 's' : ''}</span>
          <span>{pageUrl}</span>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--line-soft,#f0f2f4)', padding: '18px 20px', marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--quiet,#8b95a0)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>CHECKLIST</div>
        {checks.map((c, i) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < checks.length - 1 ? '1px solid var(--line-soft,#f0f2f4)' : 'none' }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: c.ok ? '#22c55e' : 'var(--line,#e6e8eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.ok ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="var(--muted,#5a6470)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: c.ok ? 'var(--ink,#0f1419)' : 'var(--muted,#5a6470)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <button onClick={onPublish} style={{
        width: '100%', padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 700,
        cursor: 'pointer', border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff',
        fontFamily: 'inherit', marginBottom: 10,
      }}>Publish property page →</button>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--quiet,#8b95a0)', marginBottom: 16, lineHeight: 1.5 }}>
        Your page will be live immediately and submitted to Google, ChatGPT, Claude, Gemini, Perplexity, and Copilot for indexing.
      </div>

      <button onClick={onSaveDraft} style={{
        width: '100%', padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 500,
        cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent',
        color: 'var(--ink,#0f1419)', fontFamily: 'inherit', marginBottom: 28,
      }}>Save as draft</button>

      <div style={{ paddingTop: 8, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: 'transparent', color: 'var(--ink,#0f1419)', fontFamily: 'inherit' }}>← Back to URL &amp; options</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Google Places Location — Fix 2
   Falls back to LocationPicker if google.maps.places not loaded
═══════════════════════════════════════════════════════════════ */
function GooglePlacesLocation({ form, setField }: {
  form: FormState
  setField: (k: keyof FormState, v: string | boolean | File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markerInstance, setMarkerInstance] = useState<any>(null)

  // Poll for Google Maps availability
  useEffect(() => {
    let attempts = 0
    const check = () => {
      attempts++
      if ((window as any).google?.maps?.places) {
        setMapsLoaded(true)
      } else if (attempts < 20) {
        setTimeout(check, 500)
      }
    }
    check()
  }, [])

  // Initialize autocomplete once maps loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current) return
    const g = (window as any).google
    const autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ae' },
      types: ['geocode', 'establishment'],
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry?.location) return
      const lat = place.geometry.location.lat().toString()
      const lng = place.geometry.location.lng().toString()
      setField('lat', lat)
      setField('lng', lng)
      setField('locationDisplay', place.formatted_address || '')
      setField('placeId', place.place_id || '')

      // Auto-map address components to location hierarchy
      if (place.address_components) {
        let neighbourhood = ''
        let locality = ''
        let sublocality = ''
        for (const comp of place.address_components) {
          if (comp.types.includes('neighborhood')) neighbourhood = comp.long_name
          else if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')) sublocality = comp.long_name
          else if (comp.types.includes('locality')) locality = comp.long_name
        }
        setField('community', neighbourhood || sublocality || locality || '')
        setField('subCommunity', sublocality && neighbourhood ? sublocality : '')
        setField('tower', '')
      }
    })
    return () => {
      try { g.maps.event.clearInstanceListeners(autocomplete) } catch {}
    }
  }, [mapsLoaded])

  // Initialize/update map when lat/lng set
  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current || !form.lat || !form.lng) return
    const g = (window as any).google
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    const pos = new g.maps.LatLng(lat, lng)

    if (!mapInstance) {
      const map = new g.maps.Map(mapDivRef.current, {
        center: pos, zoom: 15,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        styles: [{ featureType: 'all', stylers: [{ saturation: -60 }] }],
      })
      const marker = new g.maps.Marker({
        position: pos, map, draggable: true,
      })
      marker.addListener('dragend', () => {
        const newPos = marker.getPosition()
        if (!newPos) return
        const newLat = newPos.lat().toString()
        const newLng = newPos.lng().toString()
        setField('lat', newLat)
        setField('lng', newLng)
        // Reverse geocode
        const geocoder = new g.maps.Geocoder()
        geocoder.geocode({ location: { lat: newPos.lat(), lng: newPos.lng() } }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            setField('locationDisplay', results[0].formatted_address)
          }
        })
      })
      setMapInstance(map)
      setMarkerInstance(marker)
    } else {
      mapInstance.setCenter(pos)
      if (markerInstance) markerInstance.setPosition(pos)
    }
  }, [mapsLoaded, form.lat, form.lng])

  // Fallback if maps not loaded
  if (!mapsLoaded) {
    return (
      <div style={{ marginBottom: 18 }}>
        <FieldLabel required>Address &amp; community</FieldLabel>
        <LocationPicker
          value={form.community ? { name: form.tower || form.subCommunity || form.community, hierarchy: [form.community, form.subCommunity, form.tower].filter(Boolean).join('>'), type: form.tower ? 'B' : form.subCommunity ? 'C' : 'N' } : null}
          onChange={(loc: LocationValue | null) => {
            if (!loc) {
              setField('community', '')
              setField('subCommunity', '')
              setField('tower', '')
            } else {
              const parts = loc.hierarchy.split('>')
              const locParts = parts.filter(p => !['Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain'].includes(p))
              setField('community', locParts[0] || loc.name)
              setField('subCommunity', locParts[1] || '')
              setField('tower', locParts[2] || '')
            }
          }}
          required
        />
        <FieldHint>Search 15,000+ UAE communities, sub-communities, and buildings</FieldHint>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <FieldLabel required>Address &amp; community</FieldLabel>
      <input
        ref={inputRef}
        className="pnw-input"
        placeholder="Start typing an address or community in UAE…"
        defaultValue={form.locationDisplay}
      />
      <FieldHint>Search UAE addresses, communities, and buildings via Google Maps</FieldHint>

      {/* Interactive map */}
      <div
        ref={mapDivRef}
        style={{
          height: form.lat && form.lng ? 240 : 0,
          borderRadius: 9, overflow: 'hidden', border: form.lat && form.lng ? '1px solid var(--line,#e6e8eb)' : 'none',
          marginTop: form.lat && form.lng ? 10 : 0,
          transition: 'height 0.3s ease',
        }}
      />

      {/* Coordinates + exact toggle */}
      {form.lat && form.lng && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
            {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
            <button
              onClick={() => { setField('lat', ''); setField('lng', ''); setField('locationDisplay', '') }}
              style={{ marginLeft: 10, fontSize: 11, color: 'var(--signal,#c2603a)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >Remove pin</button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', color: 'var(--muted,#5a6470)' }}>
            <div
              onClick={() => setField('locationExact', !form.locationExact)}
              style={{
                width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
                background: form.locationExact ? 'var(--accent,#2d5a4f)' : 'var(--line,#e6e8eb)',
                transition: 'background .15s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: form.locationExact ? 18 : 2, width: 16, height: 16,
                borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            Show exact location on public page (default: off)
          </label>
        </div>
      )}
    </div>
  )
}

/* ── Small shared components ── */
function FieldLabel({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink,#0f1419)', marginBottom: 6, gap: 4 }}>
      {children}
      {required && <span style={{ color: 'var(--signal,#c2603a)', fontSize: 11, fontWeight: 500 }}>*</span>}
      {optional && <span style={{ color: 'var(--quiet,#8b95a0)', fontSize: 11, fontWeight: 400 }}>optional</span>}
    </div>
  )
}
function FieldHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', marginTop: 4, lineHeight: 1.5 }}>{children}</div>
}
function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 14px', borderBottom: '1px solid var(--line-soft,#f0f2f4)', paddingBottom: 8 }}>
      <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  )
}
