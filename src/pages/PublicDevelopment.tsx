import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Development {
  id: string
  workspace_id: string
  name: string
  developer_id: string | null
  slug: string
  mode: 'teaser' | 'full_info'
  handover_quarter: string | null
  handover_year: number | null
  property_type_label: string
  hero_pitch: string | null
  description: string | null
  payment_plan_template: string | null
  payment_plan_json: PaymentMilestone[] | null
  hero_image_url: string | null
  gallery_image_urls: string[] | null
  show_prices_publicly: boolean
  status: string
  formatted_address: string | null
}

interface PaymentMilestone {
  phase: string
  pct: number
  when: string
  desc: string
}

interface UnitType {
  id: string
  label: string
  category: string
  beds: number | null
  baths: number | null
  beds_label: string | null
  sqft_from: number | null
  sqft_to: number | null
  price_from: number | null
  price_to: number | null
  price_currency: string
  aux_text: string | null
  beds_aux_text: string | null
  display_order: number
}

interface Developer {
  id: string
  name: string
  slug: string
  short_code: string | null
  logo_url: string | null
  tagline: string | null
  bio: string | null
  founded_year: number | null
  years_operating: number | null
  units_delivered_label: string | null
  on_time_pct: number | null
  rera_rating: string | null
  verified: boolean
}

