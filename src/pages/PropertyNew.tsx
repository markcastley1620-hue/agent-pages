import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'

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
interface FormState {
  propertyType: PropertyType | ''
  purpose: Purpose | ''
  community: string
  subCommunity: string
  tower: string
  addressInternal: string
  pageTitle: string
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

/* ── property type icons ── */
const TYPE_OPTIONS: { label: PropertyType; icon: string }[] = [
  { label: 'Villa', icon: '🏡' },
  { label: 'Apartment', icon: '🏢' },
  { label: 'Townhouse', icon: '🏘️' },
  { label: 'Penthouse', icon: '🌆' },
  { label: 'Plot / Land', icon: '🌿' },
  { label: 'Other', icon: '🔑' },
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
  })

  /* load agent profile */
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('first_name,last_name,email,brokerage,slug').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  /* mark unsaved on form change */
  const setField = (key: keyof FormState, val: string) => {
    setSaved(false)
    setForm(f => ({ ...f, [key]: val }))
    setTimeout(() => setSaved(true), 800)
  }

  /* derived values */
  const titleSlug = slugify(form.pageTitle)
  const agentSlug = profile?.slug || 'your-name'
  const propSlug = titleSlug || 'property-title'
  const initials = getInitials(profile?.first_name, profile?.last_name, user?.email || '')
  const agentName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user?.email || 'Agent' : (user?.email || 'Agent')

  /* location strip */
  const locationParts = [
    form.community,
    form.subCommunity ? `**${form.subCommunity}**` : '',
    form.tower,
  ].filter(Boolean)

  /* right actions for AppShell */
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

        .pnw-type-card:hover { border-color: var(--accent-bright,#3d8a76) !important; background: var(--accent-soft,#e8f0ed) !important; }
        .pnw-purpose-card:hover { border-color: var(--accent-bright,#3d8a76) !important; background: var(--accent-soft,#e8f0ed) !important; }
        .pnw-input { width:100%; padding:11px 14px; background:#fff; border:1px solid var(--line,#e6e8eb); border-radius:9px; font-size:14px; color:var(--ink,#0f1419); font-family:inherit; transition:all .12s; line-height:1.5; }
        .pnw-input::placeholder { color:var(--quiet,#8b95a0); }
        .pnw-input:focus { outline:none; border-color:var(--accent,#2d5a4f); box-shadow:0 0 0 3px rgba(45,90,79,0.08); }
      `}</style>

      <div className="pnw-grid">
        {/* ── LEFT: Step Rail ── */}
        <aside className="pnw-rail" style={{
          background: '#fff', borderRight: '1px solid var(--line-soft,#f0f2f4)',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          {/* Head */}
          <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, marginBottom: 4 }}>NEW PROPERTY</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#0f1419)', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {form.pageTitle || 'Untitled draft'}
            </div>
          </div>

          {/* Progress */}
          <div style={{ padding: '16px 20px 12px' }}>
            <div style={{ height: 4, background: 'var(--line-soft,#f0f2f4)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${(step / 6) * 100}%`, background: 'var(--accent,#2d5a4f)', borderRadius: 2, transition: 'width .3s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted,#5a6470)', fontWeight: 500 }}>
              <strong style={{ color: 'var(--ink,#0f1419)' }}>Step {step} of 6</strong> · {STEPS[step - 1].name}
            </div>
          </div>

          {/* Steps */}
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
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 22, top: 34, bottom: -2, width: 1.5,
                      background: isDone ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)',
                    }} />
                  )}
                  {/* Number circle */}
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
                  {/* Text */}
                  <div style={{ paddingTop: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--ink,#0f1419)' : isDone ? 'var(--ink,#0f1419)' : 'var(--muted,#5a6470)', marginBottom: 1 }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: isDone ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-soft,#f0f2f4)', fontSize: 11, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
            Your draft auto-saves as you type.
          </div>
        </aside>

        {/* ── MIDDLE: Form ── */}
        <main style={{ padding: '48px 56px 120px', overflowY: 'auto', background: 'var(--paper-warm,#fbfaf7)' }}>
          {step === 1 && <Step1Form form={form} setField={setField} onContinue={() => setStep(2)} />}
          {step === 2 && <StepPlaceholder n={2} title="Specs & price" onBack={() => setStep(1)} onContinue={() => setStep(3)} />}
          {step === 3 && <StepPlaceholder n={3} title="AI description" onBack={() => setStep(2)} onContinue={() => setStep(4)} />}
          {step === 4 && <StepPlaceholder n={4} title="Photos" onBack={() => setStep(3)} onContinue={() => setStep(5)} />}
          {step === 5 && <StepPlaceholder n={5} title="URL & options" onBack={() => setStep(4)} onContinue={() => setStep(6)} />}
          {step === 6 && <StepPlaceholder n={6} title="Review & publish" onBack={() => setStep(5)} onContinue={() => navigate('/properties')} />}
        </main>

        {/* ── RIGHT: Live Preview ── */}
        <aside className="pnw-preview-col" style={{
          background: 'var(--paper-warm,#fbfaf7)', borderLeft: '1px solid var(--line-soft,#f0f2f4)',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '28px 20px',
        }}>
          {/* Preview header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600 }}>LIVE PREVIEW</div>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pnw-pulse 2s infinite' }} />
            </div>
            {/* Device toggle */}
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
                <span style={{ color: 'var(--quiet,#8b95a0)' }}>agentpages.io/{agentSlug}/</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{propSlug}</span>
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

              {/* Content */}
              <div style={{ padding: '14px 16px' }}>
                {/* Type chip */}
                {form.propertyType && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#dcfce7', borderRadius: 20, fontSize: 9.5, fontWeight: 600, color: '#15803d', marginBottom: 8 }}>
                    ★ {form.propertyType}
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--quiet,#8b95a0)' }}>AED —</div>
                  {form.purpose && (
                    <div style={{ padding: '2px 8px', background: form.purpose === 'For sale' ? '#dbeafe' : '#fef3c7', color: form.purpose === 'For sale' ? '#1d4ed8' : '#92400e', borderRadius: 20, fontSize: 9.5, fontWeight: 600 }}>
                      {form.purpose}
                    </div>
                  )}
                </div>

                {/* Specs grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14, background: 'var(--paper-warm,#fbfaf7)', borderRadius: 8, padding: '10px 8px' }}>
                  {['Beds', 'Baths', 'Sqft', 'Plot'].map(label => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--quiet,#8b95a0)', marginBottom: 1 }}>—</div>
                      <div style={{ fontSize: 9, color: 'var(--quiet,#8b95a0)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* AI description placeholder */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, marginBottom: 6 }}>ABOUT THIS PROPERTY</div>
                  <div style={{ border: '1.5px dashed var(--line,#e6e8eb)', borderRadius: 6, padding: '10px 12px', fontSize: 10, color: 'var(--quiet,#8b95a0)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    AI description appears in step 3
                  </div>
                </div>

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
                    {['📞 Call', '💬 WhatsApp'].map(label => (
                      <div key={label} style={{
                        flex: 1, padding: '5px 0', background: '#fff', borderRadius: 6,
                        textAlign: 'center', fontSize: 9.5, fontWeight: 600, color: '#15803d', cursor: 'default',
                      }}>{label}</div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: 9, color: 'var(--quiet,#8b95a0)', paddingBottom: 8 }}>
                  Powered by Agent Pages
                </div>
              </div>
            </div>
          </div>

          {/* Tip card */}
          <div style={{
            marginTop: 14, background: '#dcfce7', borderRadius: 10, padding: '12px 14px',
            fontSize: 11, color: '#15803d', lineHeight: 1.6,
          }}>
            💡 <strong>Watch the URL build up</strong> — your title turns into the public URL slug. You can fully customise it in step 5.
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

/* ── Step 1 Form ── */
function Step1Form({ form, setField, onContinue }: { form: FormState; setField: (k: keyof FormState, v: string) => void; onContinue: () => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP 1 OF 6</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 10 }}>Let's start with the basics</h1>
      <p style={{ fontSize: 15, color: 'var(--muted,#5a6470)', marginBottom: 36, lineHeight: 1.6, maxWidth: 560 }}>
        Watch the live preview on the right update as you fill in details — your property page builds in real time.
      </p>

      {/* Property type */}
      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Property type</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {TYPE_OPTIONS.map(({ label, icon }) => {
            const isSelected = form.propertyType === label
            return (
              <div key={label} className="pnw-type-card" onClick={() => setField('propertyType', label)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 12px', borderRadius: 10, cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent,#2d5a4f)' : '1.5px solid var(--line,#e6e8eb)',
                  background: isSelected ? 'var(--accent-soft,#e8f0ed)' : '#fff',
                  transition: 'all .12s',
                }}>
                <div style={{ fontSize: 26, lineHeight: 1, background: 'var(--paper-warm,#fbfaf7)', padding: 8, borderRadius: 7 }}>{icon}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Listing purpose */}
      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Listing purpose</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {(['For sale', 'For rent'] as const).map(p => {
            const isSelected = form.purpose === p
            return (
              <div key={p} className="pnw-purpose-card" onClick={() => setField('purpose', p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '16px 18px', borderRadius: 10, cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent,#2d5a4f)' : '1.5px solid var(--line,#e6e8eb)',
                  background: isSelected ? 'var(--accent-soft,#e8f0ed)' : '#fff',
                  transition: 'all .12s',
                }}>
                <div style={{ fontSize: 20 }}>{p === 'For sale' ? '🏷️' : '🔄'}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>{p}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Location section */}
      <SectionDivider>Location</SectionDivider>

      <div style={{ marginBottom: 16 }}>
        <FieldLabel required>Community</FieldLabel>
        <input className="pnw-input" value={form.community} onChange={e => setField('community', e.target.value)} placeholder="e.g. Dubai Marina, Downtown Dubai…" />
        <FieldHint>Start typing — suggestions coming soon</FieldHint>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <FieldLabel optional>Sub-community</FieldLabel>
          <input className="pnw-input" value={form.subCommunity} onChange={e => setField('subCommunity', e.target.value)} placeholder="e.g. Meadows 5" />
        </div>
        <div>
          <FieldLabel optional>Tower / Building</FieldLabel>
          <input className="pnw-input" value={form.tower} onChange={e => setField('tower', e.target.value)} placeholder="e.g. Burj Views A" />
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Address (internal only)</FieldLabel>
        <input className="pnw-input" value={form.addressInternal} onChange={e => setField('addressInternal', e.target.value)} placeholder="e.g. Unit 2304, Tower B…" />
        <FieldHint>Never appears on the public page</FieldHint>
      </div>

      {/* Page title section */}
      <SectionDivider>Page title</SectionDivider>

      <div style={{ marginBottom: 28 }}>
        <FieldLabel required>Title</FieldLabel>
        <input className="pnw-input" value={form.pageTitle} onChange={e => setField('pageTitle', e.target.value)} placeholder="e.g. Stunning 3BR Villa with Pool in Emirates Hills" />
        <FieldHint>Be descriptive — this becomes your headline and URL slug</FieldHint>
      </div>

      {/* Footer bar */}
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

/* ── Placeholder step ── */
function StepPlaceholder({ n, title, onBack, onContinue }: { n: number; title: string; onBack: () => void; onContinue: () => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 600, marginBottom: 12 }}>STEP {n} OF 6</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 16 }}>{title}</h1>
      <div style={{ padding: '48px 32px', background: '#fff', borderRadius: 12, border: '1.5px dashed var(--line,#e6e8eb)', textAlign: 'center', color: 'var(--muted,#5a6470)', fontSize: 14, marginBottom: 32 }}>
        Coming soon — {title}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid var(--line,#e6e8eb)', background: '#fff', color: 'var(--ink,#0f1419)', fontFamily: 'inherit' }}>← Back</button>
        <button onClick={onContinue} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--accent,#2d5a4f)', color: '#fff', fontFamily: 'inherit' }}>
          {n < 6 ? 'Continue →' : 'Publish property'}
        </button>
      </div>
    </div>
  )
}

/* ── Small shared components ── */
function FieldLabel({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink,#0f1419)', marginBottom: 7, gap: 4 }}>
      {children}
      {required && <span style={{ color: 'var(--signal,#c2603a)', fontSize: 11, fontWeight: 500 }}>*</span>}
      {optional && <span style={{ color: 'var(--quiet,#8b95a0)', fontSize: 11, fontWeight: 400 }}>optional</span>}
    </div>
  )
}
function FieldHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', marginTop: 5, lineHeight: 1.5 }}>{children}</div>
}
function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--line-soft,#f0f2f4)' }} />
    </div>
  )
}
