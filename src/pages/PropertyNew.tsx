import { useState, useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import '../styles/wizard.css'

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

const STEP_META = [
  { name: 'The basics', meta: 'Type, beds, location' },
  { name: 'Specs & price', meta: 'Size, price, features' },
  { name: 'AI description', meta: 'Auto-written, editable' },
  { name: 'Photos', meta: 'Hero + gallery' },
  { name: 'URL & options', meta: 'Slug, pricing data' },
  { name: 'Review & publish', meta: 'Final check, go live' },
]

type PropertyType = 'Villa' | 'Apartment' | 'Townhouse' | 'Penthouse' | 'Plot / Land' | 'Other'
type Purpose = 'for-sale' | 'for-rent'
type Tone = 'Refined' | 'Warm & family' | 'Investor'
type LeadCapture = 'all' | 'inbox'

interface FormState {
  propertyType: PropertyType
  purpose: Purpose
  community: string
  subCommunity: string
  tower: string
  addressInternal: string
  pageTitle: string
  bedrooms: string
  bathrooms: string
  builtUpSqft: string
  plotSqft: string
  askingPrice: string
  commission: string
  showPrice: boolean
  furnishing: string
  view: string
  parking: string
  completionStatus: string
  topFeatures: string[]
  dldPermit: string
  serviceCharge: string
  aiDescription: string
  tone: Tone
  slug: string
  showCommunityPricing: boolean
  showMap: boolean
  showNearby: boolean
  submitToAI: boolean
  leadCapture: LeadCapture
}

const AI_DESCRIPTION_PLACEHOLDER = `A meticulously maintained four-bedroom Type 7 villa in The Meadows 7, offering 3,850 sqft of refined family living on a generous 5,200 sqft plot. The home opens onto a fully landscaped garden with a private heated pool and east-facing terrace — ideal for morning coffee or weekend entertaining.

The ground floor features open-plan living and dining flowing into a fitted kitchen with breakfast island, plus a guest bedroom suite ideal for visiting family. Upstairs, the principal suite includes a walk-in dressing area and balcony, with three further bedrooms each enjoying ensuite bathrooms.

Walking distance to Meadows Village and the lake circuit, with Sunmarke School and Dubai British School both within a four-minute drive. The Type 7 layout is widely considered the most sought-after in the community for its plot-to-built ratio and resale strength.`

const AGENT_SLUG = 'markcastley1620'
const WORKER_HOST = 'agent-pages.markcastley1620.workers.dev'

export default function PropertyNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [aiTitleSuggestions, setAiTitleSuggestions] = useState([
    '4-bedroom Type 7 villa with private pool · The Meadows',
    'Refurbished 4BR family villa with heated pool, Meadows 7',
    'Landscaped 4-bedroom villa on 5,200 sqft plot — The Meadows',
  ])

  const [form, setForm] = useState<FormState>({
    propertyType: 'Villa',
    purpose: 'for-sale',
    community: '',
    subCommunity: '',
    tower: '',
    addressInternal: '',
    pageTitle: '',
    bedrooms: '4',
    bathrooms: '3',
    builtUpSqft: '',
    plotSqft: '',
    askingPrice: '',
    commission: '',
    showPrice: true,
    furnishing: 'Unfurnished',
    view: '',
    parking: '1',
    completionStatus: 'Vacant on transfer',
    topFeatures: ['', '', '', ''],
    dldPermit: '',
    serviceCharge: '',
    aiDescription: AI_DESCRIPTION_PLACEHOLDER,
    tone: 'Refined',
    slug: '',
    showCommunityPricing: true,
    showMap: true,
    showNearby: true,
    submitToAI: true,
    leadCapture: 'all',
  })

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => {
      const next = { ...f, [key]: value }
      if (key === 'pageTitle' && !f.slug) {
        next.slug = slugify(value as string)
      }
      return next
    })
  }

  function inputHandler(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setField(key, e.target.value as never)
    }
  }

  function goStep(n: number) {
    if (n > maxReached) return
    setCurrentStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nextStep() {
    const err = validateStep(currentStep)
    if (err) { setError(err); return }
    setError('')
    const next = currentStep + 1
    setCurrentStep(next)
    setMaxReached(r => Math.max(r, next))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prevStep() {
    setError('')
    setCurrentStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function validateStep(step: number): string {
    if (step === 1) {
      if (!form.pageTitle.trim()) return 'Page title is required'
      if (!form.community.trim()) return 'Community is required'
    }
    if (step === 2) {
      if (!form.askingPrice.trim()) return 'Asking price is required'
    }
    return ''
  }

  async function handlePhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 20 - photos.length)
    if (!files.length) return
    const urls = files.map(f => URL.createObjectURL(f))
    setPhotos(p => [...p, ...files])
    setPhotoUrls(p => [...p, ...urls])
  }

  function removePhoto(i: number) {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPhotoUrls(p => p.filter((_, idx) => idx !== i))
  }

  function regenTitles() {
    const variants = [
      [
        'Spacious 4BR family villa with pool in The Meadows',
        'Beautifully maintained 4-bed villa — Meadows 7, private pool',
        'Type 7 villa with heated pool and landscaped gardens',
      ],
      [
        'Move-in ready 4-bedroom villa · pool · Meadows 7',
        'Family-sized 4BR with private pool in The Meadows',
        'Premium Type 7 villa, vacant on transfer · The Meadows',
      ],
    ]
    setAiTitleSuggestions(variants[Math.floor(Math.random() * variants.length)])
  }

  async function publish(status: 'draft' | 'live') {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      // Upload photos
      const photoStorageUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('agent-pages')
          .upload(path, photo)
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('agent-pages').getPublicUrl(path)
        photoStorageUrls.push(publicUrl)
      }

      const slug = form.slug || slugify(form.pageTitle)
      const { error: insertErr } = await supabase
        .from('properties')
        .insert({
          agent_id: user.id,
          status,
          title: form.pageTitle,
          slug,
          property_type: form.propertyType,
          purpose: form.purpose,
          community: form.community,
          sub_community: form.subCommunity,
          tower: form.tower,
          address_internal: form.addressInternal,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          built_up_sqft: form.builtUpSqft ? parseFloat(form.builtUpSqft.replace(/,/g, '')) : null,
          plot_sqft: form.plotSqft ? parseFloat(form.plotSqft.replace(/,/g, '')) : null,
          asking_price_aed: form.askingPrice ? parseFloat(form.askingPrice.replace(/,/g, '')) : null,
          show_price: form.showPrice,
          furnishing: form.furnishing,
          view_desc: form.view,
          parking_spaces: form.parking,
          completion_status: form.completionStatus,
          top_features: form.topFeatures.filter(Boolean),
          dld_permit_number: form.dldPermit,
          service_charge_psqft: form.serviceCharge ? parseFloat(form.serviceCharge) : null,
          description_full: form.aiDescription,
          description_tone: form.tone,
          photos: photoStorageUrls,
          show_community_pricing: form.showCommunityPricing,
          show_map: form.showMap,
          show_nearby: form.showNearby,
          submit_to_ai: form.submitToAI,
          lead_capture: form.leadCapture,
        })
      if (insertErr) throw insertErr
      navigate('/properties')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const progressPct = ((currentStep - 1) / 5) * 100

  // Rail step state helper
  function stepClass(n: number) {
    if (n < currentStep) return 'wiz-rail-step done'
    if (n === currentStep) return 'wiz-rail-step active'
    if (n > maxReached) return 'wiz-rail-step locked'
    return 'wiz-rail-step'
  }

  const typesWithPlot: PropertyType[] = ['Villa', 'Townhouse', 'Plot / Land']

  return (
    <div className="wiz-page">
      {/* TOP BAR */}
      <div className="wiz-topbar">
        <div className="wiz-topbar-left">
          <div className="wiz-topbar-brand">
            <div className="wiz-topbar-logo">a</div>
            <div className="wiz-topbar-name">Agent Pages</div>
          </div>
          <div className="wiz-topbar-crumb">
            <a onClick={() => navigate('/properties')}>Properties</a>
            <span className="wiz-topbar-crumb-sep">/</span>
            <span className="wiz-topbar-crumb-current">Add new property</span>
          </div>
        </div>
        <div className="wiz-topbar-right">
          <button className="wiz-topbar-btn ghost" onClick={() => navigate('/properties')}>
            Save &amp; exit
          </button>
        </div>
      </div>

      <div className="wiz-layout">
        {/* PROGRESS RAIL */}
        <aside className="wiz-rail">
          <div className="wiz-rail-head">
            <div className="wiz-rail-eyebrow">New property</div>
            <div className="wiz-rail-title">{form.pageTitle || 'Untitled draft'}</div>
          </div>
          <div className="wiz-rail-progress">
            <div className="wiz-rail-progress-bar">
              <div className="wiz-rail-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="wiz-rail-progress-label">
              <strong>{currentStep}</strong> of 6 · {STEP_META[currentStep - 1].name}
            </div>
          </div>
          <div className="wiz-rail-steps">
            {STEP_META.map((s, i) => {
              const n = i + 1
              const cls = stepClass(n)
              const isDone = n < currentStep
              const isLast = n === 6
              return (
                <div key={n} className={cls} onClick={() => goStep(n)}>
                  <div className="wiz-rail-step-marker">
                    {isDone ? (
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : n}
                  </div>
                  {!isLast && <div className="wiz-rail-step-line" />}
                  <div className="wiz-rail-step-body">
                    <div className="wiz-rail-step-name">{s.name}</div>
                    <div className="wiz-rail-step-meta">{s.meta}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="wiz-rail-footer">
            Your draft is <strong>auto-saved</strong>. You can close this and come back anytime.
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="wiz-main">
          {error && <div className="wiz-error">{error}</div>}

          {/* ── STEP 1: BASICS ── */}
          {currentStep === 1 && (
            <div className="wiz-step-screen">
              <div className="wiz-step-eyebrow">Step 1 of 6</div>
              <h1 className="wiz-step-title">Let's start with the basics</h1>
              <p className="wiz-step-sub">Just the essentials — what kind of property, where it is, and what to call it. You can refine everything as you go.</p>

              <div className="wiz-with-hint">
                <div>
                  {/* Property type */}
                  <div className="wiz-field">
                    <div className="wiz-field-label">Property type<span className="wiz-field-required">required</span></div>
                    <div className="wiz-choice-grid-3">
                      {(['Villa', 'Apartment', 'Townhouse', 'Penthouse', 'Plot / Land', 'Other'] as PropertyType[]).map(t => (
                        <div
                          key={t}
                          className={`wiz-choice${form.propertyType === t ? ' selected' : ''}`}
                          onClick={() => setField('propertyType', t)}
                        >
                          <div className="wiz-choice-icon">
                            <svg viewBox="0 0 24 24">
                              {t === 'Villa' && <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />}
                              {t === 'Apartment' && <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 8h6M9 12h6M9 16h6" /></>}
                              {t === 'Townhouse' && <path d="M5 21V8l7-5 7 5v13M5 14h14" />}
                              {t === 'Penthouse' && <path d="M3 21V10l9-7 9 7v11M9 21V14h6v7" />}
                              {t === 'Plot / Land' && <><rect x="2" y="6" width="20" height="12" rx="1" /><path d="M2 10h20" /></>}
                              {t === 'Other' && <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M7 12h10" /></>}
                            </svg>
                          </div>
                          <div className="wiz-choice-text">{t}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="wiz-field">
                    <div className="wiz-field-label">Listing purpose<span className="wiz-field-required">required</span></div>
                    <div className="wiz-choice-grid">
                      <div className={`wiz-choice${form.purpose === 'for-sale' ? ' selected' : ''}`} onClick={() => setField('purpose', 'for-sale')}>
                        <div className="wiz-choice-icon"><svg viewBox="0 0 24 24"><path d="M12 2v20M5 5h11a3.5 3.5 0 010 7H5" /></svg></div>
                        <div className="wiz-choice-text">For sale</div>
                      </div>
                      <div className={`wiz-choice${form.purpose === 'for-rent' ? ' selected' : ''}`} onClick={() => setField('purpose', 'for-rent')}>
                        <div className="wiz-choice-icon"><svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V21H3V9.5z" /><rect x="9" y="13" width="6" height="8" /></svg></div>
                        <div className="wiz-choice-text">For rent</div>
                      </div>
                    </div>
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>Location</div>

                  <div className="wiz-field">
                    <div className="wiz-field-label">Community<span className="wiz-field-required">required</span></div>
                    <input className="wiz-input" placeholder="e.g. The Meadows" value={form.community} onChange={inputHandler('community')} />
                    <div className="wiz-field-hint">Start typing and we'll suggest registered Dubai communities.</div>
                  </div>

                  <div className="wiz-field-row">
                    <div className="wiz-field">
                      <div className="wiz-field-label">Sub-community<span className="wiz-field-optional">optional</span></div>
                      <input className="wiz-input" placeholder="e.g. Meadows 7" value={form.subCommunity} onChange={inputHandler('subCommunity')} />
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Tower / Building<span className="wiz-field-optional">optional</span></div>
                      <input className="wiz-input" placeholder="Apartments only" value={form.tower} onChange={inputHandler('tower')} />
                    </div>
                  </div>

                  <div className="wiz-field">
                    <div className="wiz-field-label">Address (internal only)<span className="wiz-field-optional">optional</span></div>
                    <input className="wiz-input" placeholder="Plot/Villa number — never shown publicly" value={form.addressInternal} onChange={inputHandler('addressInternal')} />
                    <div className="wiz-field-hint">For your records only. Never appears on the public page.</div>
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>What buyers will see</div>

                  <div className="wiz-field">
                    <div className="wiz-field-label">Page title<span className="wiz-field-required">required</span></div>
                    <div className="wiz-title-row">
                      <input
                        className="wiz-input"
                        placeholder="e.g. 4-bedroom villa with private pool"
                        value={form.pageTitle}
                        onChange={e => {
                          setField('pageTitle', e.target.value)
                          if (!form.slug) setField('slug', slugify(e.target.value))
                        }}
                      />
                      <button className="wiz-btn-ai-suggest" type="button" onClick={() => setShowAiSuggestions(s => !s)}>
                        <span className="wiz-btn-ai-suggest-icon">
                          <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z" /></svg>
                        </span>
                        AI suggest
                      </button>
                    </div>
                    <div className="wiz-field-hint">
                      This is the headline at the top of your public page.{' '}
                      <a onClick={() => setShowAiSuggestions(true)}>Let AI write it for you</a>, or write your own.
                    </div>
                    {showAiSuggestions && (
                      <div style={{ marginTop: 10 }}>
                        <div className="wiz-ai-suggest-label">Pick one, or regenerate for more options</div>
                        <div className="wiz-ai-suggest-list">
                          {aiTitleSuggestions.map((t, i) => (
                            <div key={i} className="wiz-ai-suggest-row" onClick={() => {
                              setField('pageTitle', t)
                              setField('slug', slugify(t))
                              setShowAiSuggestions(false)
                            }}>{t}</div>
                          ))}
                        </div>
                        <button className="wiz-ai-suggest-regen" type="button" onClick={regenTitles}>
                          <svg viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="wiz-side-hint">
                  <div className="wiz-side-hint-icon">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  </div>
                  <h5>What gets shown publicly?</h5>
                  <p>Your <strong>community, sub-community, page title, and property type</strong> appear on the public page.</p>
                  <p>The plot/villa number you enter stays internal — it's only for your records.</p>
                </div>
              </div>

              <div className="wiz-step-footer">
                <div className="wiz-step-footer-left">
                  <button className="wiz-btn wiz-btn-ghost" onClick={() => navigate('/properties')}>Cancel</button>
                </div>
                <div className="wiz-step-footer-right">
                  <button className="wiz-btn wiz-btn-primary" onClick={nextStep}>
                    Continue
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: SPECS & PRICE ── */}
          {currentStep === 2 && (
            <div className="wiz-step-screen">
              <div className="wiz-step-eyebrow">Step 2 of 6</div>
              <h1 className="wiz-step-title">Size, price, and the key details</h1>
              <p className="wiz-step-sub">The numbers buyers look for first. All editable later — you can always come back.</p>

              <div className="wiz-with-hint">
                <div>
                  <div className="wiz-field-group-title">Configuration</div>
                  <div className={typesWithPlot.includes(form.propertyType) ? 'wiz-field-row-4' : 'wiz-field-row-3'}>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Bedrooms</div>
                      <select className="wiz-select" value={form.bedrooms} onChange={inputHandler('bedrooms')}>
                        {['Studio','1','2','3','4','5','6+'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Bathrooms</div>
                      <select className="wiz-select" value={form.bathrooms} onChange={inputHandler('bathrooms')}>
                        {['1','2','3','4','5','6+'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Built-up</div>
                      <div className="wiz-field-suffix">
                        <input className="wiz-input" placeholder="0" value={form.builtUpSqft} onChange={inputHandler('builtUpSqft')} />
                        <span className="wiz-suffix">sqft</span>
                      </div>
                    </div>
                    {typesWithPlot.includes(form.propertyType) && (
                      <div className="wiz-field">
                        <div className="wiz-field-label">Plot size</div>
                        <div className="wiz-field-suffix">
                          <input className="wiz-input" placeholder="0" value={form.plotSqft} onChange={inputHandler('plotSqft')} />
                          <span className="wiz-suffix">sqft</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>Pricing</div>
                  <div className="wiz-field-row">
                    <div className="wiz-field">
                      <div className="wiz-field-label">Asking price<span className="wiz-field-required">required</span></div>
                      <div className="wiz-field-prefix">
                        <span className="wiz-prefix">AED</span>
                        <input className="wiz-input" placeholder="0" value={form.askingPrice} onChange={inputHandler('askingPrice')} />
                      </div>
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Commission<span className="wiz-field-optional">internal</span></div>
                      <div className="wiz-field-suffix">
                        <input className="wiz-input" placeholder="2.0" value={form.commission} onChange={inputHandler('commission')} />
                        <span className="wiz-suffix">%</span>
                      </div>
                      <div className="wiz-field-hint">For your records only.</div>
                    </div>
                  </div>

                  <div className="wiz-toggle-row" onClick={() => setField('showPrice', !form.showPrice)}>
                    <div className="wiz-toggle-row-text">
                      <div className="wiz-toggle-row-title">
                        Show price publicly <span className="wiz-recommended-tag">Recommended</span>
                      </div>
                      <div className="wiz-toggle-row-desc">When on, the price appears on your public page. When off, it shows "Price on request".</div>
                    </div>
                    <div className={`wiz-toggle${form.showPrice ? ' on' : ''}`} />
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>Key details</div>
                  <div className="wiz-field-row">
                    <div className="wiz-field">
                      <div className="wiz-field-label">Furnishing</div>
                      <select className="wiz-select" value={form.furnishing} onChange={inputHandler('furnishing')}>
                        {['Unfurnished','Semi-furnished','Furnished'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">View</div>
                      <input className="wiz-input" placeholder="e.g. Burj Khalifa, garden, marina" value={form.view} onChange={inputHandler('view')} />
                    </div>
                  </div>
                  <div className="wiz-field-row">
                    <div className="wiz-field">
                      <div className="wiz-field-label">Parking</div>
                      <select className="wiz-select" value={form.parking} onChange={inputHandler('parking')}>
                        {['None','1','2','3','4+'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Completion status</div>
                      <select className="wiz-select" value={form.completionStatus} onChange={inputHandler('completionStatus')}>
                        {['Vacant on transfer','Tenanted (rented out)','Owner-occupied','Off-plan'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>
                    Top features <span style={{ fontWeight: 400, color: 'var(--quiet)', textTransform: 'none', letterSpacing: 'normal' }}>— used by AI to write your description</span>
                  </div>
                  <div className="wiz-field">
                    <div className="wiz-field-label">What makes this property stand out?<span className="wiz-field-optional">recommended</span></div>
                    <div className="wiz-field-hint" style={{ marginTop: 0, marginBottom: 10 }}>Add up to 4. These show as feature cards and feed the AI when writing your description.</div>
                    {form.topFeatures.map((f, i) => (
                      <div key={i} className="wiz-field" style={{ marginBottom: 10 }}>
                        <input
                          className="wiz-input"
                          placeholder={`Feature ${i + 1}`}
                          value={f}
                          onChange={e => {
                            const next = [...form.topFeatures]
                            next[i] = e.target.value
                            setField('topFeatures', next)
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>Compliance</div>
                  <div className="wiz-field-row">
                    <div className="wiz-field">
                      <div className="wiz-field-label">DLD permit number<span className="wiz-field-required">required</span></div>
                      <input className="wiz-input" placeholder="e.g. 7129384510" value={form.dldPermit} onChange={inputHandler('dldPermit')} />
                      <div className="wiz-field-hint">Required to publish under RERA guidelines.</div>
                    </div>
                    <div className="wiz-field">
                      <div className="wiz-field-label">Service charge<span className="wiz-field-optional">optional</span></div>
                      <div className="wiz-field-suffix">
                        <input className="wiz-input" placeholder="0" value={form.serviceCharge} onChange={inputHandler('serviceCharge')} />
                        <span className="wiz-suffix">/sqft</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wiz-side-hint">
                  <div className="wiz-side-hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>
                  </div>
                  <h5>What helps you rank?</h5>
                  <p>Filled-in specs help your page rank on Google and get indexed by AI models. <strong>The more complete, the better.</strong></p>
                  <p>The DLD permit number is required by RERA before publication.</p>
                </div>
              </div>

              <div className="wiz-step-footer">
                <div className="wiz-step-footer-left">
                  <button className="wiz-btn wiz-btn-outline" onClick={prevStep}>
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Back
                  </button>
                </div>
                <div className="wiz-step-footer-right">
                  <button className="wiz-btn wiz-btn-ghost" onClick={() => navigate('/properties')}>Save &amp; exit</button>
                  <button className="wiz-btn wiz-btn-primary" onClick={nextStep}>
                    Continue<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: AI DESCRIPTION ── */}
          {currentStep === 3 && (
            <div className="wiz-step-screen">
              <div className="wiz-step-eyebrow">Step 3 of 6</div>
              <h1 className="wiz-step-title">Your AI-written description</h1>
              <p className="wiz-step-sub">We've drafted a unique, SEO-optimised description based on the details you've added. Edit anything you like, or regenerate for a fresh take.</p>

              <div className="wiz-with-hint">
                <div>
                  <div className="wiz-ai-desc-block">
                    <div className="wiz-ai-desc-head">
                      <div className="wiz-ai-desc-eyebrow">
                        <span className="wiz-ai-desc-eyebrow-icon">
                          <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z" /></svg>
                        </span>
                        AI-generated · unique
                      </div>
                      <button
                        className="wiz-ai-desc-regen"
                        type="button"
                        onClick={() => setField('aiDescription', AI_DESCRIPTION_PLACEHOLDER)}
                      >
                        <svg viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                        Regenerate
                      </button>
                    </div>
                    <div className="wiz-ai-desc-body">
                      <textarea
                        className="wiz-textarea"
                        style={{ border: 'none', padding: 0, background: 'transparent', minHeight: 160, resize: 'vertical' }}
                        value={form.aiDescription}
                        onChange={inputHandler('aiDescription')}
                      />
                    </div>
                    <div className="wiz-ai-desc-foot">
                      <span>Built from your top features</span>
                      <a onClick={() => {}}>Edit manually</a>
                    </div>
                  </div>

                  <div className="wiz-field" style={{ marginTop: 20 }}>
                    <div className="wiz-field-label">Tone of voice<span className="wiz-field-optional">optional</span></div>
                    <div className="wiz-choice-grid-3">
                      {(['Refined', 'Warm & family', 'Investor'] as Tone[]).map(t => (
                        <div key={t} className={`wiz-choice${form.tone === t ? ' selected' : ''}`} onClick={() => setField('tone', t)}>
                          <div className="wiz-choice-icon">
                            <svg viewBox="0 0 24 24">
                              {t === 'Refined' && <path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z" />}
                              {t === 'Warm & family' && <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>}
                              {t === 'Investor' && <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></>}
                            </svg>
                          </div>
                          <div className="wiz-choice-text">{t}</div>
                        </div>
                      ))}
                    </div>
                    <div className="wiz-field-hint">Pick a tone and regenerate — the AI rewrites accordingly.</div>
                  </div>
                </div>

                <div className="wiz-side-hint">
                  <div className="wiz-side-hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2L9 9l-7 .8 5.2 4.6L5 22l7-4 7 4-1.2-7.6L23 9.8 16 9z" /></svg>
                  </div>
                  <h5>Why AI descriptions?</h5>
                  <p>Every property gets a <strong>one-of-a-kind</strong> description. No duplicate-content penalty from Google.</p>
                  <p>Regenerate up to 5 times for free — pick the version you like.</p>
                </div>
              </div>

              <div className="wiz-step-footer">
                <div className="wiz-step-footer-left">
                  <button className="wiz-btn wiz-btn-outline" onClick={prevStep}>
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Back
                  </button>
                </div>
                <div className="wiz-step-footer-right">
                  <button className="wiz-btn wiz-btn-ghost" onClick={() => navigate('/properties')}>Save &amp; exit</button>
                  <button className="wiz-btn wiz-btn-primary" onClick={nextStep}>
                    Continue<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: PHOTOS ── */}
          {currentStep === 4 && (
            <div className="wiz-step-screen">
              <div className="wiz-step-eyebrow">Step 4 of 6</div>
              <h1 className="wiz-step-title">Upload photos</h1>
              <p className="wiz-step-sub">The hero photo is what sells the page. Add 5+ for the best results — drag to reorder, click the badge to set hero.</p>

              <div className="wiz-with-hint">
                <div>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />

                  <div className="wiz-photo-upload-zone" onClick={() => fileRef.current?.click()}>
                    <div className="wiz-photo-upload-icon">
                      <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                    </div>
                    <div className="wiz-photo-upload-title">Drop photos here, or click to browse</div>
                    <div className="wiz-photo-upload-hint">JPG or PNG · up to <strong>10 MB</strong> per photo · max 20 photos</div>
                  </div>

                  {photoUrls.length > 0 && (
                    <>
                      <div className="wiz-field-group-title">
                        Your gallery <span style={{ fontWeight: 400, color: 'var(--quiet)', textTransform: 'none', letterSpacing: 'normal' }}>— {photoUrls.length} of 20 added</span>
                      </div>
                      <div className="wiz-photo-grid">
                        {photoUrls.map((url, i) => (
                          <div key={i} className={`wiz-photo-tile${i === 0 ? ' hero' : ''}`}>
                            <img src={url} alt={`Photo ${i + 1}`} />
                            {i === 0 && <div className="wiz-photo-tile-tag">HERO</div>}
                            <button className="wiz-photo-tile-remove" onClick={() => removePhoto(i)}>
                              <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        {photoUrls.length < 20 && (
                          <div className="wiz-photo-tile empty" onClick={() => fileRef.current?.click()}>
                            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="wiz-side-hint">
                  <div className="wiz-side-hint-icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
                  </div>
                  <h5>Photo tips</h5>
                  <p>The <strong>hero photo</strong> is what shows on Google previews, social shares, and the top of your page.</p>
                  <p>Wide-angle, daylight, no clutter. Landscape orientation works best.</p>
                </div>
              </div>

              <div className="wiz-step-footer">
                <div className="wiz-step-footer-left">
                  <button className="wiz-btn wiz-btn-outline" onClick={prevStep}>
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Back
                  </button>
                </div>
                <div className="wiz-step-footer-right">
                  <button className="wiz-btn wiz-btn-ghost" onClick={() => navigate('/properties')}>Save &amp; exit</button>
                  <button className="wiz-btn wiz-btn-primary" onClick={nextStep}>
                    Continue<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: URL & OPTIONS ── */}
          {currentStep === 5 && (
            <div className="wiz-step-screen">
              <div className="wiz-step-eyebrow">Step 5 of 6</div>
              <h1 className="wiz-step-title">Your URL and page options</h1>
              <p className="wiz-step-sub">Set how the URL looks, and choose what extras to show on the public page.</p>

              <div className="wiz-with-hint">
                <div>
                  <div className="wiz-field-group-title">URL</div>
                  <div className="wiz-url-builder">
                    <div className="wiz-url-builder-label">Your default URL</div>
                    <div className="wiz-url-builder-row">
                      <span className="wiz-url-builder-prefix">{WORKER_HOST}/{AGENT_SLUG}/</span>
                      <input
                        className="wiz-url-builder-slug-input"
                        value={form.slug}
                        onChange={e => setField('slug', e.target.value)}
                        placeholder="your-property-slug"
                      />
                    </div>
                    <div className="wiz-url-builder-hint">
                      Auto-generated from your title. You can edit the slug anytime.
                    </div>
                  </div>

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>Page extras</div>

                  {[
                    { key: 'showCommunityPricing' as const, title: 'Show community sold pricing', desc: 'Pulls DLD transaction data for similar properties in the area.' },
                    { key: 'showMap' as const, title: 'Show location map', desc: 'Stylised map showing the community + key landmarks. Exact address never shown.' },
                    { key: 'showNearby' as const, title: 'Show nearby attractions', desc: 'Schools, malls, metro, parks within a 15-minute drive. Auto-populated.' },
                    { key: 'submitToAI' as const, title: 'Submit to AI models', desc: 'Index this page with ChatGPT, Claude, Gemini, Perplexity, and Copilot on publish.' },
                  ].map(({ key, title, desc }) => (
                    <div key={key} className="wiz-toggle-row" onClick={() => setField(key, !form[key])}>
                      <div className="wiz-toggle-row-text">
                        <div className="wiz-toggle-row-title">{title}</div>
                        <div className="wiz-toggle-row-desc">{desc}</div>
                      </div>
                      <div className={`wiz-toggle${form[key] ? ' on' : ''}`} />
                    </div>
                  ))}

                  <div className="wiz-field-group-title" style={{ marginTop: 28 }}>Lead capture</div>
                  <div className="wiz-field">
                    <div className="wiz-field-label">Where should leads go?</div>
                    <div className="wiz-choice-grid">
                      <div className={`wiz-choice${form.leadCapture === 'all' ? ' selected' : ''}`} onClick={() => setField('leadCapture', 'all')}>
                        <div className="wiz-choice-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg></div>
                        <div className="wiz-choice-text">Inbox + WhatsApp + email</div>
                      </div>
                      <div className={`wiz-choice${form.leadCapture === 'inbox' ? ' selected' : ''}`} onClick={() => setField('leadCapture', 'inbox')}>
                        <div className="wiz-choice-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /></svg></div>
                        <div className="wiz-choice-text">Inbox only</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wiz-side-hint">
                  <div className="wiz-side-hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                  </div>
                  <h5>The URL matters</h5>
                  <p>Buyers remember <strong>memorable URLs</strong>. Use one you can read out on a call or print on a flyer.</p>
                  <p>You can buy custom domains per property on Pro and above.</p>
                </div>
              </div>

              <div className="wiz-step-footer">
                <div className="wiz-step-footer-left">
                  <button className="wiz-btn wiz-btn-outline" onClick={prevStep}>
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Back
                  </button>
                </div>
                <div className="wiz-step-footer-right">
                  <button className="wiz-btn wiz-btn-ghost" onClick={() => navigate('/properties')}>Save &amp; exit</button>
                  <button className="wiz-btn wiz-btn-primary" onClick={nextStep}>
                    Continue<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: REVIEW & PUBLISH ── */}
          {currentStep === 6 && (
            <div className="wiz-step-screen">
              <div className="wiz-step-eyebrow">Step 6 of 6 · Final check</div>
              <h1 className="wiz-step-title">Ready to go live</h1>
              <p className="wiz-step-sub">A quick check before we publish. Click any section to jump back and edit.</p>

              <div className="wiz-publish-summary">
                <div className="wiz-publish-summary-head">
                  <div className="wiz-publish-summary-icon">
                    <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="wiz-publish-summary-title">Everything checks out — here's what happens on publish</div>
                </div>
                <div className="wiz-publish-summary-list">
                  <div className="wiz-publish-summary-item">Your page goes live at <strong>{WORKER_HOST}/{AGENT_SLUG}/{form.slug || slugify(form.pageTitle)}</strong></div>
                  {form.submitToAI && <div className="wiz-publish-summary-item">We submit your listing to Google, ChatGPT, Claude, Gemini, Perplexity, and Copilot</div>}
                  <div className="wiz-publish-summary-item">Lead capture form is wired to your {form.leadCapture === 'all' ? 'WhatsApp + email' : 'inbox'}</div>
                  {form.showCommunityPricing && <div className="wiz-publish-summary-item">Sold pricing data refreshes weekly from DLD records</div>}
                </div>
              </div>

              {/* Review cards */}
              <div className="wiz-review-card">
                <div className="wiz-review-card-head">
                  <div className="wiz-review-card-title">Basics</div>
                  <button className="wiz-review-card-edit" onClick={() => goStep(1)}>
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </button>
                </div>
                <div className="wiz-review-grid">
                  <div className="wiz-review-key">Type</div>
                  <div className="wiz-review-val">{form.propertyType} · {form.purpose === 'for-sale' ? 'For sale' : 'For rent'}</div>
                  <div className="wiz-review-key">Community</div>
                  <div className="wiz-review-val">{[form.community, form.subCommunity].filter(Boolean).join(' · ') || <span className="muted">—</span>}</div>
                  <div className="wiz-review-key">Page title</div>
                  <div className="wiz-review-val">{form.pageTitle || <span className="muted">—</span>}</div>
                </div>
              </div>

              <div className="wiz-review-card">
                <div className="wiz-review-card-head">
                  <div className="wiz-review-card-title">Specs &amp; price</div>
                  <button className="wiz-review-card-edit" onClick={() => goStep(2)}>
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </button>
                </div>
                <div className="wiz-review-grid">
                  <div className="wiz-review-key">Configuration</div>
                  <div className="wiz-review-val">
                    {[form.bedrooms && `${form.bedrooms} beds`, form.bathrooms && `${form.bathrooms} baths`, form.builtUpSqft && `${form.builtUpSqft} sqft built`, form.plotSqft && `${form.plotSqft} sqft plot`].filter(Boolean).join(' · ') || '—'}
                  </div>
                  <div className="wiz-review-key">Price</div>
                  <div className="wiz-review-val">{form.askingPrice ? `AED ${form.askingPrice}` : '—'} · {form.showPrice ? 'Shown publicly' : 'Price on request'}</div>
                  <div className="wiz-review-key">Furnishing</div>
                  <div className="wiz-review-val">{form.furnishing}</div>
                  <div className="wiz-review-key">Completion</div>
                  <div className="wiz-review-val">{form.completionStatus}</div>
                  <div className="wiz-review-key">DLD permit</div>
                  <div className={`wiz-review-val${!form.dldPermit ? ' muted' : ''}`}>{form.dldPermit || 'Not yet added — required to publish'}</div>
                </div>
              </div>

              <div className="wiz-review-card">
                <div className="wiz-review-card-head">
                  <div className="wiz-review-card-title">AI description</div>
                  <button className="wiz-review-card-edit" onClick={() => goStep(3)}>
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </button>
                </div>
                <div className="wiz-review-grid">
                  <div className="wiz-review-key">Description</div>
                  <div className="wiz-review-val">{form.aiDescription.split(' ').length} words · unique to this listing</div>
                  <div className="wiz-review-key">Tone</div>
                  <div className="wiz-review-val">{form.tone}</div>
                </div>
              </div>

              <div className="wiz-review-card">
                <div className="wiz-review-card-head">
                  <div className="wiz-review-card-title">Photos</div>
                  <button className="wiz-review-card-edit" onClick={() => goStep(4)}>
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </button>
                </div>
                <div className="wiz-review-grid">
                  <div className="wiz-review-key">Gallery</div>
                  <div className="wiz-review-val">
                    {photos.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {photoUrls.slice(0, 5).map((url, i) => (
                          <img key={i} src={url} alt="" style={{ width: 56, height: 42, borderRadius: 6, objectFit: 'cover' }} />
                        ))}
                        {photos.length > 5 && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>+{photos.length - 5} more</span>}
                      </div>
                    ) : <span className="muted" style={{ color: 'var(--quiet)', fontStyle: 'italic' }}>No photos added</span>}
                  </div>
                </div>
              </div>

              <div className="wiz-review-card">
                <div className="wiz-review-card-head">
                  <div className="wiz-review-card-title">URL &amp; options</div>
                  <button className="wiz-review-card-edit" onClick={() => goStep(5)}>
                    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </button>
                </div>
                <div className="wiz-review-grid">
                  <div className="wiz-review-key">URL</div>
                  <div className="wiz-review-val" style={{ fontFamily: 'monospace', fontSize: 12.5 }}>
                    {WORKER_HOST}/{AGENT_SLUG}/{form.slug || slugify(form.pageTitle)}
                  </div>
                  <div className="wiz-review-key">Page extras</div>
                  <div className="wiz-review-val">
                    {[form.showCommunityPricing && 'Sold pricing', form.showMap && 'Map', form.showNearby && 'Nearby', form.submitToAI && 'AI submission'].filter(Boolean).join(' · ') || 'None'}
                  </div>
                  <div className="wiz-review-key">Lead capture</div>
                  <div className="wiz-review-val">{form.leadCapture === 'all' ? 'Inbox + WhatsApp + email' : 'Inbox only'}</div>
                </div>
              </div>

              <div className="wiz-step-footer">
                <div className="wiz-step-footer-left">
                  <button className="wiz-btn wiz-btn-outline" onClick={prevStep}>
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Back
                  </button>
                </div>
                <div className="wiz-step-footer-right">
                  <button className="wiz-btn wiz-btn-ghost" onClick={() => publish('draft')} disabled={saving}>
                    {saving ? 'Saving…' : 'Save as draft'}
                  </button>
                  <button className="wiz-btn wiz-btn-primary publish" onClick={() => publish('live')} disabled={saving}>
                    {saving ? 'Publishing…' : 'Publish now'}
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
