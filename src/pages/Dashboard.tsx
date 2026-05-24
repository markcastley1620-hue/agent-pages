import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Plus, ChevronRight, Eye, Calendar,
  Percent, Globe,
  ArrowUpRight, Star, Link as LinkIcon, Bell
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/* ── types ─────────────────────────────────────────────────────────────── */
interface Profile { first_name: string; last_name: string; email: string; plan: string }
interface MockLead { type: 'lead' | 'view' | 'book' | 'publish'; title: string; property: string; time: string; day: 'today' | 'yesterday' }

/* ── mock data ──────────────────────────────────────────────────────────── */
const MOCK_ACTIVITY: MockLead[] = []
const MOCK_TOP: { name: string; leads: number; views: number; color: string }[] = []
const MOCK_ATTENTION: { color: string; title: string; desc: string }[] = []

/* chart points for 7-day view (views + leads) */
const CHART_VIEWS  = [0, 0, 0, 0, 0, 0, 0]
const CHART_LEADS  = [0, 0, 0, 0, 0, 0, 0]
const CHART_DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildPath(data: number[], w: number, h: number, max: number) {
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  })
  return `M${pts.join(' L')}`
}

function buildArea(data: number[], w: number, h: number, max: number) {
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  })
  return `M0,${h} L${pts.join(' L')} L${w},${h} Z`
}

/* ── activity icon config ────────────────────────────────────────────────── */
function ActivityIcon({ type }: { type: MockLead['type'] }) {
  const cfg = {
    lead:    { icon: Users,     bg: '#d1fae5', color: '#059669' },
    view:    { icon: Eye,       bg: '#dbeafe', color: '#2563eb' },
    book:    { icon: Calendar,  bg: '#fef3c7', color: '#d97706' },
    publish: { icon: Globe,     bg: '#ede9fe', color: '#7c3aed' },
  }[type]
  const Icon = cfg.icon
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} color={cfg.color} />
    </div>
  )
}

/* ── helper: derive first name from profile + user email ─────────────────── */
function resolveFirstName(profile: Profile | null, userEmail?: string): string {
  if (profile?.first_name && profile.first_name.trim()) {
    return profile.first_name.trim()
  }
  const email = profile?.email || userEmail || ''
  if (email.includes('@')) {
    const part = email.split('@')[0]
    return part.charAt(0).toUpperCase() + part.slice(1)
  }
  return 'Friend'
}


