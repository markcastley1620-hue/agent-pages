import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import LocationPicker, { type LocationValue } from '../components/LocationPicker'
import AISearchVisibility from '../components/AISearchVisibility'

/* ───────────────────────────── helpers ── */
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}
function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`
  return `AED ${n.toLocaleString()}`
}

/* ───────────────────────────── types ── */
interface Developer {
  id: string
  name: string
  slug: string
  short_code: string | null
  logo_url: string | null
}

interface PaymentTemplate {
  id: string
  template_key: string
  name: string
  tag: string
  description: string | null
  milestones: PaymentMilestone[]
  display_order: number
}

interface PaymentMilestone {
  phase: string
  pct: number
  when: string
  desc: string
}

interface ThesisChip {
  id: string
  chip_key: string
  label: string
  category: string | null
  display_order: number
}

interface UnitTypeRow {
  localId: string
  label: string
  sqft_from: string
  sqft_to: string
  price_from: string
}

type DevMode = 'teaser' | 'full_info'
type ThesisTone = 'analytical' | 'warm' | 'punchy'

interface FormState {
  // Step 1
  developer_id: string
  developer_name: string // autocomplete display
  name: string
  location: LocationValue | null
  property_type_label: string
  handover_quarter: string
  handover_year: string
  mode: DevMode
  // Step 2
  unit_types: UnitTypeRow[]
  // Step 3
  payment_plan_template: string
  payment_plan_json: PaymentMilestone[] | null
  thesis_chips: string[]
  thesis_tone: ThesisTone
  description: string
  thesis_manually_edited: boolean
  // Step 4
  hero_image_url: string
  gallery_image_urls: string[]
  brochure_pdf_url: string
  floor_plans_pdf_url: string
  // Step 5
  slug: string
  show_prices_publicly: boolean
  visibility_config: Record<string, boolean>
}

/* ───────────────────────────── step meta ── */
const STEPS = [
  { name: 'Basics', desc: 'Developer, name, location, mode' },
  { name: 'Unit mix', desc: 'Types, sizes, prices' },
  { name: 'Payment + thesis', desc: 'Plan & investment story' },
  { name: 'Gallery', desc: 'Hero, renders, brochure' },
  { name: 'URL & publish', desc: 'Slug, visibility, go live' },
]

const PROPERTY_TYPE_SUGGESTIONS = ['Apartments & penthouses', 'Villas', 'Townhouses', 'Mixed-use', 'Apartments', 'Penthouses']
const HANDOVER_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const currentYear = new Date().getFullYear()
const HANDOVER_YEARS = Array.from({ length: 10 }, (_, i) => String(currentYear + i))

/* ═══════════════════════════════════════════════════════════ */
export default function DevelopmentNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [devId, setDevId] = useState<string | null>(null)
  const [tierBlocked, setTierBlocked] = useState(false)
  const [tierMessage, setTierMessage] = useState('')
  const [agentProfile, setAgentProfile] = useState<{ display_name: string | null; years_experience: number | null } | null>(null)

  const [developers, setDevelopers] = useState<Developer[]>([])
  const [devSearch, setDevSearch] = useState('')
  const [devDropOpen, setDevDropOpen] = useState(false)
  const [showAddDev, setShowAddDev] = useState(false)
  const [newDevName, setNewDevName] = useState('')
  const [paymentTemplates, setPaymentTemplates] = useState<PaymentTemplate[]>([])
  const [thesisChips, setThesisChips] = useState<ThesisChip[]>([])
  const [generatingThesis, setGeneratingThesis] = useState(false)
  const [editingThesis, setEditingThesis] = useState(false)
  const [thesisDraft, setThesisDraft] = useState('')

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState<FormState>({
    developer_id: '',
    developer_name: '',
    name: '',
    location: null,
    property_type_label: '',
    handover_quarter: '',
    handover_year: '',
    mode: 'teaser',
    unit_types: [{ localId: crypto.randomUUID(), label: '1BR', sqft_from: '', sqft_to: '', price_from: '' }],
    payment_plan_template: '',
    payment_plan_json: null,
    thesis_chips: [],
    thesis_tone: 'analytical',
    description: '',
    thesis_manually_edited: false,
    hero_image_url: '',
    gallery_image_urls: [],
    brochure_pdf_url: '',
    floor_plans_pdf_url: '',
    slug: '',
    show_prices_publicly: true,
    visibility_config: { google: true, chatgpt: true, claude: true, gemini: true, perplexity: true, bing: true, grok: true },
  })

  useEffect(() => {
    Promise.all([
      supabase.from('developers').select('id,name,slug,short_code,logo_url').order('name'),
      supabase.from('payment_plan_templates').select('*').eq('active', true).order('display_order'),
      supabase.from('thesis_chips').select('*').eq('active', true).order('display_order'),
      supabase.from('profiles').select('display_name,years_experience').eq('workspace_id', user?.id ?? '').maybeSingle(),
    ]).then(([{ data: devs }, { data: plans }, { data: chips }, { data: prof }]) => {
      setDevelopers((devs as Developer[]) ?? [])
      setPaymentTemplates((plans as PaymentTemplate[]) ?? [])
      setThesisChips((chips as ThesisChip[]) ?? [])
      setAgentProfile((prof as { display_name: string | null; years_experience: number | null } | null) ?? null)
    })

    // Tier gating check
    if (user) {
      checkTierGating(user.id)
    }
  }, [])

  const checkTierGating = useCallback(async (workspaceId: string) => {
    const TIER_DEV_LIMITS: Record<string, number> = {
      starter: 0,
      growth: 1,
      pro: 3,
      studio: Infinity,
    }
    const [{ data: ent }, { count }] = await Promise.all([
      supabase.from('entitlements').select('plan').eq('agent_id', workspaceId).eq('active', true).maybeSingle(),
      supabase.from('developments').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).neq('status', 'archived'),
    ])
    const plan = ((ent as { plan: string } | null)?.plan ?? 'starter').toLowerCase()
    const limit = TIER_DEV_LIMITS[plan] ?? 0
    const current = count ?? 0
    if (current >= limit) {
      const tierName = plan.charAt(0).toUpperCase() + plan.slice(1)
      const nextTier = plan === 'starter' ? 'Growth' : plan === 'growth' ? 'Pro' : plan === 'pro' ? 'Studio' : 'a higher plan'
      const msg = limit === 0
        ? `Developments are not available on the ${tierName} (free) plan. Upgrade to ${nextTier} to create your first development.`
        : `You've reached ${limit} development${limit !== 1 ? 's' : ''} on ${tierName}. Upgrade to ${nextTier} for ${nextTier === 'Studio' ? 'unlimited' : 'more'}.`
      setTierMessage(msg)
      setTierBlocked(true)
    }
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setField = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setSaved(false)
    setForm(f => ({ ...f, [key]: val }))
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaved(true)
    }, 3000)
  }, [])

  // Auto-save to Supabase
  const autoSave = useCallback(async (f: FormState, id: string | null) => {
    if (!user) return null
    setSaving(true)
    const payload = {
      workspace_id: user.id,
      name: f.name || 'Untitled draft',
      developer_id: f.developer_id || null,
      slug: f.slug || slugify(f.name) || 'untitled',
      property_type_label: f.property_type_label || 'Apartments',
      mode: f.mode,
      handover_quarter: f.handover_quarter || null,
      handover_year: f.handover_year ? parseInt(f.handover_year) : null,
      payment_plan_template: f.payment_plan_template || null,
      payment_plan_json: f.payment_plan_json ?? null,
      thesis_chips: f.thesis_chips,
      thesis_tone: f.thesis_tone,
      description: f.description || null,
      hero_image_url: f.hero_image_url || null,
      gallery_image_urls: f.gallery_image_urls,
      brochure_pdf_url: f.brochure_pdf_url || null,
      floor_plans_pdf_url: f.floor_plans_pdf_url || null,
      show_prices_publicly: f.show_prices_publicly,
      visibility_config: f.visibility_config,
      status: 'draft',
      updated_at: new Date().toISOString(),
    }
    if (id) {
      await supabase.from('developments').update(payload).eq('id', id)
      setSaving(false)
      return id
    } else {
      const { data, error } = await supabase.from('developments').insert({ ...payload, created_at: new Date().toISOString() }).select('id').single()
      setSaving(false)
      if (error) { console.error('Auto-save error:', error); return null }
      return (data as { id: string }).id
    }
  }, [user])

  // Trigger auto-save on form change (debounced 3s)
  useEffect(() => {
    if (!user) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (form.name) {
        const id = await autoSave(form, devId)
        if (id && !devId) setDevId(id)
        setSaved(true)
      }
    }, 3000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [form, user, autoSave, devId])

  const generateThesis = useCallback(async () => {
    if (form.thesis_chips.length < 3) return
    setGeneratingThesis(true)
    // Call Supabase edge function (placeholder returns mock text)
    try {
      const { data } = await supabase.functions.invoke('generate-offplan-thesis', {
        body: {
          development_name: form.name,
          developer_name: form.developer_name,
          community: form.location?.locationDisplay ?? '',
          property_type: form.property_type_label,
          handover: form.handover_quarter ? `${form.handover_quarter} ${form.handover_year}` : form.handover_year,
          unit_mix_summary: form.unit_types.map(u => `${u.label}${u.price_from ? ' from AED ' + Number(u.price_from).toLocaleString() : ''}`).join(', '),
          payment_plan: form.payment_plan_template,
          thesis_chips: form.thesis_chips,
          tone: form.thesis_tone,
          agent_name: agentProfile?.display_name ?? '',
          agent_years: agentProfile?.years_experience ?? null,
        },
      })
      if (data?.thesis) {
        setField('description', data.thesis)
        setField('thesis_manually_edited', false)
      } else {
        // Fallback mock
        const mock = `${form.name || 'This development'} represents a compelling entry into ${form.location?.locationDisplay ?? 'the Dubai market'} at a time when ${form.thesis_chips.slice(0, 2).join(' and ')} are driving sustained demand.\n\nWith ${form.property_type_label || 'units'} starting from ${form.unit_types[0]?.price_from ? fmt(Number(form.unit_types[0].price_from)) : 'competitive pricing'} and a ${form.payment_plan_template ? form.payment_plan_template.replace(/_/g, '/') + ' payment structure' : 'developer-backed payment plan'}, this launch offers measured exposure with defined milestones. Handover ${form.handover_quarter ? `${form.handover_quarter} ${form.handover_year}` : form.handover_year ?? 'TBD'} aligns with improving supply dynamics in the submarket.`
        setField('description', mock)
        setField('thesis_manually_edited', false)
      }
    } catch {
      const mock = `${form.name || 'This development'} is positioned in ${form.location?.locationDisplay ?? 'Dubai'} with ${form.thesis_chips.length} compelling investment attributes. The ${form.mode === 'teaser' ? 'upcoming' : 'current'} launch offers ${form.property_type_label || 'residential units'} in a market segment with strong forward indicators.\n\nFor buyers seeking ${form.thesis_chips.slice(0, 2).map(c => c.replace(/_/g, ' ')).join(' and ')}, the combination of ${form.developer_name || 'an established developer'} credentials and the projected ${form.handover_year ?? 'near-term'} handover timeline creates a well-structured opportunity at the current entry point.`
      setField('description', mock)
      setField('thesis_manually_edited', false)
    }
    setGeneratingThesis(false)
  }, [form, setField])

  // Auto-generate thesis when chips change (debounced 1s)
  const thesisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (form.thesis_chips.length >= 3 && !form.thesis_manually_edited) {
      if (thesisTimerRef.current) clearTimeout(thesisTimerRef.current)
      thesisTimerRef.current = setTimeout(generateThesis, 1000)
    }
    return () => { if (thesisTimerRef.current) clearTimeout(thesisTimerRef.current) }
  }, [form.thesis_chips, form.thesis_tone]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveSlug = form.slug || slugify(form.name) || 'development-name'

  const rightActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
        background: saving ? '#fff8e6' : saved ? 'var(--accent-soft,#e8f0ed)' : '#fff8e6',
        borderRadius: 20, fontSize: 11.5, fontWeight: 500,
        color: saving ? '#8b6f3a' : saved ? 'var(--accent,#2d5a4f)' : '#8b6f3a',
        border: '1px solid', borderColor: saving ? '#ebe3d2' : saved ? 'var(--accent-soft,#e8f0ed)' : '#ebe3d2',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: saving ? '#e0a020' : saved ? 'var(--accent-bright,#3d8a76)' : '#e0a020', display: 'inline-block' }} />
        {saving ? 'Saving…' : saved ? 'Draft saved' : 'Unsaved'}
      </div>
      <Link to="/developments" style={{
        padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        textDecoration: 'none', color: 'var(--muted,#5a6470)',
        border: '1px solid var(--line,#e6e8eb)', background: 'transparent',
      }}>Exit</Link>
    </div>
  )

  if (tierBlocked) {
    return (
      <AppShell variant="breadcrumb" breadcrumb={{ parent: 'Developments', parentHref: '/developments', current: 'Add new' }} rightActions={rightActions}>
        <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 12 }}>Upgrade to add developments</h2>
          <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', lineHeight: 1.6, marginBottom: 24 }}>{tierMessage}</p>
          <a href="/settings" style={{ display: 'inline-flex', padding: '10px 22px', background: 'var(--accent,#2d5a4f)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>View upgrade options</a>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell variant="breadcrumb" breadcrumb={{ parent: 'Developments', parentHref: '/developments', current: 'Add new' }} rightActions={rightActions}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');

        .dnw-grid {
          display: grid;
          grid-template-columns: 240px 1fr 380px;
          min-height: calc(100vh - 60px);
        }
        @media (max-width: 1279px) { .dnw-grid { grid-template-columns: 220px 1fr 340px; } }
        @media (max-width: 1099px) { .dnw-grid { grid-template-columns: 200px 1fr; } .dnw-preview-col { display: none !important; } }
        @media (max-width: 819px) { .dnw-grid { grid-template-columns: 1fr; } .dnw-rail { display: none !important; } }

        @keyframes dnw-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dnw-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .dnw-input { width:100%; padding:11px 14px; background:#fff; border:1px solid var(--line,#e6e8eb); border-radius:9px; font-size:14px; color:var(--ink,#0f1419); font-family:inherit; transition:all .12s; line-height:1.5; box-sizing:border-box; }
        .dnw-input::placeholder { color:var(--quiet,#8b95a0); }
        .dnw-input:focus { outline:none; border-color:var(--accent,#2d5a4f); box-shadow:0 0 0 3px rgba(45,90,79,0.08); }
        .dnw-select { width:100%; padding:11px 14px; background:#fff; border:1px solid var(--line,#e6e8eb); border-radius:9px; font-size:14px; color:var(--ink,#0f1419); font-family:inherit; transition:all .12s; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b95a0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:34px; }
        .dnw-select:focus { outline:none; border-color:var(--accent,#2d5a4f); box-shadow:0 0 0 3px rgba(45,90,79,0.08); }
        .dnw-label { display:block; font-size:12px; font-weight:600; color:var(--ink-soft,#2c343d); margin-bottom:6px; }
        .dnw-field { margin-bottom:18px; }
        .dnw-btn-primary { padding:11px 22px; border-radius:9px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; border:none; background:var(--accent,#2d5a4f); color:#fff; display:inline-flex; align-items:center; gap:6px; }
        .dnw-btn-primary:hover { background:var(--accent-hover,#234a40); }
        .dnw-btn-outline { padding:11px 18px; background:#fff; border:1px solid var(--line,#e6e8eb); color:var(--ink,#0f1419); border-radius:9px; font-size:13.5px; font-weight:600; font-family:inherit; cursor:pointer; }
        .dnw-btn-outline:hover { border-color:var(--ink,#0f1419); }
        .dnw-mode-card { padding:18px 20px; background:#fff; border:1.5px solid var(--line,#e6e8eb); border-radius:11px; cursor:pointer; transition:all .12s; flex:1; }
        .dnw-mode-card.selected { border-color:var(--accent,#2d5a4f); background:var(--accent-soft,#e8f0ed); }
        .dnw-mode-card:hover:not(.selected) { border-color:var(--quiet,#8b95a0); }
        .payplan-card { padding:16px 18px; background:#fff; border:1.5px solid var(--line,#e6e8eb); border-radius:11px; cursor:pointer; transition:all .12s; text-align:left; font-family:inherit; position:relative; width:100%; }
        .payplan-card:hover:not(.selected) { border-color:var(--quiet,#8b95a0); }
        .payplan-card.selected { border-color:var(--accent,#2d5a4f); background:var(--accent-soft,#e8f0ed); }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:#fff; border:1.5px solid var(--line,#e6e8eb); border-radius:100px; font-size:12.5px; color:var(--ink-soft,#2c343d); cursor:pointer; transition:all .12s; font-family:inherit; font-weight:500; }
        .chip:hover:not(.selected) { border-color:var(--quiet,#8b95a0); }
        .chip.selected { background:var(--accent,#2d5a4f); color:#fff; border-color:var(--accent,#2d5a4f); font-weight:600; }
        .chip.disabled { opacity:0.45; cursor:not-allowed; }
        .unit-row:hover { background:var(--paper-warm,#fbfaf7) !important; }
      `}</style>

      <div className="dnw-grid">
        {/* ── LEFT RAIL ── */}
        <aside className="dnw-rail" style={{
          background: '#fff', borderRight: '1px solid var(--line-soft,#f0f2f4)',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 700, marginBottom: 4 }}>NEW DEVELOPMENT</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#0f1419)', letterSpacing: '-0.015em' }}>
              {form.name || 'Untitled draft'}
            </div>
          </div>

          <div style={{ padding: '16px 20px 12px' }}>
            <div style={{ height: 4, background: 'var(--line-soft,#f0f2f4)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${(step / 5) * 100}%`, background: 'var(--accent,#2d5a4f)', borderRadius: 2, transition: 'width .3s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted,#5a6470)', fontWeight: 500 }}>
              <strong style={{ color: 'var(--ink,#0f1419)' }}>Step {step} of 5</strong> · {STEPS[step - 1].name}
            </div>
          </div>

          <div style={{ flex: 1, padding: '4px 10px' }}>
            {STEPS.map((s, i) => {
              const n = i + 1
              const isActive = step === n
              const isDone = step > n
              return (
                <div key={n} onClick={() => setStep(n)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: isActive ? 'var(--accent-soft,#e8f0ed)' : 'transparent',
                  marginBottom: 2, transition: 'background .12s', position: 'relative',
                }}>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', left: 22, top: 34, bottom: -2, width: 1.5, background: isDone ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)' }} />
                  )}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, position: 'relative', zIndex: 1,
                    background: isActive ? 'var(--accent,#2d5a4f)' : isDone ? 'var(--accent-bright,#3d8a76)' : '#fff',
                    border: `1.5px solid ${isActive ? 'var(--accent,#2d5a4f)' : isDone ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)'}`,
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
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive || isDone ? 'var(--ink,#0f1419)' : 'var(--muted,#5a6470)', marginBottom: 1 }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: isDone ? 'var(--accent,#2d5a4f)' : 'var(--quiet,#8b95a0)', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-soft,#f0f2f4)', fontSize: 11, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
            Draft auto-saves every few seconds.
          </div>
        </aside>

        {/* ── CENTER FORM ── */}
        <main style={{ padding: '40px 48px 120px', overflowY: 'auto', background: 'var(--paper-warm,#fbfaf7)', animation: 'dnw-fadein .2s ease' }}>
          <div style={{ maxWidth: 680 }}>
            {step === 1 && (
              <Step1
                form={form}
                setField={setField}
                developers={developers}
                devSearch={devSearch}
                setDevSearch={setDevSearch}
                devDropOpen={devDropOpen}
                setDevDropOpen={setDevDropOpen}
                showAddDev={showAddDev}
                setShowAddDev={setShowAddDev}
                newDevName={newDevName}
                setNewDevName={setNewDevName}
                onAddDeveloper={async () => {
                  if (!newDevName.trim()) return
                  const { data } = await supabase.from('developers').insert({
                    name: newDevName.trim(),
                    slug: slugify(newDevName.trim()),
                    short_code: newDevName.trim().substring(0, 2).toUpperCase(),
                    verified: false,
                  }).select().single()
                  if (data) {
                    const dev = data as Developer
                    setDevelopers(prev => [...prev, dev])
                    setField('developer_id', dev.id)
                    setField('developer_name', dev.name)
                    setDevSearch(dev.name)
                  }
                  setShowAddDev(false)
                  setNewDevName('')
                }}
                onContinue={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2
                form={form}
                setField={setField}
                onBack={() => setStep(1)}
                onContinue={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <Step3
                form={form}
                setField={setField}
                paymentTemplates={paymentTemplates}
                thesisChips={thesisChips}
                generatingThesis={generatingThesis}
                editingThesis={editingThesis}
                setEditingThesis={setEditingThesis}
                thesisDraft={thesisDraft}
                setThesisDraft={setThesisDraft}
                onGenerate={generateThesis}
                onBack={() => setStep(2)}
                onContinue={() => setStep(4)}
              />
            )}
            {step === 4 && (
              <Step4
                form={form}
                setField={setField}
                onBack={() => setStep(3)}
                onContinue={() => setStep(5)}
              />
            )}
            {step === 5 && (
              <Step5
                form={form}
                setField={setField}
                effectiveSlug={effectiveSlug}
                onBack={() => setStep(4)}
                onPublish={async () => {
                  if (!user) return
                  const slug = form.slug || slugify(form.name)
                  // Save unit types separately
                  let id = devId
                  if (!id) {
                    const res = await autoSave(form, null)
                    if (!res) { alert('Save failed. Please try again.'); return }
                    id = res
                    setDevId(id)
                  } else {
                    await autoSave(form, id)
                  }
                  // Upsert unit types
                  if (id) {
                    await supabase.from('unit_types').delete().eq('development_id', id)
                    const utRows = form.unit_types
                      .filter(u => u.label)
                      .map((u, idx) => ({
                        development_id: id,
                        label: u.label,
                        category: 'apartment',
                        sqft_from: u.sqft_from ? parseInt(u.sqft_from) : null,
                        sqft_to: u.sqft_to ? parseInt(u.sqft_to) : null,
                        price_from: u.price_from ? parseFloat(u.price_from) : null,
                        price_currency: 'AED',
                        display_order: idx,
                      }))
                    if (utRows.length > 0) await supabase.from('unit_types').insert(utRows)
                    // Publish
                    await supabase.from('developments').update({
                      status: 'live',
                      slug: slug,
                      published_at: new Date().toISOString(),
                    }).eq('id', id)
                  }
                  navigate('/developments')
                }}
              />
            )}
          </div>
        </main>

        {/* ── RIGHT PREVIEW ── */}
        <aside className="dnw-preview-col" style={{
          padding: '28px 22px 40px', background: 'var(--paper-warm,#fbfaf7)',
          borderLeft: '1px solid var(--line-soft,#f0f2f4)', overflowY: 'auto',
        }}>
          <PreviewPanel form={form} />
        </aside>
      </div>
    </AppShell>
  )
}

/* ══════════════════ STEP 1 — BASICS ══════════════════ */
function Step1({
  form, setField, developers, devSearch, setDevSearch, devDropOpen, setDevDropOpen,
  showAddDev, setShowAddDev, newDevName, setNewDevName, onAddDeveloper, onContinue
}: {
  form: FormState
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  developers: Developer[]
  devSearch: string
  setDevSearch: (s: string) => void
  devDropOpen: boolean
  setDevDropOpen: (b: boolean) => void
  showAddDev: boolean
  setShowAddDev: (b: boolean) => void
  newDevName: string
  setNewDevName: (s: string) => void
  onAddDeveloper: () => Promise<void>
  onContinue: () => void
}) {
  const filteredDevs = developers.filter(d => d.name.toLowerCase().includes(devSearch.toLowerCase()))

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 1 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 6 }}>
        The <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>basics</em>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Developer, name, location, type, handover — and whether this is a Teaser or Full Info launch.
      </p>

      {/* Developer autocomplete */}
      <div className="dnw-field" style={{ position: 'relative' }}>
        <label className="dnw-label">Developer</label>
        <input
          className="dnw-input"
          placeholder="e.g. Emaar Properties"
          value={devSearch || form.developer_name}
          onFocus={() => setDevDropOpen(true)}
          onChange={e => { setDevSearch(e.target.value); setDevDropOpen(true); if (!e.target.value) { setField('developer_id', ''); setField('developer_name', '') } }}
          onBlur={() => setTimeout(() => setDevDropOpen(false), 200)}
        />
        {devDropOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            background: '#fff', border: '1px solid var(--line,#e6e8eb)', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, overflow: 'hidden',
          }}>
            {filteredDevs.slice(0, 8).map(d => (
              <div key={d.id} onMouseDown={() => { setField('developer_id', d.id); setField('developer_name', d.name); setDevSearch(d.name); setDevDropOpen(false) }}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13.5, color: 'var(--ink,#0f1419)', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--line-soft,#f0f2f4)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {d.short_code && (
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent,#2d5a4f)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{d.short_code}</div>
                )}
                {d.name}
              </div>
            ))}
            <div onMouseDown={() => { setShowAddDev(true); setDevDropOpen(false) }}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--accent,#2d5a4f)', fontWeight: 600, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft,#e8f0ed)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              + Can't find your developer? Add new
            </div>
          </div>
        )}
      </div>

      {showAddDev && (
        <div style={{ padding: '16px', background: 'var(--accent-soft,#e8f0ed)', borderRadius: 10, marginBottom: 18, border: '1px solid #c9dcd6' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent,#2d5a4f)', marginBottom: 10 }}>Add new developer</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="dnw-input" placeholder="Developer name" value={newDevName} onChange={e => setNewDevName(e.target.value)} style={{ flex: 1 }} />
            <button className="dnw-btn-primary" style={{ padding: '11px 16px', fontSize: 13 }} onClick={onAddDeveloper}>Add</button>
            <button className="dnw-btn-outline" style={{ padding: '11px 14px', fontSize: 13 }} onClick={() => setShowAddDev(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Development name */}
      <div className="dnw-field">
        <label className="dnw-label">Development name</label>
        <input className="dnw-input" placeholder="e.g. Dubai Hills Estates" value={form.name} onChange={e => setField('name', e.target.value)} />
      </div>

      {/* Location */}
      <div className="dnw-field">
        <label className="dnw-label">Location</label>
        <LocationPicker
          value={form.location ?? undefined}
          onChange={loc => setField('location', loc)}
        />
      </div>

      {/* Property type */}
      <div className="dnw-field">
        <label className="dnw-label">Property type</label>
        <input className="dnw-input" list="prop-type-suggestions" placeholder="e.g. Apartments & penthouses" value={form.property_type_label} onChange={e => setField('property_type_label', e.target.value)} />
        <datalist id="prop-type-suggestions">
          {PROPERTY_TYPE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      {/* Handover */}
      <div className="dnw-field">
        <label className="dnw-label">Handover</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="dnw-select" value={form.handover_quarter} onChange={e => setField('handover_quarter', e.target.value)} style={{ flex: 1 }}>
            <option value="">Quarter (optional)</option>
            {HANDOVER_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select className="dnw-select" value={form.handover_year} onChange={e => setField('handover_year', e.target.value)} style={{ flex: 1 }}>
            <option value="">Year</option>
            {HANDOVER_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginTop: 5 }}>
          Teaser mode: year only is fine. Full Info: quarter + year preferred.
        </div>
      </div>

      {/* Mode selector */}
      <div className="dnw-field">
        <label className="dnw-label">Launch mode</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className={`dnw-mode-card${form.mode === 'teaser' ? ' selected' : ''}`} onClick={() => setField('mode', 'teaser')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink,#0f1419)' }}>Teaser</span>
              {form.mode === 'teaser' && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent,#2d5a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
              Early announcement. No payment plan or brochure yet. Capture priority-list leads.
            </div>
          </button>
          <button className={`dnw-mode-card${form.mode === 'full_info' ? ' selected' : ''}`} onClick={() => setField('mode', 'full_info')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink,#0f1419)' }}>Full Info</span>
              {form.mode === 'full_info' && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent,#2d5a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
              Launch-ready page. Brochure, payment plan, unit prices, renders all available.
            </div>
          </button>
        </div>
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--highlight,#f6f1e8)', border: '1px solid var(--highlight-line,#ebe3d2)', borderRadius: 8, fontSize: 12, color: 'var(--highlight-text,#8b6f3a)', lineHeight: 1.5 }}>
          You can upgrade Teaser → Full Info at any time. Priority-list leads will be automatically notified when you do.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="dnw-btn-primary" onClick={onContinue}>
          Continue
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ══════════════════ STEP 2 — UNIT MIX ══════════════════ */
function Step2({ form, setField, onBack, onContinue }: {
  form: FormState
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  onBack: () => void
  onContinue: () => void
}) {
  const addRow = () => setField('unit_types', [...form.unit_types, { localId: crypto.randomUUID(), label: '', sqft_from: '', sqft_to: '', price_from: '' }])
  const removeRow = (id: string) => setField('unit_types', form.unit_types.filter(u => u.localId !== id))
  const updateRow = (id: string, key: keyof UnitTypeRow, val: string) =>
    setField('unit_types', form.unit_types.map(u => u.localId === id ? { ...u, [key]: val } : u))

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 2 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 6 }}>
        Unit <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>mix</em>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Add one row per unit type. Size range and price are optional at Teaser stage.
      </p>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px',
          padding: '10px 16px', background: 'var(--paper-warm,#fbfaf7)',
          borderBottom: '1px solid var(--line-soft,#f0f2f4)',
          fontSize: 11, fontWeight: 700, color: 'var(--quiet,#8b95a0)',
          letterSpacing: '0.08em', textTransform: 'uppercase', gap: 8,
        }}>
          <span>Type label</span>
          <span>Size (sqft range)</span>
          <span>Price from (AED)</span>
          <span></span>
        </div>
        {form.unit_types.map((u, idx) => (
          <div key={u.localId} className="unit-row" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px',
            padding: '10px 16px', gap: 8, alignItems: 'center',
            background: '#fff',
            borderBottom: idx < form.unit_types.length - 1 ? '1px solid var(--line-soft,#f0f2f4)' : 'none',
          }}>
            <input
              className="dnw-input"
              placeholder="1BR, 2BR, PH…"
              value={u.label}
              onChange={e => updateRow(u.localId, 'label', e.target.value)}
              style={{ fontSize: 13.5 }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input className="dnw-input" placeholder="From" value={u.sqft_from} onChange={e => updateRow(u.localId, 'sqft_from', e.target.value)} style={{ fontSize: 13, width: '45%' }} />
              <span style={{ fontSize: 11, color: 'var(--quiet,#8b95a0)' }}>–</span>
              <input className="dnw-input" placeholder="To" value={u.sqft_to} onChange={e => updateRow(u.localId, 'sqft_to', e.target.value)} style={{ fontSize: 13, width: '45%' }} />
            </div>
            <input
              className="dnw-input"
              placeholder="e.g. 1250000"
              value={u.price_from}
              onChange={e => updateRow(u.localId, 'price_from', e.target.value)}
              style={{ fontSize: 13.5 }}
            />
            <button
              onClick={() => removeRow(u.localId)}
              disabled={form.unit_types.length === 1}
              style={{
                width: 32, height: 32, borderRadius: 7, border: '1px solid var(--line,#e6e8eb)',
                background: '#fff', cursor: form.unit_types.length === 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: form.unit_types.length === 1 ? 0.4 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px',
          border: '1.5px dashed var(--line,#e6e8eb)', borderRadius: 9,
          background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: 'var(--accent,#2d5a4f)', fontFamily: 'inherit', marginBottom: 28,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add unit type
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="dnw-btn-outline" onClick={onBack}>← Back</button>
        <button className="dnw-btn-primary" onClick={onContinue}>
          Continue
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ══════════════════ STEP 3 — PAYMENT + THESIS ══════════════════ */
function Step3({
  form, setField, paymentTemplates, thesisChips, generatingThesis,
  editingThesis, setEditingThesis, thesisDraft, setThesisDraft,
  onGenerate, onBack, onContinue
}: {
  form: FormState
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  paymentTemplates: PaymentTemplate[]
  thesisChips: ThesisChip[]
  generatingThesis: boolean
  editingThesis: boolean
  setEditingThesis: (b: boolean) => void
  thesisDraft: string
  setThesisDraft: (s: string) => void
  onGenerate: () => void
  onBack: () => void
  onContinue: () => void
}) {
  const isTeaser = form.mode === 'teaser'
  const chipCount = form.thesis_chips.length
  const canAddMoreChips = chipCount < 5

  function toggleChip(key: string) {
    if (form.thesis_chips.includes(key)) {
      setField('thesis_chips', form.thesis_chips.filter(c => c !== key))
    } else if (canAddMoreChips) {
      setField('thesis_chips', [...form.thesis_chips, key])
    }
  }

  function selectPlan(t: PaymentTemplate) {
    setField('payment_plan_template', t.template_key)
    setField('payment_plan_json', t.milestones)
  }

  function getBarColor(phase: string): string {
    if (phase === 'booking') return 'var(--accent,#2d5a4f)'
    if (phase === 'construction') return 'var(--accent-bright,#3d8a76)'
    if (phase === 'handover') return 'var(--highlight-text,#8b6f3a)'
    return '#4a6fa5' // post
  }

  // Custom plan placeholder
  const customCard = (
    <button
      className={`payplan-card${form.payment_plan_template === 'custom' ? ' selected' : ''}`}
      onClick={() => { setField('payment_plan_template', 'custom'); setField('payment_plan_json', null) }}
    >
      <div style={{ fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted,#5a6470)', fontWeight: 700, marginBottom: 8 }}>Custom</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 4 }}>Custom plan</div>
      <div style={{ height: 16, borderRadius: 4, background: 'var(--line-soft,#f0f2f4)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--quiet,#8b95a0)', fontWeight: 600 }}>CUSTOM MILESTONES</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)' }}>Define your own milestone structure — available in v1.1</div>
    </button>
  )

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 3 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 6 }}>
        Payment + <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>thesis</em>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Choose a payment structure and build your investment thesis — this is your competitive edge.
      </p>

      {/* ── PAYMENT PLAN ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700 }}>PAYMENT PLAN</div>
          {isTeaser && (
            <div style={{ fontSize: 11.5, color: 'var(--highlight-text,#8b6f3a)', fontWeight: 500 }}>
              Add when you upgrade to Full Info
            </div>
          )}
        </div>

        {isTeaser ? (
          <div style={{ padding: '20px', background: 'var(--highlight,#f6f1e8)', border: '1px solid var(--highlight-line,#ebe3d2)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--highlight-text,#8b6f3a)', lineHeight: 1.6 }}>
              <strong>Payment plan is not required for Teaser mode.</strong> When you upgrade to Full Info and the brochure drops, come back to Step 3 to add the payment structure.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {paymentTemplates.map(t => (
              <button key={t.id} className={`payplan-card${form.payment_plan_template === t.template_key ? ' selected' : ''}`} onClick={() => selectPlan(t)}>
                {form.payment_plan_template === t.template_key && (
                  <>
                    <div style={{ position: 'absolute', top: 14, right: 14, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent,#2d5a4f)' }} />
                    <div style={{ position: 'absolute', top: 18, right: 18, width: 9, height: 5, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg)', zIndex: 1 }} />
                  </>
                )}
                <div style={{ fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: form.payment_plan_template === t.template_key ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)', fontWeight: 700, marginBottom: 6 }}>{t.tag}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.01em', marginBottom: 4 }}>{t.name}</div>
                {/* Mini bar */}
                <div style={{ display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden', margin: '8px 0' }}>
                  {t.milestones.map((m, i) => (
                    <div key={i} style={{
                      width: `${m.pct}%`, background: getBarColor(m.phase),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: '#fff',
                    }}>{m.pct > 10 ? `${m.pct}%` : ''}</div>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', lineHeight: 1.4 }}>
                  {t.milestones.map((m, i) => (
                    <span key={i}>{i > 0 ? ' · ' : ''}<strong style={{ color: 'var(--ink,#0f1419)' }}>{m.pct}%</strong> {m.when}</span>
                  ))}
                </div>
              </button>
            ))}
            {customCard}
          </div>
        )}
      </div>

      {/* ── THESIS CHIPS ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700 }}>INVESTMENT THESIS</div>
          <div style={{ fontSize: 11.5, color: 'var(--accent,#2d5a4f)', fontWeight: 700 }}>
            {chipCount} of 5 selected
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted,#5a6470)', marginBottom: 14, lineHeight: 1.55 }}>
          Select <strong>3–5 reasons</strong> this launch is compelling. The AI will write your thesis from these signals.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {thesisChips.map(chip => {
            const isSelected = form.thesis_chips.includes(chip.chip_key)
            const isDisabled = !isSelected && !canAddMoreChips
            return (
              <button
                key={chip.id}
                className={`chip${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                onClick={() => !isDisabled && toggleChip(chip.chip_key)}
              >
                {isSelected && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M2 5.5l2.5 2.5 4.5-4.5"/>
                  </svg>
                )}
                {chip.label}
              </button>
            )
          })}
        </div>

        {chipCount > 0 && chipCount < 3 && (
          <div style={{ fontSize: 12, color: 'var(--highlight-text,#8b6f3a)', padding: '8px 12px', background: 'var(--highlight,#f6f1e8)', borderRadius: 7, marginBottom: 14 }}>
            Select {3 - chipCount} more chip{3 - chipCount > 1 ? 's' : ''} to unlock AI thesis generation.
          </div>
        )}

        {/* Thesis preview */}
        {chipCount >= 3 && (
          <div style={{ padding: '20px 22px', background: 'var(--accent-soft,#e8f0ed)', border: '1px solid #c9dcd6', borderRadius: 11 }}>
            {/* Head */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 700 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                AI Thesis
              </div>
              {/* Tone tabs */}
              <div style={{ display: 'flex', gap: 2, padding: '2px', background: 'rgba(255,255,255,0.7)', border: '1px solid #c9dcd6', borderRadius: 6 }}>
                {(['analytical', 'warm', 'punchy'] as ThesisTone[]).map(tone => (
                  <button key={tone} onClick={() => setField('thesis_tone', tone)} style={{
                    padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    borderRadius: 4, border: 'none', fontFamily: 'inherit',
                    background: form.thesis_tone === tone ? 'var(--accent,#2d5a4f)' : 'transparent',
                    color: form.thesis_tone === tone ? '#fff' : 'var(--muted,#5a6470)',
                  }}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            {editingThesis ? (
              <textarea
                value={thesisDraft}
                onChange={e => setThesisDraft(e.target.value)}
                rows={6}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #c9dcd6',
                  fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, resize: 'vertical',
                  background: 'rgba(255,255,255,0.8)', color: 'var(--ink,#0f1419)',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink,#0f1419)', lineHeight: 1.7 }}>
                {generatingThesis ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted,#5a6470)' }}>
                    <div style={{ width: 14, height: 14, border: '2px solid var(--accent,#2d5a4f)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'dnw-spin 0.8s linear infinite' }} />
                    Generating thesis…
                  </div>
                ) : form.description ? (
                  form.description.split('\n').filter(Boolean).map((p, i) => <p key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>{p}</p>)
                ) : (
                  <span style={{ color: 'var(--muted,#5a6470)', fontStyle: 'italic' }}>Your thesis will appear here after you select chips above.</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(45,90,79,0.15)' }}>
              <button
                onClick={() => { setField('thesis_manually_edited', false); onGenerate() }}
                style={{
                  padding: '6px 12px', background: 'rgba(255,255,255,0.7)', border: '1px solid #c9dcd6',
                  borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: 'var(--accent,#2d5a4f)',
                  cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Regenerate
              </button>
              {editingThesis ? (
                <button
                  onClick={() => { setField('description', thesisDraft); setField('thesis_manually_edited', true); setEditingThesis(false) }}
                  style={{
                    padding: '6px 12px', background: 'var(--accent,#2d5a4f)', border: 'none',
                    borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: '#fff',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Save edits
                </button>
              ) : (
                <button
                  onClick={() => { setThesisDraft(form.description); setEditingThesis(true) }}
                  style={{
                    padding: '6px 12px', background: 'rgba(255,255,255,0.7)', border: '1px solid #c9dcd6',
                    borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: 'var(--accent,#2d5a4f)',
                    cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit manually
                </button>
              )}
              {form.thesis_manually_edited && !editingThesis && (
                <span style={{ fontSize: 11, color: 'var(--highlight-text,#8b6f3a)', alignSelf: 'center', marginLeft: 4 }}>Manually edited</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="dnw-btn-outline" onClick={onBack}>← Back</button>
        <button className="dnw-btn-primary" onClick={onContinue}>
          Continue
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ══════════════════ STEP 4 — GALLERY ══════════════════ */
function Step4({ form, setField, onBack, onContinue }: {
  form: FormState
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  onBack: () => void
  onContinue: () => void
}) {
  const isFullInfo = form.mode === 'full_info'

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 4 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 6 }}>
        <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>Gallery</em> & documents
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Upload renders and marketing assets. {isFullInfo ? 'Brochure and floor plans are required for Full Info mode.' : 'Hero image recommended even for Teaser.'}
      </p>

      {/* Hero image */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>HERO IMAGE</div>
        <div style={{ marginBottom: 10 }}>
          <label className="dnw-label">Hero image URL</label>
          <input className="dnw-input" placeholder="https://…" value={form.hero_image_url} onChange={e => setField('hero_image_url', e.target.value)} />
        </div>
        {form.hero_image_url && (
          <div style={{ height: 180, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line-soft,#f0f2f4)' }}>
            <img src={form.hero_image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
          </div>
        )}
        {!form.hero_image_url && (
          <div style={{ height: 140, borderRadius: 10, border: '2px dashed var(--line,#e6e8eb)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--paper-warm,#fbfaf7)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--quiet,#8b95a0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span style={{ fontSize: 12, color: 'var(--quiet,#8b95a0)' }}>Paste an image URL above</span>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>GALLERY (up to 24 images)</div>
        <textarea
          className="dnw-input"
          rows={3}
          placeholder="Paste image URLs, one per line"
          value={form.gallery_image_urls.join('\n')}
          onChange={e => setField('gallery_image_urls', e.target.value.split('\n').filter(Boolean))}
          style={{ resize: 'vertical' }}
        />
        <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginTop: 5 }}>{form.gallery_image_urls.length} images added</div>
      </div>

      {/* PDFs — Full Info only */}
      {isFullInfo && (
        <>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>BROCHURE PDF</div>
            <input className="dnw-input" placeholder="PDF URL or upload link" value={form.brochure_pdf_url} onChange={e => setField('brochure_pdf_url', e.target.value)} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>FLOOR PLANS PDF</div>
            <input className="dnw-input" placeholder="PDF URL or upload link" value={form.floor_plans_pdf_url} onChange={e => setField('floor_plans_pdf_url', e.target.value)} />
          </div>
        </>
      )}

      {!isFullInfo && (
        <div style={{ padding: '12px 16px', background: 'var(--line-soft,#f0f2f4)', borderRadius: 9, fontSize: 12.5, color: 'var(--muted,#5a6470)', marginBottom: 24 }}>
          Brochure and floor plans PDFs will be available after upgrading to Full Info mode.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="dnw-btn-outline" onClick={onBack}>← Back</button>
        <button className="dnw-btn-primary" onClick={onContinue}>
          Continue
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ══════════════════ STEP 5 — URL & PUBLISH ══════════════════ */
function Step5({ form, setField, effectiveSlug, onBack, onPublish }: {
  form: FormState
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  effectiveSlug: string
  onBack: () => void
  onPublish: () => Promise<void>
}) {
  const [publishing, setPublishing] = useState(false)

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 5 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 6 }}>
        URL &amp; <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>publish</em>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28, lineHeight: 1.6 }}>
        Set your URL slug, configure AI visibility, and publish.
      </p>

      {/* Slug */}
      <div className="dnw-field">
        <label className="dnw-label">URL slug</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--line,#e6e8eb)', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
          <span style={{ padding: '11px 12px 11px 14px', fontSize: 13, color: 'var(--muted,#5a6470)', background: 'var(--line-soft,#f0f2f4)', borderRight: '1px solid var(--line,#e6e8eb)', whiteSpace: 'nowrap' }}>
            yourname.agentpages.io/
          </span>
          <input
            value={form.slug || slugify(form.name)}
            onChange={e => setField('slug', slugify(e.target.value))}
            style={{ flex: 1, padding: '11px 14px', border: 'none', outline: 'none', fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink,#0f1419)' }}
            placeholder={effectiveSlug}
          />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginTop: 5 }}>
          Your page will be live at: <strong>/{effectiveSlug}</strong>
        </div>
      </div>

      {/* Pricing visibility */}
      <div className="dnw-field">
        <label className="dnw-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div
            onClick={() => setField('show_prices_publicly', !form.show_prices_publicly)}
            style={{
              width: 36, height: 20, borderRadius: 10, background: form.show_prices_publicly ? 'var(--accent,#2d5a4f)' : 'var(--line,#e6e8eb)',
              position: 'relative', cursor: 'pointer', transition: 'background .15s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: form.show_prices_publicly ? 19 : 3, width: 14, height: 14,
              borderRadius: '50%', background: '#fff', transition: 'left .15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
          Show prices publicly
        </label>
        <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginTop: 3 }}>When off, prices are hidden and visitors must register to see them.</div>
      </div>

      {/* AI Visibility */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>AI SEARCH VISIBILITY</div>
        <AISearchVisibility
          value={form.visibility_config}
          onChange={cfg => setField('visibility_config', cfg)}
        />
      </div>

      {/* Publish */}
      <div style={{ paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <div style={{ padding: '16px 20px', background: 'var(--accent-soft,#e8f0ed)', border: '1px solid #c9dcd6', borderRadius: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent,#2d5a4f)', marginBottom: 4 }}>
            Ready to go live?
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted,#5a6470)', lineHeight: 1.55 }}>
            Publishing will make this {form.mode === 'teaser' ? 'Teaser' : 'Full Info'} page publicly accessible. You can edit or take it offline at any time.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="dnw-btn-outline" onClick={onBack}>← Back</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="dnw-btn-outline"
              onClick={async () => { await onPublish() }}
            >
              Save as draft
            </button>
            <button
              className="dnw-btn-primary"
              disabled={publishing}
              onClick={async () => { setPublishing(true); await onPublish(); setPublishing(false) }}
              style={{ opacity: publishing ? 0.7 : 1 }}
            >
              {publishing ? 'Publishing…' : 'Publish development'}
              {!publishing && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════ PREVIEW PANEL ══════════════════ */
function PreviewPanel({ form }: { form: FormState }) {
  const unitSummary = form.unit_types
    .filter(u => u.label)
    .map(u => `${u.label}${u.price_from ? ' ' + fmt(Number(u.price_from)) : ''}`)
    .join(' · ')

  return (
    <div>
      <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-bright,#3d8a76)', display: 'inline-block' }} />
        Live preview
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginBottom: 14, lineHeight: 1.5 }}>
        Updates as you fill in each step.
      </div>

      {/* Mini card */}
      <div style={{ background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 10, overflow: 'hidden' }}>
        {form.hero_image_url ? (
          <img src={form.hero_image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
        ) : (
          <div style={{ height: 100, background: 'linear-gradient(135deg, var(--accent-soft,#e8f0ed) 0%, var(--line-soft,#f0f2f4) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright,#3d8a76)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        )}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 100,
              fontSize: 10.5, fontWeight: 600,
              background: form.mode === 'teaser' ? 'var(--highlight,#f6f1e8)' : 'var(--accent-soft,#e8f0ed)',
              color: form.mode === 'teaser' ? 'var(--highlight-text,#8b6f3a)' : 'var(--accent,#2d5a4f)',
            }}>
              {form.mode === 'teaser' ? 'Teaser' : 'Full Info'}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--quiet,#8b95a0)' }}>Draft</span>
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 500, color: 'var(--ink,#0f1419)', lineHeight: 1.25, marginBottom: 6 }}>
            {form.name || 'Development name'}
          </div>
          {form.developer_name && (
            <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)', marginBottom: 6 }}>{form.developer_name}</div>
          )}
          {form.location?.locationDisplay && (
            <div style={{ fontSize: 11.5, color: 'var(--quiet,#8b95a0)', marginBottom: 6 }}>
              📍 {form.location.locationDisplay}
            </div>
          )}
          {unitSummary && (
            <div style={{ fontSize: 11.5, color: 'var(--ink,#0f1419)', marginBottom: 6, lineHeight: 1.4 }}>
              {unitSummary}
            </div>
          )}
          {form.description && (
            <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', lineHeight: 1.6, marginTop: 8, borderTop: '1px solid var(--line-soft,#f0f2f4)', paddingTop: 8 }}>
              {form.description.substring(0, 180)}{form.description.length > 180 ? '…' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Payment plan preview */}
      {form.payment_plan_json && form.payment_plan_json.length > 0 && (
        <div style={{ marginTop: 12, background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 10.5, color: 'var(--quiet,#8b95a0)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Payment plan</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            {form.payment_plan_json.map((m, i) => (
              <div key={i} style={{
                width: `${m.pct}%`,
                background: m.phase === 'booking' ? 'var(--accent,#2d5a4f)' : m.phase === 'construction' ? 'var(--accent-bright,#3d8a76)' : m.phase === 'handover' ? 'var(--highlight-text,#8b6f3a)' : '#4a6fa5',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {form.payment_plan_json.map((m, i) => (
              <span key={i}><strong style={{ color: 'var(--ink,#0f1419)' }}>{m.pct}%</strong> {m.when}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
