import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AppShell from '../components/AppShell'
import LocationPicker, { type LocationValue } from '../components/LocationPicker'
import AISearchVisibility from '../components/AISearchVisibility'

/* ── helpers ── */
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}
function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`
  return `AED ${n.toLocaleString()}`
}

/* ── types ── */
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
  dbId?: string
  label: string
  sqft_from: string
  sqft_to: string
  price_from: string
}

type DevMode = 'teaser' | 'full_info'
type ThesisTone = 'analytical' | 'warm' | 'punchy'

interface FormState {
  developer_id: string
  developer_name: string
  name: string
  location: LocationValue | null
  property_type_label: string
  handover_quarter: string
  handover_year: string
  mode: DevMode
  unit_types: UnitTypeRow[]
  payment_plan_template: string
  payment_plan_json: PaymentMilestone[] | null
  thesis_chips: string[]
  thesis_tone: ThesisTone
  description: string
  thesis_manually_edited: boolean
  hero_image_url: string
  gallery_image_urls: string[]
  brochure_pdf_url: string
  floor_plans_pdf_url: string
  slug: string
  show_prices_publicly: boolean
  visibility_config: Record<string, boolean>
  status: 'draft' | 'live' | 'archived'
}

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
export default function DevelopmentEdit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [developers, setDevelopers] = useState<Developer[]>([])
  const [devSearch, setDevSearch] = useState('')
  const [devDropOpen, setDevDropOpen] = useState(false)
  const [paymentTemplates, setPaymentTemplates] = useState<PaymentTemplate[]>([])
  const [thesisChips, setThesisChips] = useState<ThesisChip[]>([])
  const [generatingThesis, setGeneratingThesis] = useState(false)
  const [editingThesis, setEditingThesis] = useState(false)
  const [thesisDraft, setThesisDraft] = useState('')
  const [upgradingMode, setUpgradingMode] = useState(false)
  const [upgradeLeadCount, setUpgradeLeadCount] = useState(0)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setFormState] = useState<FormState>({
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
    status: 'draft',
  })

  // Load existing development
  useEffect(() => {
    if (!user || !id) return
    Promise.all([
      supabase.from('developments').select('*').eq('id', id).single(),
      supabase.from('unit_types').select('*').eq('development_id', id).order('display_order'),
      supabase.from('developers').select('id,name,slug,short_code,logo_url').order('name'),
      supabase.from('payment_plan_templates').select('*').eq('active', true).order('display_order'),
      supabase.from('thesis_chips').select('*').eq('active', true).order('display_order'),
      supabase.from('development_leads').select('id', { count: 'exact' }).eq('development_id', id).eq('source_mode', 'teaser').eq('notified_of_full_info', false),
    ]).then(([{ data: dev, error }, { data: units }, { data: devs }, { data: plans }, { data: chips }, { count }]) => {
      if (error || !dev) { setNotFound(true); setLoading(false); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = dev as any
      const devList = (devs as Developer[]) ?? []
      const devName = d.developer_id ? (devList.find((x: Developer) => x.id === d.developer_id)?.name ?? '') : ''

      setFormState({
        developer_id: d.developer_id ?? '',
        developer_name: devName,
        name: d.name ?? '',
        location: d.lat && d.lng ? {
          lat: d.lat, lng: d.lng, placeId: d.google_place_id ?? '',
          locationDisplay: d.formatted_address ?? '', locationExact: false,
          community: '', subCommunity: '', tower: '',
        } : null,
        property_type_label: d.property_type_label ?? '',
        handover_quarter: d.handover_quarter ?? '',
        handover_year: d.handover_year ? String(d.handover_year) : '',
        mode: d.mode ?? 'teaser',
        unit_types: ((units as {
          id: string; label: string; sqft_from: number | null; sqft_to: number | null; price_from: number | null
        }[]) ?? []).map(u => ({
          localId: crypto.randomUUID(),
          dbId: u.id,
          label: u.label,
          sqft_from: u.sqft_from ? String(u.sqft_from) : '',
          sqft_to: u.sqft_to ? String(u.sqft_to) : '',
          price_from: u.price_from ? String(u.price_from) : '',
        })),
        payment_plan_template: d.payment_plan_template ?? '',
        payment_plan_json: d.payment_plan_json ?? null,
        thesis_chips: d.thesis_chips ?? [],
        thesis_tone: d.thesis_tone ?? 'analytical',
        description: d.description ?? '',
        thesis_manually_edited: false,
        hero_image_url: d.hero_image_url ?? '',
        gallery_image_urls: d.gallery_image_urls ?? [],
        brochure_pdf_url: d.brochure_pdf_url ?? '',
        floor_plans_pdf_url: d.floor_plans_pdf_url ?? '',
        slug: d.slug ?? '',
        show_prices_publicly: d.show_prices_publicly ?? true,
        visibility_config: d.visibility_config ?? { google: true, chatgpt: true, claude: true, gemini: true, perplexity: true, bing: true, grok: true },
        status: d.status ?? 'draft',
      })
      setDevSearch(devName)
      setDevelopers(devList)
      setPaymentTemplates((plans as PaymentTemplate[]) ?? [])
      setThesisChips((chips as ThesisChip[]) ?? [])
      setUpgradeLeadCount(count ?? 0)
      setLoading(false)
    })
  }, [user, id])

  const setField = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setSaved(false)
    setFormState(f => ({ ...f, [key]: val }))
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => setSaved(true), 3000)
  }, [])

  const autoSave = useCallback(async (f: FormState) => {
    if (!user || !id) return
    setSaving(true)
    const payload = {
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
      updated_at: new Date().toISOString(),
    }
    await supabase.from('developments').update(payload).eq('id', id)
    setSaving(false)
    setSaved(true)
  }, [user, id])

  // Auto-save debounce
  useEffect(() => {
    if (!user || !id || loading) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => autoSave(form), 3000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [form, user, id, loading, autoSave])

  const generateThesis = useCallback(async () => {
    if (form.thesis_chips.length < 3) return
    setGeneratingThesis(true)
    try {
      const { data } = await supabase.functions.invoke('generate-thesis', {
        body: {
          development_name: form.name,
          developer_name: form.developer_name,
          location: form.location?.locationDisplay ?? '',
          property_type: form.property_type_label,
          handover: form.handover_quarter ? `${form.handover_quarter} ${form.handover_year}` : form.handover_year,
          unit_types: form.unit_types.map(u => `${u.label}${u.price_from ? ' from AED ' + Number(u.price_from).toLocaleString() : ''}`).join(', '),
          payment_plan: form.payment_plan_template,
          thesis_chips: form.thesis_chips,
          tone: form.thesis_tone,
        },
      })
      if (data?.thesis) {
        setField('description', data.thesis)
        setField('thesis_manually_edited', false)
      } else {
        const mock = `${form.name || 'This development'} represents a compelling entry into ${form.location?.locationDisplay ?? 'the Dubai market'} at a time when ${form.thesis_chips.slice(0, 2).join(' and ')} are driving sustained demand.\n\nWith ${form.property_type_label || 'units'} starting from ${form.unit_types[0]?.price_from ? fmt(Number(form.unit_types[0].price_from)) : 'competitive pricing'} and a well-structured payment plan, this launch offers measured exposure with defined milestones. Handover ${form.handover_quarter ? `${form.handover_quarter} ${form.handover_year}` : form.handover_year ?? 'TBD'} aligns with improving supply dynamics in the submarket.`
        setField('description', mock)
        setField('thesis_manually_edited', false)
      }
    } catch {
      const mock = `${form.name || 'This development'} is positioned in ${form.location?.locationDisplay ?? 'Dubai'} with ${form.thesis_chips.length} compelling investment attributes.\n\nFor buyers seeking ${form.thesis_chips.slice(0, 2).map(c => c.replace(/_/g, ' ')).join(' and ')}, the combination of ${form.developer_name || 'an established developer'} credentials and the projected ${form.handover_year ?? 'near-term'} handover timeline creates a well-structured opportunity.`
      setField('description', mock)
      setField('thesis_manually_edited', false)
    }
    setGeneratingThesis(false)
  }, [form, setField])

  const thesisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (form.thesis_chips.length >= 3 && !form.thesis_manually_edited) {
      if (thesisTimerRef.current) clearTimeout(thesisTimerRef.current)
      thesisTimerRef.current = setTimeout(generateThesis, 1000)
    }
    return () => { if (thesisTimerRef.current) clearTimeout(thesisTimerRef.current) }
  }, [form.thesis_chips, form.thesis_tone]) // eslint-disable-line react-hooks/exhaustive-deps

  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3enJibmVza3Z2ZGR1a2l2cGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDExNDksImV4cCI6MjA5NDUxNzE0OX0.cIBiipAFFiGqqP89sHxHg2RDbHKrrB5SxkCfcI7Tq8Y'

  const handleUpgradeToFullInfo = async () => {
    if (!id) return
    setUpgradingMode(true)
    try {
      const res = await fetch('https://bwzrbneskvvddukivphk.supabase.co/functions/v1/upgrade-development-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ development_id: id }),
      })
      const data = await res.json() as { upgraded?: boolean; leads_notified?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Upgrade failed')
      setField('mode', 'full_info')
      const n = data.leads_notified ?? 0
      alert(`Upgraded to Full Info! ${n} priority-list member${n !== 1 ? 's' : ''} notified.`)
    } catch (err) {
      alert(`Upgrade failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUpgradingMode(false)
    }
  }

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
      }}>← Developments</Link>
    </div>
  )

  if (loading) return (
    <AppShell variant="breadcrumb" breadcrumb={{ parent: 'Developments', parentHref: '/developments', current: 'Edit' }} rightActions={rightActions}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ fontSize: 14, color: 'var(--muted,#5a6470)' }}>Loading…</div>
      </div>
    </AppShell>
  )

  if (notFound) return (
    <AppShell variant="breadcrumb" breadcrumb={{ parent: 'Developments', parentHref: '/developments', current: 'Not found' }} rightActions={rightActions}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#0f1419)' }}>Development not found</div>
        <Link to="/developments" style={{ fontSize: 13, color: 'var(--accent,#2d5a4f)', textDecoration: 'none', fontWeight: 500 }}>← Back to Developments</Link>
      </div>
    </AppShell>
  )

  return (
    <AppShell variant="breadcrumb" breadcrumb={{ parent: 'Developments', parentHref: '/developments', current: form.name || 'Edit' }} rightActions={rightActions}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');

        .dev-edit-grid {
          display: grid;
          grid-template-columns: 240px 1fr 380px;
          min-height: calc(100vh - 60px);
        }
        @media (max-width: 1279px) { .dev-edit-grid { grid-template-columns: 220px 1fr 340px; } }
        @media (max-width: 1099px) { .dev-edit-grid { grid-template-columns: 200px 1fr; } .dev-edit-preview { display: none !important; } }
        @media (max-width: 819px) { .dev-edit-grid { grid-template-columns: 1fr; } .dev-edit-rail { display: none !important; } }

        @keyframes dev-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .de-input { width:100%; padding:11px 14px; background:#fff; border:1px solid var(--line,#e6e8eb); border-radius:9px; font-size:14px; color:var(--ink,#0f1419); font-family:inherit; transition:all .12s; line-height:1.5; box-sizing:border-box; }
        .de-input::placeholder { color:var(--quiet,#8b95a0); }
        .de-input:focus { outline:none; border-color:var(--accent,#2d5a4f); box-shadow:0 0 0 3px rgba(45,90,79,0.08); }
        .de-select { width:100%; padding:11px 14px; background:#fff; border:1px solid var(--line,#e6e8eb); border-radius:9px; font-size:14px; color:var(--ink,#0f1419); font-family:inherit; transition:all .12s; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b95a0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:34px; }
        .de-select:focus { outline:none; border-color:var(--accent,#2d5a4f); box-shadow:0 0 0 3px rgba(45,90,79,0.08); }
        .de-label { display:block; font-size:12px; font-weight:600; color:var(--ink-soft,#2c343d); margin-bottom:6px; }
        .de-field { margin-bottom:18px; }
        .de-btn-primary { padding:11px 22px; border-radius:9px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; border:none; background:var(--accent,#2d5a4f); color:#fff; display:inline-flex; align-items:center; gap:6px; }
        .de-btn-primary:hover { background:var(--accent-hover,#234a40); }
        .de-btn-outline { padding:11px 18px; background:#fff; border:1px solid var(--line,#e6e8eb); color:var(--ink,#0f1419); border-radius:9px; font-size:13.5px; font-weight:600; font-family:inherit; cursor:pointer; }
        .de-btn-outline:hover { border-color:var(--ink,#0f1419); }
        .payplan-card { padding:16px 18px; background:#fff; border:1.5px solid var(--line,#e6e8eb); border-radius:11px; cursor:pointer; transition:all .12s; text-align:left; font-family:inherit; position:relative; width:100%; }
        .payplan-card:hover:not(.selected) { border-color:var(--quiet,#8b95a0); }
        .payplan-card.selected { border-color:var(--accent,#2d5a4f); background:var(--accent-soft,#e8f0ed); }
        .chip { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:#fff; border:1.5px solid var(--line,#e6e8eb); border-radius:100px; font-size:12.5px; color:var(--ink-soft,#2c343d); cursor:pointer; transition:all .12s; font-family:inherit; font-weight:500; }
        .chip:hover:not(.selected) { border-color:var(--quiet,#8b95a0); }
        .chip.selected { background:var(--accent,#2d5a4f); color:#fff; border-color:var(--accent,#2d5a4f); font-weight:600; }
        .chip.disabled { opacity:0.45; cursor:not-allowed; }
        .unit-row-edit:hover { background:var(--paper-warm,#fbfaf7) !important; }
        .de-mode-card { padding:18px 20px; background:#fff; border:1.5px solid var(--line,#e6e8eb); border-radius:11px; cursor:pointer; transition:all .12s; flex:1; }
        .de-mode-card.selected { border-color:var(--accent,#2d5a4f); background:var(--accent-soft,#e8f0ed); }
        .de-mode-card:hover:not(.selected) { border-color:var(--quiet,#8b95a0); }
      `}</style>

      <div className="dev-edit-grid">
        {/* ── LEFT RAIL ── */}
        <aside className="dev-edit-rail" style={{
          background: '#fff', borderRight: '1px solid var(--line-soft,#f0f2f4)',
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid var(--line-soft,#f0f2f4)' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 700, marginBottom: 4 }}>EDITING</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink,#0f1419)', letterSpacing: '-0.015em' }}>
              {form.name || 'Untitled'}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 100,
                fontSize: 10.5, fontWeight: 600,
                background: form.mode === 'teaser' ? 'var(--highlight,#f6f1e8)' : 'var(--accent-soft,#e8f0ed)',
                color: form.mode === 'teaser' ? 'var(--highlight-text,#8b6f3a)' : 'var(--accent,#2d5a4f)',
              }}>
                {form.mode === 'teaser' ? 'Teaser' : 'Full Info'}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 100,
                fontSize: 10.5, fontWeight: 600,
                background: form.status === 'live' ? '#dcfce7' : 'var(--line-soft,#f0f2f4)',
                color: form.status === 'live' ? '#166534' : 'var(--muted,#5a6470)',
              }}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </span>
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
                  marginBottom: 2, transition: 'background .12s',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600,
                    background: isActive ? 'var(--accent,#2d5a4f)' : isDone ? 'var(--accent-bright,#3d8a76)' : '#fff',
                    border: `1.5px solid ${isActive ? 'var(--accent,#2d5a4f)' : isDone ? 'var(--accent-bright,#3d8a76)' : 'var(--line,#e6e8eb)'}`,
                    color: isActive || isDone ? '#fff' : 'var(--quiet,#8b95a0)',
                  }}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : n}
                  </div>
                  <div style={{ paddingTop: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 500, color: isActive || isDone ? 'var(--ink,#0f1419)' : 'var(--muted,#5a6470)', marginBottom: 1 }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--quiet,#8b95a0)', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-soft,#f0f2f4)', fontSize: 11, color: 'var(--muted,#5a6470)', lineHeight: 1.5 }}>
            Changes auto-save every few seconds.
          </div>
        </aside>

        {/* ── CENTER FORM ── */}
        <main style={{ padding: '40px 48px 120px', overflowY: 'auto', background: 'var(--paper-warm,#fbfaf7)' }}>
          <div style={{ maxWidth: 680 }}>
            {/* Teaser → Full Info upgrade banner */}
            {form.mode === 'teaser' && (
              <div style={{
                padding: '16px 20px', background: 'var(--highlight,#f6f1e8)',
                border: '1px solid var(--highlight-line,#ebe3d2)', borderRadius: 10,
                marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 4 }}>
                    This development is in Teaser mode
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--highlight-text,#8b6f3a)', lineHeight: 1.5 }}>
                    Got the brochure? Upgrade to Full Info to unlock payment plans, floor plans, and the full launch page.
                    {upgradeLeadCount > 0 && ` ${upgradeLeadCount} priority-list lead${upgradeLeadCount !== 1 ? 's' : ''} will be notified automatically.`}
                  </div>
                </div>
                <button
                  onClick={handleUpgradeToFullInfo}
                  disabled={upgradingMode}
                  style={{
                    padding: '9px 16px', background: 'var(--highlight-text,#8b6f3a)', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    cursor: upgradingMode ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap', opacity: upgradingMode ? 0.7 : 1, flexShrink: 0,
                  }}
                >
                  {upgradingMode ? 'Upgrading…' : 'Upgrade to Full Info'}
                </button>
              </div>
            )}

            {step === 1 && <EditStep1 form={form} setField={setField} developers={developers} devSearch={devSearch} setDevSearch={setDevSearch} devDropOpen={devDropOpen} setDevDropOpen={setDevDropOpen} onContinue={() => setStep(2)} />}
            {step === 2 && <EditStep2 form={form} setField={setField} onBack={() => setStep(1)} onContinue={() => setStep(3)} />}
            {step === 3 && <EditStep3 form={form} setField={setField} paymentTemplates={paymentTemplates} thesisChips={thesisChips} generatingThesis={generatingThesis} editingThesis={editingThesis} setEditingThesis={setEditingThesis} thesisDraft={thesisDraft} setThesisDraft={setThesisDraft} onGenerate={generateThesis} onBack={() => setStep(2)} onContinue={() => setStep(4)} />}
            {step === 4 && <EditStep4 form={form} setField={setField} onBack={() => setStep(3)} onContinue={() => setStep(5)} />}
            {step === 5 && <EditStep5 form={form} setField={setField} effectiveSlug={effectiveSlug} onBack={() => setStep(4)} onSave={async () => { await autoSave(form); navigate('/developments') }} />}
          </div>
        </main>

        {/* ── RIGHT PREVIEW ── */}
        <aside className="dev-edit-preview" style={{
          padding: '28px 22px 40px', background: 'var(--paper-warm,#fbfaf7)',
          borderLeft: '1px solid var(--line-soft,#f0f2f4)', overflowY: 'auto',
        }}>
          <EditPreviewPanel form={form} />
        </aside>
      </div>
    </AppShell>
  )
}

/* ── Sub-step components (simplified wrappers) ── */
function EditStep1({ form, setField, developers, devSearch, setDevSearch, devDropOpen, setDevDropOpen, onContinue }: {
  form: FormState
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  developers: Developer[]
  devSearch: string
  setDevSearch: (s: string) => void
  devDropOpen: boolean
  setDevDropOpen: (b: boolean) => void
  onContinue: () => void
}) {
  const filteredDevs = developers.filter(d => d.name.toLowerCase().includes(devSearch.toLowerCase()))
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 1 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 6 }}>
        The <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>basics</em>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted,#5a6470)', marginBottom: 28 }}>Edit developer, name, location, type, handover, and mode.</p>

      {/* Developer */}
      <div className="de-field" style={{ position: 'relative' }}>
        <label className="de-label">Developer</label>
        <input className="de-input" placeholder="Search developer…" value={devSearch} onFocus={() => setDevDropOpen(true)} onChange={e => { setDevSearch(e.target.value); setDevDropOpen(true) }} onBlur={() => setTimeout(() => setDevDropOpen(false), 200)} />
        {devDropOpen && filteredDevs.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid var(--line,#e6e8eb)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', marginTop: 4, overflow: 'hidden' }}>
            {filteredDevs.slice(0, 8).map(d => (
              <div key={d.id} onMouseDown={() => { setField('developer_id', d.id); setField('developer_name', d.name); setDevSearch(d.name); setDevDropOpen(false) }}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13.5, color: 'var(--ink,#0f1419)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--line-soft,#f0f2f4)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >{d.name}</div>
            ))}
          </div>
        )}
      </div>

      <div className="de-field">
        <label className="de-label">Development name</label>
        <input className="de-input" value={form.name} onChange={e => setField('name', e.target.value)} />
      </div>

      <div className="de-field">
        <label className="de-label">Location</label>
        <LocationPicker value={form.location ?? undefined} onChange={loc => setField('location', loc)} />
      </div>

      <div className="de-field">
        <label className="de-label">Property type</label>
        <input className="de-input" list="de-prop-suggestions" value={form.property_type_label} onChange={e => setField('property_type_label', e.target.value)} />
        <datalist id="de-prop-suggestions">{PROPERTY_TYPE_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
      </div>

      <div className="de-field">
        <label className="de-label">Handover</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="de-select" value={form.handover_quarter} onChange={e => setField('handover_quarter', e.target.value)} style={{ flex: 1 }}>
            <option value="">Quarter</option>
            {HANDOVER_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select className="de-select" value={form.handover_year} onChange={e => setField('handover_year', e.target.value)} style={{ flex: 1 }}>
            <option value="">Year</option>
            {HANDOVER_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="de-field">
        <label className="de-label">Mode</label>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['teaser', 'full_info'] as DevMode[]).map(m => (
            <button key={m} className={`de-mode-card${form.mode === m ? ' selected' : ''}`} onClick={() => setField('mode', m)}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 4 }}>{m === 'teaser' ? 'Teaser' : 'Full Info'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted,#5a6470)' }}>{m === 'teaser' ? 'Early announcement, priority list capture.' : 'Full launch page with brochure and payment plan.'}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="de-btn-primary" onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}

function EditStep2({ form, setField, onBack, onContinue }: {
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
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 20 }}>
        Unit <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>mix</em>
      </h2>

      <div style={{ background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', padding: '10px 16px', background: 'var(--paper-warm,#fbfaf7)', borderBottom: '1px solid var(--line-soft,#f0f2f4)', fontSize: 11, fontWeight: 700, color: 'var(--quiet,#8b95a0)', letterSpacing: '0.08em', textTransform: 'uppercase', gap: 8 }}>
          <span>Type</span><span>Size (sqft)</span><span>Price from</span><span></span>
        </div>
        {form.unit_types.map((u, idx) => (
          <div key={u.localId} className="unit-row-edit" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', padding: '10px 16px', gap: 8, alignItems: 'center', background: '#fff', borderBottom: idx < form.unit_types.length - 1 ? '1px solid var(--line-soft,#f0f2f4)' : 'none' }}>
            <input className="de-input" placeholder="1BR…" value={u.label} onChange={e => updateRow(u.localId, 'label', e.target.value)} style={{ fontSize: 13.5 }} />
            <div style={{ display: 'flex', gap: 5 }}>
              <input className="de-input" placeholder="From" value={u.sqft_from} onChange={e => updateRow(u.localId, 'sqft_from', e.target.value)} style={{ fontSize: 13, width: '46%' }} />
              <input className="de-input" placeholder="To" value={u.sqft_to} onChange={e => updateRow(u.localId, 'sqft_to', e.target.value)} style={{ fontSize: 13, width: '46%' }} />
            </div>
            <input className="de-input" placeholder="e.g. 1250000" value={u.price_from} onChange={e => updateRow(u.localId, 'price_from', e.target.value)} style={{ fontSize: 13.5 }} />
            <button onClick={() => removeRow(u.localId)} disabled={form.unit_types.length === 1} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--line,#e6e8eb)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: form.unit_types.length === 1 ? 0.4 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        ))}
      </div>
      <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', border: '1.5px dashed var(--line,#e6e8eb)', borderRadius: 9, background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--accent,#2d5a4f)', fontFamily: 'inherit', marginBottom: 28 }}>
        + Add unit type
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="de-btn-outline" onClick={onBack}>← Back</button>
        <button className="de-btn-primary" onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}

function EditStep3({ form, setField, paymentTemplates, thesisChips, generatingThesis, editingThesis, setEditingThesis, thesisDraft, setThesisDraft, onGenerate, onBack, onContinue }: {
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
    if (form.thesis_chips.includes(key)) setField('thesis_chips', form.thesis_chips.filter(c => c !== key))
    else if (canAddMoreChips) setField('thesis_chips', [...form.thesis_chips, key])
  }

  function getBarColor(phase: string) {
    if (phase === 'booking') return 'var(--accent,#2d5a4f)'
    if (phase === 'construction') return 'var(--accent-bright,#3d8a76)'
    if (phase === 'handover') return 'var(--highlight-text,#8b6f3a)'
    return '#4a6fa5'
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 3 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 20 }}>
        Payment + <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>thesis</em>
      </h2>

      {/* Payment plan */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>PAYMENT PLAN</div>
        {isTeaser ? (
          <div style={{ padding: '16px', background: 'var(--highlight,#f6f1e8)', border: '1px solid var(--highlight-line,#ebe3d2)', borderRadius: 10, fontSize: 13, color: 'var(--highlight-text,#8b6f3a)' }}>
            Payment plan available after upgrading to Full Info mode.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {paymentTemplates.map(t => (
              <button key={t.id} className={`payplan-card${form.payment_plan_template === t.template_key ? ' selected' : ''}`}
                onClick={() => { setField('payment_plan_template', t.template_key); setField('payment_plan_json', t.milestones) }}>
                {form.payment_plan_template === t.template_key && (
                  <><div style={{ position: 'absolute', top: 14, right: 14, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent,#2d5a4f)' }} /><div style={{ position: 'absolute', top: 18, right: 18, width: 9, height: 5, borderLeft: '2px solid #fff', borderBottom: '2px solid #fff', transform: 'rotate(-45deg)', zIndex: 1 }} /></>
                )}
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', color: form.payment_plan_template === t.template_key ? 'var(--accent,#2d5a4f)' : 'var(--muted,#5a6470)', fontWeight: 700, marginBottom: 6 }}>{t.tag}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#0f1419)', marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden', margin: '8px 0' }}>
                  {t.milestones.map((m, i) => <div key={i} style={{ width: `${m.pct}%`, background: getBarColor(m.phase), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{m.pct > 10 ? `${m.pct}%` : ''}</div>)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)' }}>
                  {t.milestones.map((m, i) => <span key={i}>{i > 0 ? ' · ' : ''}<strong style={{ color: 'var(--ink,#0f1419)' }}>{m.pct}%</strong> {m.when}</span>)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thesis chips */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700 }}>INVESTMENT THESIS</div>
          <div style={{ fontSize: 11.5, color: 'var(--accent,#2d5a4f)', fontWeight: 700 }}>{chipCount} of 5 selected</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {thesisChips.map(chip => {
            const isSelected = form.thesis_chips.includes(chip.chip_key)
            const isDisabled = !isSelected && !canAddMoreChips
            return (
              <button key={chip.id} className={`chip${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`} onClick={() => !isDisabled && toggleChip(chip.chip_key)}>
                {isSelected && <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 5.5l2.5 2.5 4.5-4.5"/></svg>}
                {chip.label}
              </button>
            )
          })}
        </div>

        {chipCount >= 3 && (
          <div style={{ padding: '20px 22px', background: 'var(--accent-soft,#e8f0ed)', border: '1px solid #c9dcd6', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 700 }}>AI Thesis</div>
              <div style={{ display: 'flex', gap: 2, padding: '2px', background: 'rgba(255,255,255,0.7)', border: '1px solid #c9dcd6', borderRadius: 6 }}>
                {(['analytical', 'warm', 'punchy'] as ThesisTone[]).map(tone => (
                  <button key={tone} onClick={() => setField('thesis_tone', tone)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 4, border: 'none', fontFamily: 'inherit', background: form.thesis_tone === tone ? 'var(--accent,#2d5a4f)' : 'transparent', color: form.thesis_tone === tone ? '#fff' : 'var(--muted,#5a6470)' }}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {editingThesis ? (
              <textarea value={thesisDraft} onChange={e => setThesisDraft(e.target.value)} rows={6} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #c9dcd6', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, resize: 'vertical', background: 'rgba(255,255,255,0.8)', color: 'var(--ink,#0f1419)', boxSizing: 'border-box' }} />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink,#0f1419)', lineHeight: 1.7 }}>
                {generatingThesis ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted,#5a6470)' }}>
                    <div style={{ width: 14, height: 14, border: '2px solid var(--accent,#2d5a4f)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'dev-spin 0.8s linear infinite' }} />
                    Generating…
                  </div>
                ) : form.description ? (
                  form.description.split('\n').filter(Boolean).map((p, i) => <p key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>{p}</p>)
                ) : (
                  <span style={{ color: 'var(--muted,#5a6470)', fontStyle: 'italic' }}>Select 3+ chips to generate thesis.</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(45,90,79,0.15)' }}>
              <button onClick={() => { setField('thesis_manually_edited', false); onGenerate() }} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.7)', border: '1px solid #c9dcd6', borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: 'var(--accent,#2d5a4f)', cursor: 'pointer', fontFamily: 'inherit' }}>
                ↺ Regenerate
              </button>
              {editingThesis ? (
                <button onClick={() => { setField('description', thesisDraft); setField('thesis_manually_edited', true); setEditingThesis(false) }} style={{ padding: '6px 12px', background: 'var(--accent,#2d5a4f)', border: 'none', borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Save edits</button>
              ) : (
                <button onClick={() => { setThesisDraft(form.description); setEditingThesis(true) }} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.7)', border: '1px solid #c9dcd6', borderRadius: 7, fontSize: 11.5, fontWeight: 600, color: 'var(--accent,#2d5a4f)', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit manually</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="de-btn-outline" onClick={onBack}>← Back</button>
        <button className="de-btn-primary" onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}

function EditStep4({ form, setField, onBack, onContinue }: {
  form: FormState; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void; onBack: () => void; onContinue: () => void
}) {
  const isFullInfo = form.mode === 'full_info'
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 4 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 20 }}>
        <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>Gallery</em> & documents
      </h2>
      <div className="de-field">
        <label className="de-label">Hero image URL</label>
        <input className="de-input" placeholder="https://…" value={form.hero_image_url} onChange={e => setField('hero_image_url', e.target.value)} />
      </div>
      <div className="de-field">
        <label className="de-label">Gallery images (one URL per line)</label>
        <textarea className="de-input" rows={3} value={form.gallery_image_urls.join('\n')} onChange={e => setField('gallery_image_urls', e.target.value.split('\n').filter(Boolean))} style={{ resize: 'vertical' }} />
      </div>
      {isFullInfo && (
        <>
          <div className="de-field">
            <label className="de-label">Brochure PDF URL</label>
            <input className="de-input" placeholder="PDF URL" value={form.brochure_pdf_url} onChange={e => setField('brochure_pdf_url', e.target.value)} />
          </div>
          <div className="de-field">
            <label className="de-label">Floor plans PDF URL</label>
            <input className="de-input" placeholder="PDF URL" value={form.floor_plans_pdf_url} onChange={e => setField('floor_plans_pdf_url', e.target.value)} />
          </div>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="de-btn-outline" onClick={onBack}>← Back</button>
        <button className="de-btn-primary" onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}

function EditStep5({ form, setField, effectiveSlug, onBack, onSave }: {
  form: FormState; setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void; effectiveSlug: string; onBack: () => void; onSave: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 8 }}>STEP 5 OF 5</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink,#0f1419)', letterSpacing: '-0.025em', marginBottom: 20 }}>
        URL &amp; <em style={{ fontStyle: 'italic', fontFamily: 'Fraunces, serif', fontWeight: 500, color: 'var(--accent,#2d5a4f)' }}>settings</em>
      </h2>
      <div className="de-field">
        <label className="de-label">URL slug</label>
        <input className="de-input" value={form.slug || slugify(form.name)} onChange={e => setField('slug', slugify(e.target.value))} />
        <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginTop: 5 }}>/{effectiveSlug}</div>
      </div>
      <div className="de-field">
        <label className="de-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div onClick={() => setField('show_prices_publicly', !form.show_prices_publicly)} style={{ width: 36, height: 20, borderRadius: 10, background: form.show_prices_publicly ? 'var(--accent,#2d5a4f)' : 'var(--line,#e6e8eb)', position: 'relative', cursor: 'pointer', transition: 'background .15s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: form.show_prices_publicly ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
          </div>
          Show prices publicly
        </label>
      </div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--quiet,#8b95a0)', fontWeight: 700, marginBottom: 12 }}>AI SEARCH VISIBILITY</div>
        <AISearchVisibility value={form.visibility_config} onChange={cfg => setField('visibility_config', cfg)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line-soft,#f0f2f4)' }}>
        <button className="de-btn-outline" onClick={onBack}>← Back</button>
        <button className="de-btn-primary" disabled={saving} onClick={async () => { setSaving(true); await onSave(); setSaving(false) }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function EditPreviewPanel({ form }: { form: FormState }) {
  const unitSummary = form.unit_types.filter(u => u.label).map(u => `${u.label}${u.price_from ? ' ' + fmt(Number(u.price_from)) : ''}`).join(' · ')
  return (
    <div>
      <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent,#2d5a4f)', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-bright,#3d8a76)', display: 'inline-block' }} />
        Preview
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--line-soft,#f0f2f4)', borderRadius: 10, overflow: 'hidden' }}>
        {form.hero_image_url ? (
          <img src={form.hero_image_url} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
        ) : (
          <div style={{ height: 80, background: 'linear-gradient(135deg, var(--accent-soft,#e8f0ed), var(--line-soft,#f0f2f4))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted,#5a6470)' }}>No hero image</span>
          </div>
        )}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 500, color: 'var(--ink,#0f1419)', marginBottom: 4 }}>{form.name || '—'}</div>
          {form.developer_name && <div style={{ fontSize: 11.5, color: 'var(--muted,#5a6470)', marginBottom: 4 }}>{form.developer_name}</div>}
          {form.location?.locationDisplay && <div style={{ fontSize: 11, color: 'var(--quiet,#8b95a0)', marginBottom: 6 }}>📍 {form.location.locationDisplay}</div>}
          {unitSummary && <div style={{ fontSize: 11.5, color: 'var(--ink,#0f1419)', lineHeight: 1.4 }}>{unitSummary}</div>}
        </div>
      </div>
    </div>
  )
}