interface Profile {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  slug: string
  headline: string | null
  brokerage_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  photo_url: string | null
  years_experience: number | null
  deals_closed: number | null
  rera_number: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function fmtPrice(n: number | null, currency = 'AED'): string | null {
  if (!n) return null
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(2)}M`
  return `${currency} ${n.toLocaleString()}`
}

function handoverLabel(dev: Development): string {
  if (dev.handover_quarter) return dev.handover_quarter
  if (dev.handover_year) return String(dev.handover_year)
  return 'TBA'
}

function scarcityBars(count: number): { filled: number; label: string | null } {
  if (count <= 10) return { filled: 2, label: null }
  if (count <= 30) return { filled: 3, label: null }
  if (count <= 60) return { filled: 4, label: null }
  return { filled: 4, label: 'Filling up' }
}

function phaseColor(phase: string): string {
  switch (phase) {
    case 'booking': return 'var(--accent)'
    case 'construction': return 'var(--accent-bright)'
    case 'post': return '#6b5530'
    default: return 'var(--highlight-text)'
  }
}

function phaseClass(phase: string): string {
  switch (phase) {
    case 'booking': return 'booking'
    case 'construction': return 'construction'
    case 'post': return 'post'
    default: return 'handover'
  }
}

// ─── Teaser Page ─────────────────────────────────────────────────────────────

function TeaserPage({
  dev, developer, agent, agentName, leadCount,
}: {
  dev: Development
  developer: Developer | null
  agent: Profile
  agentName: string
  leadCount: number
}) {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', budget_range: '', purpose: 'investment' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const { filled, label: scarcityLabel } = scarcityBars(leadCount)
  const firstName = agent.first_name || agentName.split(' ')[0]
  const devShortCode = developer?.short_code ?? (developer?.name?.substring(0, 2).toUpperCase() ?? 'DV')

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.from('development_leads').insert({
      development_id: dev.id,
      workspace_id: dev.workspace_id,
      name: form.name,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      source_mode: 'teaser',
      budget_range: form.budget_range || null,
      purpose: form.purpose,
      stage: 'registered',
    })
    setStatus(error ? 'error' : 'sent')
  }

  const handover = handoverLabel(dev)
  const location = dev.formatted_address || ''
  const handoverConfirmed = !!dev.handover_quarter

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f1419; --ink-soft: #2c343d; --muted: #5a6470; --quiet: #8b95a0;
          --line: #e6e8eb; --line-soft: #f0f2f4; --paper-warm: #fbfaf7;
          --accent: #2d5a4f; --accent-hover: #234a40; --accent-soft: #e8f0ed; --accent-bright: #3d8a76;
          --highlight: #f6f1e8; --highlight-line: #ebe3d2; --highlight-text: #8b6f3a;
        }
        html, body { font-family: 'Inter', sans-serif; background: var(--paper-warm); color: var(--ink); -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; line-height: 1.5; }
        .wrap { max-width: 760px; margin: 0 auto; background: #fff; min-height: 100vh; box-shadow: 0 0 0 1px var(--line-soft); }
        .agent-banner { padding: 14px 24px; background: rgba(255,255,255,0.96); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line-soft); display: flex; align-items: center; gap: 14px; position: sticky; top: 0; z-index: 50; }
        .agent-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-hover)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13.5px; font-weight: 600; flex-shrink: 0; overflow: hidden; }
        .agent-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .agent-info { flex: 1; min-width: 0; }
        .agent-name { font-size: 13.5px; font-weight: 600; color: var(--ink); line-height: 1.3; }
        .agent-meta { font-size: 11.5px; color: var(--accent); font-weight: 600; }
        .agent-actions { display: flex; gap: 6px; }
        .agent-action { width: 36px; height: 36px; border-radius: 9px; background: var(--accent-soft); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
        .agent-action:hover { background: var(--accent); }
        .agent-action:hover svg { stroke: #fff !important; }
        .agent-action svg { width: 15px; height: 15px; stroke: var(--accent); fill: none; stroke-width: 2; }
        .agent-action.wa:hover { background: #25D366; }
        .hero { height: 620px; background: radial-gradient(ellipse at 20% 80%, rgba(196,173,138,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(61,138,118,0.4) 0%, transparent 55%), linear-gradient(170deg, #0a0e13 0%, #14201d 40%, #1a2a26 100%); position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.16 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); opacity: 0.6; mix-blend-mode: overlay; pointer-events: none; }
        .hero-bg-img { position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%; opacity: 0.3; }
        .hero-content { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; padding: 36px 32px; }
        .hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .hero-status { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(20px); border-radius: 100px; font-size: 10.5px; font-weight: 700; color: #fff; letter-spacing: 0.16em; text-transform: uppercase; }
        .hero-status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent-bright); box-shadow: 0 0 0 0 rgba(61,138,118,0.7); animation: pulse 2.5s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(61,138,118,0.7); } 50% { box-shadow: 0 0 0 8px rgba(61,138,118,0); } 100% { box-shadow: 0 0 0 0 rgba(61,138,118,0); } }
        .scarcity-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); backdrop-filter: blur(20px); border-radius: 100px; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 500; }
        .meter { display: flex; gap: 2px; padding: 4px 6px; background: rgba(0,0,0,0.25); border-radius: 100px; }
        .meter-bar { width: 4px; height: 11px; border-radius: 1px; }
        .meter-bar.filled { background: var(--accent-bright); }
        .meter-bar.empty { background: rgba(255,255,255,0.16); }
        .scarcity-badge strong { color: #fff; font-weight: 600; }
        .hero-middle { display: flex; flex-direction: column; gap: 18px; }
        .hero-dev-row { display: flex; align-items: center; gap: 10px; }
        .hero-dev-logo { width: 36px; height: 36px; border-radius: 9px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; letter-spacing: -0.02em; overflow: hidden; }
        .hero-dev-logo img { width: 100%; height: 100%; object-fit: cover; }
        .hero-dev-text { display: flex; flex-direction: column; gap: 1px; }
        .hero-dev-line { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500; }
        .hero-dev-line strong { color: #fff; font-weight: 600; }
        .hero-title { font-family: 'Fraunces', serif; font-size: 72px; font-weight: 400; color: #fff; letter-spacing: -0.035em; line-height: 0.96; max-width: 620px; }
        .hero-title em { font-style: italic; background: linear-gradient(110deg, #c4ad8a 0%, var(--accent-bright) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
        .hero-attrs { display: flex; padding: 0; border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; overflow: hidden; backdrop-filter: blur(20px); background: rgba(255,255,255,0.04); }
        .hero-attr { padding: 12px 18px; border-right: 1px solid rgba(255,255,255,0.1); min-width: 120px; }
        .hero-attr:last-child { border-right: none; }
        .hero-attr-label { font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 700; margin-bottom: 4px; }
        .hero-attr-value { font-size: 13px; font-weight: 600; color: #fff; }
        .hero-curated { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500; text-align: right; line-height: 1.5; }
        .hero-curated strong { color: rgba(255,255,255,0.85); font-weight: 600; }
        .body { padding: 56px 32px 0; }
        .eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
        .eyebrow::after { content: ''; flex: 1; height: 1px; background: var(--line-soft); }
        .h2 { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 400; color: var(--ink); letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 28px; max-width: 540px; }
        .h2 em { font-style: italic; color: var(--accent); }
        .facts { border-top: 1px solid var(--line-soft); margin-bottom: 56px; }
        .fact { display: grid; grid-template-columns: 130px 1fr auto; gap: 24px; padding: 22px 0; border-bottom: 1px solid var(--line-soft); align-items: center; }
        .fact-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--quiet); font-weight: 700; }
        .fact-value { font-size: 17px; font-weight: 600; color: var(--ink); letter-spacing: -0.015em; line-height: 1.35; }
        .fact-aux { font-size: 12.5px; color: var(--muted); margin-top: 4px; line-height: 1.5; }
        .fact-status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
        .fact-status.confirmed { background: var(--accent-soft); color: var(--accent); }
        .fact-status.confirmed::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--accent-bright); }
        .fact-status.coming { background: var(--highlight); color: var(--highlight-text); }
        .register { margin: 0 0 56px; background: radial-gradient(ellipse at 80% 20%, rgba(61,138,118,0.18) 0%, transparent 55%), linear-gradient(170deg, #0a0e13 0%, #14201d 50%, #1a2a26 100%); border-radius: 18px; padding: 44px 40px; position: relative; overflow: hidden; }
        .register::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n2)'/%3E%3C/svg%3E"); opacity: 0.4; mix-blend-mode: overlay; pointer-events: none; }
        .register-eyebrow { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background: rgba(61,138,118,0.15); border: 1px solid rgba(61,138,118,0.32); border-radius: 100px; font-size: 10.5px; font-weight: 700; color: var(--accent-bright); letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 18px; position: relative; z-index: 1; }
        .register-title { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 400; color: #fff; letter-spacing: -0.025em; line-height: 1.05; margin-bottom: 14px; max-width: 540px; position: relative; z-index: 1; }
        .register-title em { font-style: italic; background: linear-gradient(110deg, #c4ad8a 0%, var(--accent-bright) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .register-sub { font-size: 15px; color: rgba(255,255,255,0.65); line-height: 1.65; margin-bottom: 22px; max-width: 520px; position: relative; z-index: 1; }
        .register-sub strong { color: #fff; font-weight: 600; }
        .scarcity-row { padding: 14px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; margin-bottom: 22px; position: relative; z-index: 1; }
        .scarcity-row-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .scarcity-row-label { font-size: 11.5px; color: rgba(255,255,255,0.7); font-weight: 500; }
        .scarcity-row-status { font-size: 11px; font-weight: 700; color: var(--accent-bright); letter-spacing: 0.06em; text-transform: uppercase; }
        .scarcity-row-progress { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
        .scarcity-row-fill { height: 100%; background: linear-gradient(90deg, var(--accent-bright), #c4ad8a); border-radius: 2px; }
        .register-form { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(14px); border-radius: 14px; padding: 24px; position: relative; z-index: 1; }
        .register-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .register-field { display: flex; flex-direction: column; gap: 5px; }
        .register-field.full { grid-column: 1 / -1; }
        .register-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8); letter-spacing: 0.04em; }
        .register-input, .register-select { padding: 11px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 9px; font-family: inherit; font-size: 14px; color: #fff; width: 100%; }
        .register-input::placeholder { color: rgba(255,255,255,0.35); }
        .register-input:focus, .register-select:focus { outline: none; border-color: var(--accent-bright); background: rgba(255,255,255,0.08); }
        .register-select option { background: #0f1419; color: #fff; }
        .register-cta { padding: 14px; background: var(--accent-bright); color: #fff; border: none; border-radius: 10px; font-size: 14.5px; font-weight: 700; cursor: pointer; font-family: inherit; width: 100%; margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .register-cta:hover { background: #4f9d8b; transform: translateY(-1px); }
        .register-cta:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .register-cta svg { width: 14px; height: 14px; stroke: #fff; stroke-width: 2.2; fill: none; }
        .register-foot { font-size: 11.5px; color: rgba(255,255,255,0.5); text-align: center; margin-top: 14px; line-height: 1.5; }
        .register-success { background: rgba(61,138,118,0.15); border: 1px solid rgba(61,138,118,0.4); border-radius: 10px; padding: 18px; text-align: center; color: var(--accent-bright); font-size: 14.5px; font-weight: 600; position: relative; z-index: 1; }
        .register-error { font-size: 12px; color: #f87171; margin-top: 8px; text-align: center; }
        .promises-section { margin-bottom: 56px; }
        .promises-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 400; color: var(--ink); letter-spacing: -0.022em; line-height: 1.2; margin-bottom: 28px; }
        .promises-title em { font-style: italic; color: var(--accent); }
        .promises-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .promise { padding: 22px; background: var(--paper-warm); border: 1px solid var(--line-soft); border-radius: 12px; }
        .promise-icon { width: 36px; height: 36px; border-radius: 9px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .promise-icon svg { width: 16px; height: 16px; stroke: var(--accent); stroke-width: 2; fill: none; }
        .promise-title { font-size: 14.5px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; line-height: 1.35; margin-bottom: 6px; }
        .promise-desc { font-size: 12.5px; color: var(--muted); line-height: 1.55; }
        .footer { padding: 22px 32px 28px; text-align: center; border-top: 1px solid var(--line-soft); font-size: 11px; color: var(--quiet); }
        .footer strong { color: var(--accent); font-weight: 700; }
        @media (max-width: 820px) {
          .hero { height: 540px; }
          .hero-title { font-size: 46px; }
          .hero-content { padding: 24px 22px; }
          .hero-bottom { flex-direction: column; align-items: flex-start; }
          .body { padding: 36px 20px 0; }
          .h2 { font-size: 26px; }
          .fact { grid-template-columns: 1fr; gap: 6px; padding: 16px 0; }
          .register { padding: 28px 22px; }
          .register-title { font-size: 28px; }
          .register-fields { grid-template-columns: 1fr; }
          .promises-grid { grid-template-columns: 1fr; gap: 10px; }
          .promises-title { font-size: 24px; }
        }
      `}</style>

      <div className="wrap">
        {/* Agent Banner */}
        <header className="agent-banner">
          <div className="agent-avatar">
            {agent.photo_url ? <img src={agent.photo_url} alt={agentName} /> : initials(agentName)}
          </div>
          <div className="agent-info">
            <div className="agent-name">{agentName}</div>
            {(agent.brokerage_name || agent.headline) && (
              <div className="agent-meta">{[agent.brokerage_name, developer ? `Authorised ${developer.name} broker` : null].filter(Boolean).join(' · ')}</div>
            )}
          </div>
          <div className="agent-actions">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="agent-action" title="Call">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" /></svg>
              </a>
            )}
            {agent.whatsapp && (
              <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}`} className="agent-action wa" title="WhatsApp">
                <svg viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" fill="currentColor" /></svg>
              </a>
            )}
          </div>
        </header>

        {/* Hero */}
        <div className="hero">
          {dev.hero_image_url && <img src={dev.hero_image_url} alt={dev.name} className="hero-bg-img" />}
          <div className="hero-content">
            <div className="hero-top">
              <div className="hero-status">
                <span className="hero-status-dot" />
                Launching · {handoverLabel(dev)}
              </div>
              <div className="scarcity-badge">
                <div className="meter">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`meter-bar ${i <= filled ? 'filled' : 'empty'}`} />
                  ))}
                </div>
                {scarcityLabel && <strong>{scarcityLabel}</strong>}
              </div>
            </div>

            <div className="hero-middle">
              <div className="hero-dev-row">
                <div className="hero-dev-logo">
                  {developer?.logo_url ? <img src={developer.logo_url} alt={developer.name} /> : devShortCode}
                </div>
                <div className="hero-dev-text">
                  <div className="hero-dev-line">By <strong>{developer?.name ?? 'Developer'}</strong></div>
                  <div className="hero-dev-line">Authorised broker · {agentName}</div>
                </div>
              </div>
              <h1 className="hero-title">
                {dev.hero_pitch ? (
                  <span dangerouslySetInnerHTML={{ __html: dev.hero_pitch.replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                ) : (
                  <>A new development<br />in <em>{location || dev.name}</em>.</>
                )}
              </h1>
            </div>

            <div className="hero-bottom">
              <div className="hero-attrs">
                <div className="hero-attr">
                  <div className="hero-attr-label">Location</div>
                  <div className="hero-attr-value">{location || 'Dubai'}</div>
                </div>
                <div className="hero-attr">
                  <div className="hero-attr-label">Type</div>
                  <div className="hero-attr-value">{dev.property_type_label}</div>
                </div>
                <div className="hero-attr">
                  <div className="hero-attr-label">Handover</div>
                  <div className="hero-attr-value">{handover}</div>
                </div>
              </div>
              <div className="hero-curated">Curated by<br /><strong>{agentName}</strong></div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="body">
          <div className="eyebrow">Launch information</div>
          <h2 className="h2">What we <em>know</em> so far.</h2>

          <div className="facts">
            {/* Developer fact */}
            <div className="fact">
              <div className="fact-label">Developer</div>
              <div>
                <div className="fact-value">{developer?.name ?? 'Developer TBA'}</div>
                {developer?.tagline && <div className="fact-aux">{developer.tagline}</div>}
              </div>
              <span className="fact-status confirmed">Confirmed</span>
            </div>

            {/* Location fact */}
            <div className="fact">
              <div className="fact-label">Location</div>
              <div>
                <div className="fact-value">{location || 'Dubai'}</div>
              </div>
              <span className="fact-status confirmed">Confirmed</span>
            </div>

            {/* Property type fact */}
            <div className="fact">
              <div className="fact-label">Property type</div>
              <div>
                <div className="fact-value">{dev.property_type_label}</div>
              </div>
              <span className="fact-status confirmed">Confirmed</span>
            </div>

            {/* Handover fact */}
            <div className="fact">
              <div className="fact-label">Handover</div>
              <div>
                <div className="fact-value">{handover}</div>
                {!handoverConfirmed && <div className="fact-aux">Specific quarter confirmed at sales gallery launch</div>}
              </div>
              {handoverConfirmed ? (
                <span className="fact-status confirmed">Confirmed</span>
              ) : (
                <span className="fact-status coming">
                  <svg viewBox="0 0 24 24" width="9" height="9" stroke="currentColor" fill="none" strokeWidth="2.4"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  Coming soon
                </span>
              )}
            </div>
          </div>

          {/* Register card */}
          <div className="register">
            <div className="register-eyebrow">★ Priority list</div>
            <h2 className="register-title">Be the <em>first</em> to see prices,<br />floor plans &amp; payment plan.</h2>
            <p className="register-sub">
              When {developer?.name ?? 'the developer'} drops the brochure, <strong>{firstName}'s list gets it first</strong> — before the public launch, before the wider broker network.
            </p>

            <div className="scarcity-row">
              <div className="scarcity-row-top">
                <div className="scarcity-row-label">Priority list status</div>
                <div className="scarcity-row-status">{scarcityLabel ?? 'Active'}</div>
              </div>
              <div className="scarcity-row-progress">
                <div className="scarcity-row-fill" style={{ width: `${(filled / 5) * 100}%` }} />
              </div>
            </div>

            {status === 'sent' ? (
              <div className="register-success">✓ You're on the list. {firstName} will message you on WhatsApp shortly.</div>
            ) : (
              <form className="register-form" onSubmit={handleRegister}>
                <div className="register-fields">
                  <div className="register-field full">
                    <label className="register-label">Your name</label>
                    <input className="register-input" type="text" required placeholder="First &amp; last name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="register-field">
                    <label className="register-label">Email</label>
                    <input className="register-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="register-field">
                    <label className="register-label">WhatsApp</label>
                    <input className="register-input" type="tel" placeholder="+971 50 ..." value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  </div>
                  <div className="register-field full">
                    <label className="register-label">Budget</label>
                    <select className="register-select" value={form.budget_range} onChange={e => setForm(f => ({ ...f, budget_range: e.target.value }))}>
                      <option value="">Choose a range</option>
                      <option value="2-4M">AED 2M – 4M</option>
                      <option value="4-8M">AED 4M – 8M</option>
                      <option value="8-15M">AED 8M – 15M</option>
                      <option value="15M+">AED 15M+</option>
                    </select>
                  </div>
                  <div className="register-field full">
                    <label className="register-label">Purpose</label>
                    <select className="register-select" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}>
                      <option value="investment">Investment / yield</option>
                      <option value="move_in">Move-in</option>
                      <option value="holiday">Holiday home</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </div>
                </div>
                <button className="register-cta" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Add me to the priority list'}
                  {status !== 'sending' && (
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  )}
                </button>
                {status === 'error' && <div className="register-error">Something went wrong. Please try again.</div>}
                <div className="register-foot">No spam. No sales calls. One WhatsApp the moment {developer?.name ?? 'the developer'} releases the brochure.</div>
              </form>
            )}
          </div>

          {/* How [Agent] works */}
          <div className="promises-section">
            <div className="eyebrow">How {firstName} works</div>
            <h3 className="promises-title">What happens <em>after you register.</em></h3>
            <div className="promises-grid">
              <div className="promise">
                <div className="promise-icon">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" fill="currentColor" /></svg>
                </div>
                <div className="promise-title">A personal hello on WhatsApp</div>
                <div className="promise-desc">{firstName} replies within the hour. A short message — not a sales call, not a bot.</div>
              </div>
              <div className="promise">
                <div className="promise-icon">
                  <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </div>
                <div className="promise-title">The brochure the day it drops</div>
                <div className="promise-desc">When {developer?.name ?? 'the developer'} releases pricing &amp; floor plans, you'll have them before the public launch.</div>
              </div>
              <div className="promise">
                <div className="promise-icon">
                  <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <div className="promise-title">No noise, no other agents</div>
                <div className="promise-desc">One agent, one channel. Opt out any time with a single message.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">Powered by <strong>Agent Pages</strong></div>
      </div>
    </>
  )
}

// ─── Full Info Page ───────────────────────────────────────────────────────────

function FullInfoPage({
  dev, developer, agent, agentName, unitTypes,
}: {
  dev: Development
  developer: Developer | null
  agent: Profile
  agentName: string
  unitTypes: UnitType[]
}) {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', interested_unit_type: '', purpose: 'investment' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handover = handoverLabel(dev)
  const lowestPrice = unitTypes.reduce<number | null>((min, u) => {
    if (!u.price_from) return min
    return min === null ? u.price_from : Math.min(min, u.price_from)
  }, null)

  const devShortCode = developer?.short_code ?? (developer?.name?.substring(0, 2).toUpperCase() ?? 'DV')
  const paymentPlan: PaymentMilestone[] = dev.payment_plan_json ?? []
  const totalPct = paymentPlan.reduce((s, m) => s + m.pct, 0)

  async function handleLead(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.from('development_leads').insert({
      development_id: dev.id,
      workspace_id: dev.workspace_id,
      name: form.name,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      source_mode: 'full_info',
      purpose: form.purpose,
      interested_unit_type: form.interested_unit_type || null,
      stage: 'brochure_requested',
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0f1419; --ink-soft: #2c343d; --muted: #5a6470; --quiet: #8b95a0;
          --line: #e6e8eb; --line-soft: #f0f2f4; --paper-warm: #fbfaf7;
          --accent: #2d5a4f; --accent-hover: #234a40; --accent-soft: #e8f0ed; --accent-bright: #3d8a76;
          --highlight: #f6f1e8; --highlight-line: #ebe3d2; --highlight-text: #8b6f3a;
        }
        html, body { font-family: 'Inter', sans-serif; background: var(--paper-warm); color: var(--ink); -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; line-height: 1.5; }
        .wrap { max-width: 760px; margin: 0 auto; background: #fff; min-height: 100vh; box-shadow: 0 0 0 1px var(--line-soft); }
        .agent-banner { padding: 14px 24px; background: rgba(255,255,255,0.96); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line-soft); display: flex; align-items: center; gap: 14px; position: sticky; top: 0; z-index: 50; }
        .agent-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-hover)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13.5px; font-weight: 600; flex-shrink: 0; overflow: hidden; }
        .agent-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .agent-info { flex: 1; min-width: 0; }
        .agent-name { font-size: 13.5px; font-weight: 600; color: var(--ink); line-height: 1.3; }
        .agent-meta { font-size: 11.5px; color: var(--accent); font-weight: 600; }
        .agent-actions { display: flex; gap: 6px; }
        .agent-action { width: 36px; height: 36px; border-radius: 9px; background: var(--accent-soft); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
        .agent-action:hover { background: var(--accent); }
        .agent-action:hover svg { stroke: #fff !important; }
        .agent-action svg { width: 15px; height: 15px; stroke: var(--accent); fill: none; stroke-width: 2; }
        .agent-action.wa:hover { background: #25D366; }
        .hero { height: 480px; background: linear-gradient(170deg, transparent 0%, rgba(15,20,25,0.65) 100%), linear-gradient(135deg, #c4ad8a 0%, #8b7456 50%, #6b5530 100%); position: relative; }
        .hero-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .hero::before { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n3)'/%3E%3C/svg%3E"); opacity: 0.5; mix-blend-mode: overlay; pointer-events: none; z-index: 1; }
        .hero-photo-count { position: absolute; top: 24px; right: 24px; padding: 5px 11px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border-radius: 100px; font-size: 11px; font-weight: 600; color: #fff; z-index: 2; display: inline-flex; align-items: center; gap: 6px; }
        .hero-photo-count svg { width: 11px; height: 11px; stroke: #fff; stroke-width: 2; fill: none; }
        .hero-overlay { position: absolute; bottom: 32px; left: 32px; right: 32px; z-index: 2; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 100px; font-size: 11px; font-weight: 700; color: var(--accent); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 18px; }
        .hero-title { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 400; color: #fff; letter-spacing: -0.025em; line-height: 1.02; margin-bottom: 12px; max-width: 600px; }
        .hero-dev { font-size: 15px; color: rgba(255,255,255,0.88); font-weight: 500; }
        .hero-dev strong { color: #fff; font-weight: 700; }
        .body { padding: 36px 32px 60px; }
        .status-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 24px 0; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); margin-bottom: 48px; }
        .status-item { padding: 0 28px; border-right: 1px solid var(--line-soft); }
        .status-item:last-child { border-right: none; }
        .status-item:first-child { padding-left: 0; }
        .status-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--quiet); font-weight: 700; margin-bottom: 8px; }
        .status-value { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 500; color: var(--ink); letter-spacing: -0.02em; line-height: 1; }
        .status-value em { font-style: italic; }
        .status-aux { font-size: 11.5px; color: var(--muted); margin-top: 8px; font-weight: 500; }
        .thesis-section { margin-bottom: 56px; }
        .eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
        .eyebrow::after { content: ''; flex: 1; height: 1px; background: var(--line-soft); }
        .thesis-card { padding: 32px 36px; background: linear-gradient(135deg, var(--accent-soft) 0%, #d9e6e2 100%); border: 1px solid #c9dcd6; border-radius: 16px; position: relative; overflow: hidden; }
        .thesis-card::before { content: '\\201C'; position: absolute; top: 12px; left: 24px; font-family: 'Fraunces', serif; font-size: 110px; line-height: 1; color: var(--accent); opacity: 0.18; pointer-events: none; }
        .thesis-content { position: relative; padding-left: 40px; }
        .thesis-h2 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 400; color: var(--ink); letter-spacing: -0.018em; line-height: 1.25; margin-bottom: 18px; max-width: 540px; }
        .thesis-h2 em { font-style: italic; color: var(--accent); }
        .thesis-para { font-size: 15px; color: var(--ink); line-height: 1.7; margin-bottom: 14px; max-width: 580px; }
        .thesis-para strong { font-weight: 600; }
        .thesis-para:last-of-type { margin-bottom: 22px; }
        .thesis-author { display: flex; align-items: center; gap: 12px; padding-top: 18px; border-top: 1px solid rgba(45,90,79,0.18); }
        .thesis-author-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-hover)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; overflow: hidden; flex-shrink: 0; }
        .thesis-author-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .thesis-author-name { font-size: 13.5px; font-weight: 600; color: var(--ink); }
        .thesis-author-role { font-size: 11.5px; color: var(--accent); font-weight: 600; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 56px 0 14px; gap: 14px; }
        .section-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
        .section-meta { font-size: 12px; color: var(--muted); font-weight: 500; }
        .section-h2 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 400; color: var(--ink); letter-spacing: -0.022em; line-height: 1.2; margin-bottom: 8px; }
        .section-h2 em { font-style: italic; color: var(--accent); }
        .section-intro { font-size: 14.5px; color: var(--ink-soft); line-height: 1.7; margin-bottom: 24px; max-width: 600px; }
        .units-table { background: var(--paper-warm); border: 1px solid var(--line-soft); border-radius: 14px; overflow: hidden; }
        .units-row { display: grid; grid-template-columns: 88px 1fr 1fr 130px; gap: 20px; padding: 22px 26px; border-bottom: 1px solid var(--line-soft); align-items: center; }
        .units-row:last-child { border-bottom: none; }
        .units-row:hover { background: #fff; }
        .unit-pill { padding: 6px 12px; background: var(--accent); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-align: center; }
        .unit-beds { font-size: 14.5px; color: var(--ink); font-weight: 600; line-height: 1.3; }
        .unit-beds-sub { font-size: 12px; color: var(--muted); font-weight: 500; margin-top: 2px; }
        .unit-size { font-size: 14.5px; color: var(--ink); font-weight: 600; line-height: 1.3; }
        .unit-size-sub { font-size: 12px; color: var(--muted); font-weight: 500; margin-top: 2px; }
        .unit-price-col { text-align: right; }
        .unit-price-from { font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); font-weight: 700; margin-bottom: 3px; }
        .unit-price { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; color: var(--ink); letter-spacing: -0.025em; line-height: 1; }
        .unit-price.hidden { font-size: 13px; color: var(--muted); font-family: 'Inter', sans-serif; }
        .payment-card { background: var(--paper-warm); border: 1px solid var(--line-soft); border-radius: 14px; padding: 28px; }
        .payment-bar { display: flex; height: 56px; border-radius: 10px; overflow: hidden; margin-bottom: 22px; }
        .payment-seg { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; padding: 4px; min-width: 0; }
        .payment-seg-pct { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; line-height: 1; letter-spacing: -0.015em; }
        .payment-seg-lab { font-size: 9.5px; opacity: 0.9; font-weight: 600; letter-spacing: 0.06em; margin-top: 4px; text-transform: uppercase; }
        .payment-detail { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .payment-detail.cols-4 { grid-template-columns: repeat(4, 1fr); }
        .payment-detail-item { padding-top: 14px; border-top: 2px solid var(--line-soft); }
        .payment-detail-pct { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; color: var(--ink); letter-spacing: -0.018em; line-height: 1; }
        .payment-detail-when { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--quiet); font-weight: 700; margin-top: 6px; }
        .payment-detail-desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin-top: 8px; }
        .developer-card { background: #fff; border: 1px solid var(--line-soft); border-radius: 14px; overflow: hidden; }
        .developer-top { padding: 24px 28px; background: var(--paper-warm); border-bottom: 1px solid var(--line-soft); display: flex; align-items: center; gap: 18px; }
        .developer-logo { width: 60px; height: 60px; border-radius: 12px; background: var(--ink); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; overflow: hidden; flex-shrink: 0; }
        .developer-logo img { width: 100%; height: 100%; object-fit: cover; }
        .developer-info { flex: 1; }
        .developer-name { font-size: 18px; font-weight: 700; color: var(--ink); letter-spacing: -0.015em; margin-bottom: 4px; }
        .developer-tagline { font-size: 12.5px; color: var(--muted); font-weight: 500; }
        .developer-verified { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; background: var(--accent-soft); color: var(--accent); border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .developer-verified svg { width: 10px; height: 10px; stroke: var(--accent); stroke-width: 3; fill: none; }
        .developer-body { padding: 22px 28px; }
        .developer-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-bottom: 22px; }
        .developer-stat { padding: 0 18px; border-right: 1px solid var(--line-soft); }
        .developer-stat:first-child { padding-left: 0; }
        .developer-stat:last-child { padding-right: 0; border-right: none; }
        .developer-stat-value { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 500; color: var(--ink); letter-spacing: -0.022em; line-height: 1; margin-bottom: 5px; }
        .developer-stat-label { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--quiet); font-weight: 700; }
        .developer-bio { font-size: 13.5px; color: var(--ink-soft); line-height: 1.65; }
        .lead-card { background: radial-gradient(ellipse at 80% 20%, rgba(196,173,138,0.18) 0%, transparent 60%), linear-gradient(135deg, var(--paper-warm) 0%, var(--highlight) 100%); border: 1px solid var(--highlight-line); border-radius: 16px; padding: 32px 36px; }
        .lead-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .lead-field { display: flex; flex-direction: column; gap: 5px; }
        .lead-field.full { grid-column: 1 / -1; }
        .lead-label { font-size: 11px; font-weight: 600; color: var(--ink); letter-spacing: 0.04em; }
        .lead-input, .lead-select { padding: 11px 14px; background: #fff; border: 1px solid var(--line-soft); border-radius: 9px; font-family: inherit; font-size: 13.5px; color: var(--ink); width: 100%; }
        .lead-input:focus, .lead-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,79,0.08); }
        .lead-cta { padding: 13px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; width: 100%; margin-top: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .lead-cta:hover { background: var(--accent-hover); transform: translateY(-1px); }
        .lead-cta:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .lead-cta svg { width: 13px; height: 13px; stroke: #fff; stroke-width: 2; fill: none; }
        .lead-foot { font-size: 11.5px; color: var(--muted); text-align: center; margin-top: 12px; line-height: 1.5; }
        .lead-success { background: rgba(45,90,79,0.08); border: 1px solid rgba(45,90,79,0.2); border-radius: 10px; padding: 18px; text-align: center; color: var(--accent); font-size: 14.5px; font-weight: 600; }
        .lead-error { font-size: 12px; color: #a14b2c; margin-top: 8px; text-align: center; }
        .footer { margin-top: 40px; padding-top: 22px; border-top: 1px solid var(--line-soft); text-align: center; font-size: 11px; color: var(--quiet); }
        .footer strong { color: var(--accent); font-weight: 700; }
        @media (max-width: 820px) {
          .hero { height: 360px; }
          .hero-title { font-size: 36px; }
          .hero-overlay { left: 22px; right: 22px; bottom: 22px; }
          .body { padding: 28px 22px 60px; }
          .status-strip { grid-template-columns: 1fr; gap: 18px; padding: 22px; }
          .status-item { padding: 0; border-right: none; border-bottom: 1px solid var(--line-soft); padding-bottom: 14px; }
          .status-item:last-child { border-bottom: none; padding-bottom: 0; }
          .thesis-card { padding: 26px 22px; }
          .thesis-card::before { font-size: 80px; }
          .thesis-content { padding-left: 24px; }
          .thesis-h2 { font-size: 22px; }
          .section-h2 { font-size: 24px; }
          .units-row { grid-template-columns: auto 1fr; gap: 12px; padding: 16px 18px; }
          .payment-detail, .payment-detail.cols-4 { grid-template-columns: 1fr; }
          .developer-stats { grid-template-columns: 1fr 1fr; gap: 16px; }
          .developer-stat { padding: 0; border-right: none; }
          .lead-card { padding: 24px 22px; }
          .lead-form { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wrap">
        {/* Agent Banner */}
        <header className="agent-banner">
          <div className="agent-avatar">
            {agent.photo_url ? <img src={agent.photo_url} alt={agentName} /> : initials(agentName)}
          </div>
          <div className="agent-info">
            <div className="agent-name">{agentName}</div>
            {(agent.brokerage_name || developer) && (
              <div className="agent-meta">{[agent.brokerage_name, developer ? `Authorised ${developer.name} broker` : null].filter(Boolean).join(' · ')}</div>
            )}
          </div>
          <div className="agent-actions">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="agent-action" title="Call">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" /></svg>
              </a>
            )}
            {agent.whatsapp && (
              <a href={`https://wa.me/${agent.whatsapp.replace(/\D/g, '')}`} className="agent-action wa" title="WhatsApp">
                <svg viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" fill="currentColor" /></svg>
              </a>
            )}
          </div>
        </header>

        {/* Hero */}
        <div className="hero">
          {dev.hero_image_url && <img src={dev.hero_image_url} alt={dev.name} className="hero-bg-img" />}
          {(dev.gallery_image_urls?.length ?? 0) > 0 && (
            <div className="hero-photo-count">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
              1 / {(dev.gallery_image_urls?.length ?? 0) + (dev.hero_image_url ? 1 : 0)}
            </div>
          )}
          <div className="hero-overlay">
            <div className="hero-eyebrow">Off-plan{developer ? ` · By ${developer.name}` : ''}</div>
            <h1 className="hero-title">{dev.name}</h1>
            <div className="hero-dev">
              {dev.property_type_label}
              {handover !== 'TBA' && <> · <strong>Handover {handover}</strong></>}
            </div>
          </div>
        </div>

        <main className="body">
          {/* Status strip — 2 columns only */}
          <div className="status-strip">
            <div className="status-item">
              <div className="status-label">Handover</div>
              <div className="status-value"><em>{handover}</em></div>
              {dev.handover_quarter && <div className="status-aux">Confirmed handover quarter</div>}
            </div>
            <div className="status-item">
              <div className="status-label">From</div>
              {lowestPrice && dev.show_prices_publicly ? (
                <>
                  <div className="status-value"><em>{fmtPrice(lowestPrice)}</em></div>
                  {dev.payment_plan_template && (
                    <div className="status-aux">{dev.payment_plan_template.replace(/_/g, ' / ').toUpperCase()} payment plan</div>
                  )}
                </>
              ) : (
                <div className="status-value" style={{ fontSize: '16px', fontFamily: 'Inter', marginTop: '4px' }}>Price on request</div>
              )}
            </div>
          </div>

          {/* Thesis — anchored high, immediately after status strip */}
          {dev.description && (
            <div className="thesis-section">
              <div className="eyebrow">From {agent.first_name ?? agentName}</div>
              <div className="thesis-card">
                <div className="thesis-content">
                  <h2 className="thesis-h2">Why I'm <em>recommending</em> this launch.</h2>
                  {dev.description.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} className="thesis-para" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                  <div className="thesis-author">
                    <div className="thesis-author-avatar">
                      {agent.photo_url ? <img src={agent.photo_url} alt={agentName} /> : initials(agentName)}
                    </div>
                    <div>
                      <div className="thesis-author-name">{agentName}</div>
                      <div className="thesis-author-role">
                        {[agent.years_experience && `${agent.years_experience} years in Dubai property`, agent.deals_closed && `${agent.deals_closed} transactions closed`].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unit mix */}
          {unitTypes.length > 0 && (
            <>
              <div className="section-head">
                <div className="section-eyebrow">Unit mix</div>
                <div className="section-meta">{unitTypes.length} type{unitTypes.length > 1 ? 's' : ''}{lowestPrice && dev.show_prices_publicly ? ` · From ${fmtPrice(lowestPrice)}` : ''}</div>
              </div>
              <h2 className="section-h2">Available unit <em>types</em></h2>
              <p className="section-intro">{dev.property_type_label} across {unitTypes.length} configuration{unitTypes.length > 1 ? 's' : ''}.</p>

              <div className="units-table">
                {unitTypes.map(ut => {
                  const bedsLabel = ut.beds_label ?? (ut.beds == null ? 'Studio' : `${ut.beds} bedroom${ut.beds > 1 ? 's' : ''}`)
                  const sizeLabel = ut.sqft_from && ut.sqft_to
                    ? `${ut.sqft_from.toLocaleString()} – ${ut.sqft_to.toLocaleString()} sqft`
                    : ut.sqft_from ? `From ${ut.sqft_from.toLocaleString()} sqft` : null
                  return (
                    <div key={ut.id} className="units-row">
                      <div className="unit-pill">{ut.label}</div>
                      <div>
                        <div className="unit-beds">{bedsLabel}</div>
                        {ut.beds_aux_text && <div className="unit-beds-sub">{ut.beds_aux_text}</div>}
                      </div>
                      <div>
                        {sizeLabel && <div className="unit-size">{sizeLabel}</div>}
                        {ut.aux_text && <div className="unit-size-sub">{ut.aux_text}</div>}
                      </div>
                      <div className="unit-price-col">
                        {ut.price_from && dev.show_prices_publicly ? (
                          <>
                            <div className="unit-price-from">From</div>
                            <div className="unit-price">{fmtPrice(ut.price_from, ut.price_currency)}</div>
                          </>
                        ) : (
                          <div className="unit-price hidden">Price on request</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Payment plan */}
          {paymentPlan.length > 0 && (
            <>
              <div className="section-head">
                <div className="section-eyebrow">Payment plan</div>
                {dev.payment_plan_template && <div className="section-meta">{dev.payment_plan_template.replace(/_/g, ' / ')}</div>}
              </div>
              <h2 className="section-h2">How <em>payment</em> is structured</h2>

              <div className="payment-card">
                <div className="payment-bar">
                  {paymentPlan.map((m, i) => (
                    <div
                      key={i}
                      className="payment-seg"
                      style={{ width: `${(m.pct / (totalPct || 100)) * 100}%`, background: phaseColor(m.phase) }}
                    >
                      <div className="payment-seg-pct">{m.pct}%</div>
                      <div className="payment-seg-lab">{m.phase.charAt(0).toUpperCase() + m.phase.slice(1)}</div>
                    </div>
                  ))}
                </div>
                <div className={`payment-detail${paymentPlan.length >= 4 ? ' cols-4' : ''}`}>
                  {paymentPlan.map((m, i) => (
                    <div key={i} className={`payment-detail-item ${phaseClass(m.phase)}`} style={{ borderColor: phaseColor(m.phase) }}>
                      <div className="payment-detail-pct">{m.pct}%</div>
                      <div className="payment-detail-when">{m.when}</div>
                      <div className="payment-detail-desc">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Developer card */}
          {developer && (
            <>
              <div className="section-head">
                <div className="section-eyebrow">The developer</div>
                <div className="section-meta">Track record matters</div>
              </div>
              <h2 className="section-h2">Why <em>{developer.name}</em> is the right name on this contract</h2>
              {developer.bio && <p className="section-intro">{developer.bio.substring(0, 180)}…</p>}

              <div className="developer-card">
                <div className="developer-top">
                  <div className="developer-logo">
                    {developer.logo_url
                      ? <img src={developer.logo_url} alt={developer.name} />
                      : (developer.short_code ?? developer.name.substring(0, 2).toUpperCase())
                    }
                  </div>
                  <div className="developer-info">
                    <div className="developer-name">{developer.name}</div>
                    {developer.tagline && <div className="developer-tagline">{developer.tagline}</div>}
                  </div>
                  {developer.verified && (
                    <span className="developer-verified">
                      <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                      Verified
                    </span>
                  )}
                </div>
                <div className="developer-body">
                  {(developer.years_operating || developer.units_delivered_label || developer.on_time_pct || developer.rera_rating) && (
                    <div className="developer-stats">
                      {developer.years_operating && (
                        <div className="developer-stat">
                          <div className="developer-stat-value">{developer.years_operating} yrs</div>
                          <div className="developer-stat-label">Operating</div>
                        </div>
                      )}
                      {developer.units_delivered_label && (
                        <div className="developer-stat">
                          <div className="developer-stat-value">{developer.units_delivered_label}</div>
                          <div className="developer-stat-label">Units delivered</div>
                        </div>
                      )}
                      {developer.on_time_pct && (
                        <div className="developer-stat">
                          <div className="developer-stat-value">{developer.on_time_pct}%</div>
                          <div className="developer-stat-label">On-time handover</div>
                        </div>
                      )}
                      {developer.rera_rating && (
                        <div className="developer-stat">
                          <div className="developer-stat-value">{developer.rera_rating}</div>
                          <div className="developer-stat-label">RERA rating</div>
                        </div>
                      )}
                    </div>
                  )}
                  {developer.bio && <p className="developer-bio">{developer.bio}</p>}
                </div>
              </div>
            </>
          )}

          {/* Lead capture */}
          <div className="section-head">
            <div className="section-eyebrow">Get the package</div>
            <div className="section-meta">Brochure · Floor plans · {agent.first_name ?? agentName}'s picks</div>
          </div>
          <h2 className="section-h2">Tell me what you're <em>thinking</em></h2>
          <p className="section-intro">
            I'll send the official brochure, floor plans for the unit types you're interested in, and a personal note with the best-value units in your budget — straight to your WhatsApp within the hour.
          </p>

          <div className="lead-card">
            {status === 'sent' ? (
              <div className="lead-success">✓ Done — {agent.first_name ?? agentName} will send you the brochure within the hour.</div>
            ) : (
              <form onSubmit={handleLead}>
                <div className="lead-form">
                  <div className="lead-field full">
                    <label className="lead-label">Your name</label>
                    <input className="lead-input" type="text" required placeholder="First &amp; last name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="lead-field">
                    <label className="lead-label">Email</label>
                    <input className="lead-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="lead-field">
                    <label className="lead-label">WhatsApp number</label>
                    <input className="lead-input" type="tel" placeholder="+971 50 ..." value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  </div>
                  <div className="lead-field">
                    <label className="lead-label">Interested in</label>
                    <select className="lead-select" value={form.interested_unit_type} onChange={e => setForm(f => ({ ...f, interested_unit_type: e.target.value }))}>
                      <option value="">Any unit type</option>
                      {unitTypes.map(ut => (
                        <option key={ut.id} value={ut.label}>
                          {ut.label}{ut.price_from && dev.show_prices_publicly ? ` (from ${fmtPrice(ut.price_from, ut.price_currency)})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lead-field">
                    <label className="lead-label">Purpose</label>
                    <select className="lead-select" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}>
                      <option value="investment">Investment</option>
                      <option value="move_in">Move-in</option>
                      <option value="holiday">Holiday home</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </div>
                </div>
                <button className="lead-cta" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : `Send me the brochure + ${agent.first_name ?? agentName}'s picks`}
                  {status !== 'sending' && (
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  )}
                </button>
                {status === 'error' && <div className="lead-error">Something went wrong. Please try again.</div>}
                <div className="lead-foot">No spam. One WhatsApp from {agent.first_name ?? agentName} within the hour, with everything attached.</div>
              </form>
            )}
          </div>

          <div className="footer">Powered by <strong>Agent Pages</strong></div>
        </main>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PublicDevelopment() {
  const { agentSlug, devSlug } = useParams()
  const [loading, setLoading] = useState(true)
  const [dev, setDev] = useState<Development | null>(null)
  const [agent, setAgent] = useState<Profile | null>(null)
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [leadCount, setLeadCount] = useState(0)

  useEffect(() => {
    if (!agentSlug || !devSlug) return
    ;(async () => {
      // 1. Fetch agent profile
      const { data: ag } = await supabase
        .schema('agent_pages')
        .from('profiles')
        .select('*')
        .eq('slug', agentSlug)
        .single()
      if (!ag) { setLoading(false); return }
      setAgent(ag)

      // 2. Fetch development by slug and workspace
      const { data: devRow } = await supabase
        .schema('agent_pages')
        .from('developments')
        .select('*')
        .eq('workspace_id', ag.workspace_id ?? ag.id)
        .eq('slug', devSlug)
        .eq('status', 'live')
        .single()
      if (!devRow) { setLoading(false); return }
      setDev(devRow)

      // 3. Parallel: unit types, developer, lead count
      const [utRes, devRes, countRes] = await Promise.all([
        supabase
          .schema('agent_pages')
          .from('unit_types')
          .select('*')
          .eq('development_id', devRow.id)
          .order('display_order'),
        devRow.developer_id
          ? supabase.from('developers').select('*').eq('id', devRow.developer_id).single()
          : Promise.resolve({ data: null }),
        supabase
          .schema('agent_pages')
          .from('development_leads')
          .select('id', { count: 'exact', head: true })
          .eq('development_id', devRow.id),
      ])

      setUnitTypes(utRes.data ?? [])
      if (devRes.data) setDeveloper(devRes.data)
      setLeadCount(countRes.count ?? 0)
      setLoading(false)
    })()
  }, [agentSlug, devSlug])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter,sans-serif', color: '#999', fontSize: '14px' }}>
      Loading…
    </div>
  )

  if (!dev || !agent) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter,sans-serif', color: '#999', fontSize: '14px' }}>
      Development not found.
    </div>
  )

  const agentName: string = agent.display_name || [agent.first_name, agent.last_name].filter(Boolean).join(' ') || 'Agent'

  if (dev.mode === 'full_info') {
    return (
      <FullInfoPage
        dev={dev}
        developer={developer}
        agent={agent}
        agentName={agentName}
        unitTypes={unitTypes}
      />
    )
  }

  return (
    <TeaserPage
      dev={dev}
      developer={developer}
      agent={agent}
      agentName={agentName}
      leadCount={leadCount}
    />
  )
}