/* ══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════════ */
function EmptyState({ firstName }: { firstName: string }) {
  const steps = [
    { label: 'Create your account',      desc: 'You\'re in — account created.',           done: true,  to: null },
    { label: 'Set up your agent profile', desc: 'Add your photo, bio, and contact info.',  done: false, to: '/onboarding' },
    { label: 'Add your first property',   desc: 'List a property and get a shareable page.', done: false, to: '/properties/new' },
    { label: 'Connect WhatsApp',          desc: 'Get lead alerts straight to your phone.',  done: false, to: '/settings' },
  ]
  const done = steps.filter(s => s.done).length
  const pct  = (done / steps.length) * 100
  // first incomplete index
  const nextIdx = steps.findIndex(s => !s.done)

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 920, margin: '0 auto' }}>

      {/* ── 1. Greeting ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.5px', marginBottom: 4 }}>
          Welcome,{' '}
          <span style={{ color: '#2d5a4f' }}>{firstName}.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Let's get your first property page live.</p>
      </div>

      {/* ── 2 + 3 + 4. Hero card ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #fbfaf7 0%, #f3eee3 100%)',
        border: '1px solid #ebe3d2',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        padding: '28px 32px',
        marginBottom: 24,
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 32,
        alignItems: 'center',
      }} className="hero-grid">

        {/* Soft emerald glow top-right */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(45,90,79,0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Left content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#2d5a4f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Get started</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.3px', marginBottom: 20, lineHeight: 1.35 }}>
            Your first page goes live<br />in under 5 minutes.
          </h2>
          <Link
            to="/properties/new"
            className="emerald-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#2d5a4f', color: '#fff',
              padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(45,90,79,0.2)',
              transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = '#234a40'
              el.style.boxShadow  = '0 8px 22px rgba(45,90,79,0.3)'
              el.style.transform  = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = '#2d5a4f'
              el.style.boxShadow  = '0 2px 6px rgba(45,90,79,0.2)'
              el.style.transform  = 'translateY(0)'
            }}
          >
            <Plus size={14} />
            Add your first property
          </Link>
        </div>

        {/* ── 4. Right-side mini preview card ─────────────────────────── */}
        <div className="hero-preview" style={{
          background: '#fff',
          border: '1px solid #f0f2f4',
          borderRadius: 14,
          padding: 16,
          boxShadow: '0 14px 36px rgba(15,20,25,0.06)',
          position: 'relative', zIndex: 1,
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2d5a4f, #3d8a76)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff',
            }}>SB</div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0f1419', lineHeight: 1.2 }}>Sarah Bennett</div>
              <div style={{ fontSize: 10, color: '#8b95a0' }}>Bennett &amp; Partners</div>
            </div>
          </div>
          {/* Hero image */}
          <div style={{
            height: 90,
            background: 'linear-gradient(135deg, #2d3e54 0%, #1a2535 40%, #c9a872 100%)',
            borderRadius: 8, marginBottom: 10,
          }} />
          {/* Title */}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f1419', marginBottom: 4 }}>Your property here</div>
          {/* Meta */}
          <div style={{ fontSize: 11, color: '#8b95a0', marginBottom: 8 }}>Photos · AI description · sold pricing</div>
          {/* Price */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f1419' }}>AED 2,850,000</div>
        </div>
      </div>

      {/* ── 5. Checklist ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 14, marginBottom: 24 }}>
        {/* Card header */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f1419' }}>Get set up</div>
              <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 2 }}>A quick walk-through to get you ready to close deals.</div>
            </div>
            <span style={{ fontSize: 12, color: '#8b95a0', marginTop: 2, flexShrink: 0 }}>{done} of {steps.length}</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: '#f0f2f4', borderRadius: 99, margin: '14px 0 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#3d8a76', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Rows */}
        <div>
          {steps.map((step, i) => {
            const isNext = !step.done && i === nextIdx
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px',
                  borderBottom: i < steps.length - 1 ? '1px solid #f0f2f4' : 'none',
                }}
              >
                {/* Circle */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.done ? '#3d8a76' : '#fff',
                  border: step.done ? 'none' : '1.5px solid #e6e8eb',
                }}>
                  {step.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: step.done ? '#8b95a0' : '#0f1419',
                    textDecoration: step.done ? 'line-through' : 'none',
                    lineHeight: 1.3,
                  }}>{step.label}</div>
                  <div style={{ fontSize: 12, color: '#8b95a0', marginTop: 1 }}>{step.desc}</div>
                </div>

                {/* Action button */}
                {!step.done && step.to && (
                  isNext ? (
                    <Link
                      to={step.to}
                      style={{
                        flexShrink: 0,
                        background: '#2d5a4f', color: '#fff',
                        padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(45,90,79,0.2)',
                      }}
                    >Start</Link>
                  ) : (
                    <Link
                      to={step.to}
                      style={{
                        flexShrink: 0,
                        background: '#fff', color: '#0f1419',
                        border: '1px solid #e6e8eb',
                        padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        textDecoration: 'none',
                      }}
                    >Start</Link>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 6. Three encouraging stat cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="stat-grid">
        {[
          {
            Icon: Star,
            title: 'AI does the writing',
            desc: 'Unique, SEO-tuned descriptions generated from your property details. Three tone options.',
          },
          {
            Icon: LinkIcon,
            title: 'URLs that get shared',
            desc: 'Memorable links like 4bedroomvillainmeadows.com on Pro+ — printable, callable, shareable.',
          },
          {
            Icon: Bell,
            title: 'Leads, three ways',
            desc: 'WhatsApp + email + dashboard inbox. The moment a buyer enquires, you know.',
          },
        ].map(({ Icon, title, desc }, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: '#e8f0ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Icon size={15} color="#2d5a4f" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1419', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#8b95a0', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ACTIVE STATE
═══════════════════════════════════════════════════════════════════════════ */
function ActiveState({ firstName }: {
  firstName: string; propertiesCount: number; leadsCount: number
}) {
  const [chartTab, setChartTab] = useState<'7' | '30' | '90'>('7')

  const kpis = [
    { label: 'New leads',       value: 0,      icon: Users,     iconBg: '#d1fae5', iconColor: '#059669', trend: '—', footer: 'vs. yesterday' },
    { label: 'Page views',      value: 0,      icon: Eye,       iconBg: '#dbeafe', iconColor: '#2563eb', trend: '—', footer: 'last 7 days' },
    { label: 'Viewings booked', value: 0,      icon: Calendar,  iconBg: '#fef3c7', iconColor: '#d97706', trend: '—', footer: 'this week' },
    { label: 'Lead conversion', value: '0.0%', icon: Percent,   iconBg: '#fff7ed', iconColor: '#ea580c', trend: '—', footer: 'vs. last month' },
  ]

  const maxViewVal = 120
  const W = 480; const H = 90

  const todayActivity = MOCK_ACTIVITY.filter(a => a.day === 'today')
  const yestActivity  = MOCK_ACTIVITY.filter(a => a.day === 'yesterday')
  const hasActivity = todayActivity.length > 0 || yestActivity.length > 0

  return (
    <div style={{ padding: '32px 32px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.5px', marginBottom: 4 }}>
          Welcome back, <span style={{ color: '#2d5a4f' }}>{firstName}.</span>
        </h1>
        <p style={{ fontSize: 13, color: '#8b95a0' }}>
          Add your first property to start tracking leads and views.
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="kpi-grid">
        {kpis.map(({ label, value, icon: Icon, iconBg, iconColor, trend, footer }, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={iconColor} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: '#f0f2f4', color: '#8b95a0',
                padding: '2px 7px', borderRadius: 100
              }}>{trend}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#8b95a0' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#b0bac5', marginTop: 2 }}>{footer}</div>
          </div>
        ))}
      </div>

      {/* Body grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }} className="body-grid">
        {/* LEFT col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Activity feed */}
          <div style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1419' }}>Activity</span>
              <Link to="/leads" style={{ fontSize: 12, color: '#2d5a4f', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
            </div>
            <div style={{ padding: '0 22px 4px' }}>
              {!hasActivity ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#8b95a0', fontSize: 13 }}>
                  No activity yet — add your first property to get started.
                </div>
              ) : (
                [{ label: 'Today', items: todayActivity }, { label: 'Yesterday', items: yestActivity }].map(group => (
                  group.items.length > 0 && (
                    <div key={group.label}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#b0bac5', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 0 8px' }}>{group.label}</div>
                      {group.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < group.items.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                          <ActivityIcon type={item.type} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: '#0f1419', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title.split(item.property)[0]}
                              <Link to="/properties" style={{ color: '#2d5a4f', textDecoration: 'none', fontWeight: 600 }}>{item.property}</Link>
                              {item.title.split(item.property)[1]}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: '#b0bac5', flexShrink: 0 }}>{item.time}</span>
                        </div>
                      ))}
                    </div>
                  )
                ))
              )}
            </div>
          </div>

          {/* Performance chart */}
          <div style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1419' }}>Performance</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['7', '30', '90'] as const).map(t => (
                  <button key={t} onClick={() => setChartTab(t)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                    background: chartTab === t ? '#2d5a4f' : 'transparent',
                    color: chartTab === t ? '#fff' : '#8b95a0'
                  }}>{t}d</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 22px' }}>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 28, marginBottom: 16 }}>
                {[
                  { label: 'Views', value: '0', color: '#2563eb' },
                  { label: 'Leads', value: '0',   color: '#2d5a4f' },
                  { label: 'Conversion', value: '0.0%', color: '#d97706' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1419', letterSpacing: '-0.3px' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#8b95a0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG chart */}
              <div style={{ position: 'relative', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', minWidth: 260 }}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2d5a4f" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2d5a4f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((r, i) => (
                    <line key={i} x1="0" y1={H * r} x2={W} y2={H * r} stroke="#f0f2f4" strokeWidth="1" />
                  ))}
                  <path d={buildArea(CHART_VIEWS, W, H, maxViewVal)} fill="url(#gv)" />
                  <path d={buildPath(CHART_VIEWS, W, H, maxViewVal)} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={buildArea(CHART_LEADS, W, H, Math.max(...CHART_LEADS) * 1.5)} fill="url(#gl)" />
                  <path d={buildPath(CHART_LEADS, W, H, Math.max(...CHART_LEADS) * 1.5)} fill="none" stroke="#2d5a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {CHART_DAYS.map((d, i) => (
                    <text key={i} x={(i / (CHART_DAYS.length - 1)) * W} y={H + 18} textAnchor="middle" fontSize="10" fill="#b0bac5">{d}</text>
                  ))}
                </svg>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                {[{ color: '#2563eb', label: 'Views' }, { color: '#2d5a4f', label: 'Leads' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8b95a0' }}>
                    <div style={{ width: 16, height: 2, background: l.color, borderRadius: 1 }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Needs attention */}
          <div style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1419' }}>Needs attention</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {MOCK_ATTENTION.length === 0 ? (
                <div style={{ padding: '32px 22px', textAlign: 'center', color: '#8b95a0', fontSize: 13 }}>
                  Nothing needs your attention right now.
                </div>
              ) : MOCK_ATTENTION.map(({ color, title, desc }, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px',
                  borderBottom: i < MOCK_ATTENTION.length - 1 ? '1px solid #f9f9f9' : 'none',
                  cursor: 'pointer'
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1419' }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#8b95a0', marginTop: 1 }}>{desc}</div>
                  </div>
                  <ChevronRight size={14} color="#c8cdd3" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Top performing */}
          <div style={{ background: '#fff', border: '1px solid #f0f2f4', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f1419' }}>Top pages</span>
              <Link to="/properties" style={{ fontSize: 12, color: '#2d5a4f', textDecoration: 'none', fontWeight: 500 }}>See all</Link>
            </div>
            <div style={{ padding: '8px 0' }}>
              {MOCK_TOP.length === 0 ? (
                <div style={{ padding: '32px 22px', textAlign: 'center', color: '#8b95a0', fontSize: 13 }}>
                  No pages published yet.
                </div>
              ) : MOCK_TOP.map(({ name, leads, views, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#0f1419', flex: 1, fontWeight: 500 }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#2d5a4f', fontWeight: 600 }}>{leads} leads</span>
                  <span style={{ fontSize: 11, color: '#8b95a0' }}>{views}v</span>
                  <span style={{ fontSize: 11, color: '#c8cdd3', minWidth: 16, textAlign: 'right' }}>#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add property CTA */}
          <Link
            to="/properties/new"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#2d5a4f', color: '#fff',
              padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(45,90,79,0.2)',
              transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = '#234a40'
              el.style.boxShadow  = '0 8px 22px rgba(45,90,79,0.3)'
              el.style.transform  = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = '#2d5a4f'
              el.style.boxShadow  = '0 2px 6px rgba(45,90,79,0.2)'
              el.style.transform  = 'translateY(0)'
            }}
          >
            <Plus size={15} />
            Add property
            <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [propertiesCount, setPropertiesCount] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.schema('agent_pages').from('profiles').select('first_name, last_name, email, plan').eq('id', user.id).single(),
      supabase.from('properties').select('id', { count: 'exact' }).eq('agent_id', user.id),
      supabase.from('leads').select('id', { count: 'exact' }).eq('agent_id', user.id),
    ]).then(([p, props, leads]) => {
      setProfile(p.data as Profile)
      setPropertiesCount(props.count ?? 0)
      setLeadsCount(leads.count ?? 0)
      setLoading(false)
    })
  }, [user])

  // Fix 1: never fall back to "there"
  const firstName = resolveFirstName(profile, user?.email)

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 979px) {
          .kpi-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .body-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: 1fr !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-preview { display: none !important; }
        }
      `}</style>
      <div style={{ background: '#f7f8f9', minHeight: 'calc(100vh - 60px)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#2d5a4f', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : propertiesCount === 0 ? (
          <EmptyState firstName={firstName} />
        ) : (
          <ActiveState firstName={firstName} propertiesCount={propertiesCount} leadsCount={leadsCount} />
        )}
      </div>
    </>
  )
}
